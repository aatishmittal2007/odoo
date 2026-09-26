import prisma from '../prisma';
import { ExceptionStatus } from '../types';
import { BusinessImpactService } from './business-impact';
import { StockService } from './stock.service';
import { LedgerService } from './ledger.service';
import { ExceptionEngine } from './exception-engine';

export class ExceptionService {
  static async listExceptions(filters?: {
    status?: string;
    severity?: string;
    type?: string;
    warehouseId?: string;
    locationId?: string;
    productId?: string;
    ownerId?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status && filters.status !== 'ALL') {
      if (filters.status === 'OPEN') {
        where.status = { in: [ExceptionStatus.NEW, ExceptionStatus.INVESTIGATING, ExceptionStatus.ACTION_REQUIRED] };
      } else {
        where.status = filters.status;
      }
    }
    if (filters?.severity && filters.severity !== 'ALL') {
      where.severity = filters.severity;
    }
    if (filters?.type && filters.type !== 'ALL') {
      where.type = filters.type;
    }
    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
    if (filters?.locationId) {
      where.locationId = filters.locationId;
    }
    if (filters?.productId) {
      where.productId = filters.productId;
    }
    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }
    if (filters?.search) {
      where.OR = [
        { exceptionNumber: { contains: filters.search } },
        { sku: { contains: filters.search } },
        { notes: { contains: filters.search } },
        { product: { name: { contains: filters.search } } },
      ];
    }

    return await prisma.exception.findMany({
      where,
      orderBy: [
        { severity: 'asc' }, // Will sort in application or prisma
        { createdAt: 'desc' },
      ],
      include: {
        product: { select: { id: true, name: true, sku: true, uom: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        location: { select: { id: true, name: true, code: true, rack: true, shelf: true } },
        owner: { select: { id: true, name: true, email: true } },
        resolution: true,
        tasks: true,
      },
    });
  }

  static async getExceptionDetails(idOrNumber: string) {
    const exception = await prisma.exception.findFirst({
      where: {
        OR: [
          { id: idOrNumber },
          { exceptionNumber: idOrNumber },
        ],
      },
      include: {
        product: {
          include: {
            stockBalances: {
              include: { warehouse: true, location: true },
            },
            physicalCounts: {
              orderBy: { countedAt: 'desc' },
              take: 5,
            },
          },
        },
        warehouse: true,
        location: true,
        owner: { select: { id: true, name: true, email: true, role: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
        evidence: {
          orderBy: { timestamp: 'desc' },
        },
        investigation: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        tasks: {
          orderBy: { sortOrder: 'asc' },
          include: {
            assignedTo: { select: { id: true, name: true } },
          },
        },
        resolution: true,
      },
    });

    if (!exception) {
      throw new Error('Exception not found');
    }

    // Determine latest physical count values
    const latestCount = exception.product.physicalCounts[0];
    const systemQuantity = exception.product.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
    const physicalQuantity = latestCount ? latestCount.physicalQuantity : systemQuantity;
    const variance = latestCount ? latestCount.variance : 0;
    const variancePercentage = latestCount ? latestCount.variancePercentage : 0;

    // Build chronological timeline of inventory events for this product
    const ledgerEvents = await prisma.stockLedger.findMany({
      where: { productId: exception.productId },
      orderBy: { timestamp: 'asc' },
      take: 20,
    });

    const timeline = ledgerEvents.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      operation: e.operation,
      referenceType: e.referenceType,
      referenceId: e.referenceId,
      source: e.sourceName,
      destination: e.destName,
      quantityChange: e.quantityChange,
      balanceAfter: e.balanceAfter,
      notes: e.notes,
    }));

    // If there is a physical count, add it to the timeline in sequence
    if (latestCount) {
      timeline.push({
        id: latestCount.id,
        timestamp: latestCount.countedAt,
        operation: 'PHYSICAL_COUNT',
        referenceType: 'PHYSICAL_COUNT',
        referenceId: latestCount.countNumber,
        source: `${exception.warehouse.name} / ${exception.location.name}`,
        destination: `Physical Verified: ${latestCount.physicalQuantity} units`,
        quantityChange: latestCount.variance,
        balanceAfter: latestCount.physicalQuantity,
        notes: `Physical verification recorded variance of ${latestCount.variance}`,
      });
      // Sort timeline chronologically
      timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    // Calculate Business Impact
    const businessImpact = await BusinessImpactService.calculateImpact(exception.productId);

    // Potential Investigation Areas (Deterministic, Explainable hints for human investigator)
    const potentialInvestigationAreas = [
      {
        area: 'Recent Internal Transfers',
        description: 'Verify if stock was physically moved between Rack A, Rack B, or secondary locations without updating system transfer receipts.',
        relevance: 'HIGH',
      },
      {
        area: 'Recent Outbound Delivery Picking',
        description: 'Check if recent customer orders were over-picked, packed from alternate bins, or staged prematurely without dispatch documentation.',
        relevance: 'MEDIUM',
      },
      {
        area: 'Inbound Receiving Verification',
        description: 'Cross-check supplier delivery notes against physical carton counts received at the receiving dock.',
        relevance: 'MEDIUM',
      },
      {
        area: 'Physical Location & Label Audit',
        description: 'Audit adjacent storage racks and staging bins for misfiled inventory or misplaced SKUs.',
        relevance: 'HIGH',
      },
      {
        area: 'Damaged or Quarantined Stock',
        description: 'Verify if unsellable or damaged items were physically set aside without recording a write-off adjustment.',
        relevance: 'MEDIUM',
      },
    ];

    return {
      exception,
      summary: {
        systemQuantity,
        physicalQuantity,
        variance,
        variancePercentage,
        locationName: `${exception.warehouse.name} / ${exception.location.name}`,
      },
      timeline,
      potentialInvestigationAreas,
      businessImpact,
    };
  }

  static async startInvestigation(data: {
    exceptionId: string;
    assignedToId: string;
    priority: string;
    dueDate?: Date;
    reason?: string;
    notes?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const found = await tx.exception.findFirst({
        where: { OR: [{ id: data.exceptionId }, { exceptionNumber: data.exceptionId }] },
      });
      if (!found) throw new Error('Exception not found');
      const actualId = found.id;

      // Upsert investigation
      const investigation = await tx.investigation.upsert({
        where: { exceptionId: actualId },
        update: {
          assignedToId: data.assignedToId,
          priority: data.priority,
          dueDate: data.dueDate,
          reason: data.reason,
          notes: data.notes,
        },
        create: {
          exceptionId: actualId,
          assignedToId: data.assignedToId,
          priority: data.priority,
          dueDate: data.dueDate,
          reason: data.reason,
          notes: data.notes,
        },
      });

      // Update exception status to INVESTIGATING
      const updatedException = await tx.exception.update({
        where: { id: actualId },
        data: {
          status: ExceptionStatus.INVESTIGATING,
          ownerId: data.assignedToId,
          dueDate: data.dueDate,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          investigation: true,
          tasks: true,
        },
      });

      // Audit log entry (D17)
      const { AuditService } = await import('./audit.service');
      await AuditService.log({
        userId: data.assignedToId,
        action: 'INVESTIGATION_START',
        entity: 'Exception',
        entityId: actualId,
        metadata: {
          exceptionNumber: found.exceptionNumber,
          priority: data.priority,
          reason: data.reason,
        },
      }, tx);

      return { investigation, exception: updatedException };
    });
  }

  static async toggleTask(
    taskId: string,
    paramsOrIsCompleted:
      | boolean
      | {
          isCompleted?: boolean;
          status?: string;
          userId?: string;
          notes?: string;
          description?: string;
          dueDate?: Date;
        },
    userId?: string,
    notes?: string
  ) {
    let isComp: boolean;
    let taskStatus: string;
    let actualUserId = userId;
    let actualNotes = notes;
    let description: string | undefined;
    let dueDate: Date | undefined;

    if (typeof paramsOrIsCompleted === 'boolean') {
      isComp = paramsOrIsCompleted;
      taskStatus = isComp ? 'COMPLETED' : 'TODO';
    } else {
      isComp = paramsOrIsCompleted.isCompleted ?? (paramsOrIsCompleted.status === 'COMPLETED');
      taskStatus = paramsOrIsCompleted.status || (isComp ? 'COMPLETED' : 'TODO');
      actualUserId = paramsOrIsCompleted.userId || userId;
      actualNotes = paramsOrIsCompleted.notes !== undefined ? paramsOrIsCompleted.notes : notes;
      description = paramsOrIsCompleted.description;
      dueDate = paramsOrIsCompleted.dueDate;
    }

    const updated = await prisma.investigationTask.update({
      where: { id: taskId },
      data: {
        isCompleted: isComp,
        status: taskStatus,
        completedAt: isComp ? new Date() : null,
        completedBy: isComp ? actualUserId || null : null,
        notes: actualNotes !== undefined ? actualNotes : undefined,
        description: description !== undefined ? description : undefined,
        dueDate: dueDate !== undefined ? dueDate : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Audit log entry (D17)
    const { AuditService } = await import('./audit.service');
    await AuditService.log({
      userId: actualUserId,
      action: 'TASK_UPDATE',
      entity: 'InvestigationTask',
      entityId: taskId,
      metadata: { title: updated.title, status: taskStatus, isCompleted: isComp },
    });

    return updated;
  }

  static async addTask(
    paramOrId: string | {
      exceptionId: string;
      title: string;
      description?: string;
      assignedToId?: string;
      dueDate?: Date;
      userId?: string;
    },
    data?: {
      title: string;
      description?: string;
      assignedToId?: string;
      dueDate?: Date;
      userId?: string;
    }
  ) {
    const rawExceptionId = typeof paramOrId === 'string' ? paramOrId : paramOrId.exceptionId;
    const taskData = typeof paramOrId === 'string' ? data! : paramOrId;

    const found = await prisma.exception.findFirst({
      where: { OR: [{ id: rawExceptionId }, { exceptionNumber: rawExceptionId }] },
    });
    if (!found) throw new Error('Exception not found');
    const actualId = found.id;

    const currentMax = await prisma.investigationTask.count({ where: { exceptionId: actualId } });
    const task = await prisma.investigationTask.create({
      data: {
        exceptionId: actualId,
        title: taskData.title,
        description: taskData.description || null,
        assignedToId: taskData.assignedToId || null,
        dueDate: taskData.dueDate || null,
        status: 'TODO',
        sortOrder: currentMax + 1,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Audit log entry (D17)
    const { AuditService } = await import('./audit.service');
    await AuditService.log({
      userId: taskData.userId,
      action: 'TASK_CREATE',
      entity: 'InvestigationTask',
      entityId: task.id,
      metadata: { title: task.title, exceptionNumber: found.exceptionNumber },
    });

    return task;
  }

  static async resolveException(data: {
    exceptionId: string;
    rootCause: string;
    explanation?: string;
    correctiveAction?: string;
    resolutionNotes?: string;
    userId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const exception = await tx.exception.findFirst({
        where: { OR: [{ id: data.exceptionId }, { exceptionNumber: data.exceptionId }] },
        include: {
          product: {
            include: {
              physicalCounts: { orderBy: { countedAt: 'desc' }, take: 1 },
            },
          },
          warehouse: true,
          location: true,
        },
      });

      if (!exception) {
        throw new Error('Exception not found');
      }

      // Record resolution
      const resolution = await tx.exceptionResolution.upsert({
        where: { exceptionId: exception.id },
        update: {
          rootCause: data.rootCause,
          explanation: data.explanation,
          correctiveAction: data.correctiveAction,
          resolutionNotes: data.resolutionNotes,
          resolvedAt: new Date(),
          resolvedBy: data.userId || null,
        },
        create: {
          exceptionId: exception.id,
          rootCause: data.rootCause,
          explanation: data.explanation,
          correctiveAction: data.correctiveAction,
          resolutionNotes: data.resolutionNotes,
          resolvedAt: new Date(),
          resolvedBy: data.userId || null,
        },
      });

      // If corrective action is ADJUST_INVENTORY or physical count reconciliation
      if (data.correctiveAction === 'ADJUST_INVENTORY') {
        const latestCount = exception.product.physicalCounts[0];
        if (latestCount && latestCount.variance !== 0) {
          // Adjust stock to match physical count
          const { totalCompanyStock } = await StockService.adjustLocationStock(
            {
              productId: exception.productId,
              warehouseId: exception.warehouseId,
              locationId: exception.locationId,
              quantityDelta: latestCount.variance,
            },
            tx
          );

          // Record in Stock Ledger
          await LedgerService.record(
            {
              productId: exception.productId,
              sku: exception.sku,
              operation: 'COUNT_RECONCILE',
              referenceType: 'PHYSICAL_COUNT',
              referenceId: latestCount.countNumber,
              sourceName: `${exception.warehouse.name} / ${exception.location.name}`,
              destName: `Reconciliation (${data.rootCause})`,
              quantityChange: latestCount.variance,
              balanceAfter: totalCompanyStock,
              userId: data.userId,
              notes: `Exception ${exception.exceptionNumber} resolved. Reconciled inventory to physical count of ${latestCount.physicalQuantity}. Explanation: ${data.explanation || data.rootCause}.`,
            },
            tx
          );

          // Mark count reconciled
          await tx.physicalCount.update({
            where: { id: latestCount.id },
            data: { status: 'RECONCILED' },
          });
        }
      }

      // Update exception status to RESOLVED
      const updatedException = await tx.exception.update({
        where: { id: exception.id },
        data: {
          status: ExceptionStatus.RESOLVED,
          resolvedAt: new Date(),
          resolvedById: data.userId || null,
        },
        include: {
          resolution: true,
          product: true,
          warehouse: true,
          location: true,
        },
      });

      // Re-evaluate product rules
      await ExceptionEngine.evaluateProductRules(exception.productId, tx);

      // Audit log entry (D17)
      const { AuditService } = await import('./audit.service');
      await AuditService.log({
        userId: data.userId,
        action: 'RESOLUTION_SUBMIT',
        entity: 'Exception',
        entityId: exception.id,
        metadata: {
          exceptionNumber: exception.exceptionNumber,
          rootCause: data.rootCause,
          correctiveAction: data.correctiveAction,
        },
      }, tx);

      return { exception: updatedException, resolution };
    });
  }
}
