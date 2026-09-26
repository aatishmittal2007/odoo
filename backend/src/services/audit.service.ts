import prisma from '../prisma';

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: any;
}

export class AuditService {
  /**
   * Record an immutable audit log entry (Data Store D17)
   */
  static async log(params: CreateAuditLogParams, tx?: any) {
    try {
      const client = tx || prisma;
      return await client.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
      return null;
    }
  }

  /**
   * Retrieve filtered audit logs with user relation
   */
  static async listLogs(filters?: {
    entity?: string;
    action?: string;
    userId?: string;
    entityId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.action) where.action = filters.action;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.entityId) where.entityId = filters.entityId;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ]);

    return { total, logs };
  }
}
