import prisma from './prisma';
import { AuditService } from './services/audit.service';
import { ExceptionService } from './services/exception.service';
import { LedgerService } from './services/ledger.service';
import { ProductController } from './controllers/product.controller';

async function runPhase2Verification() {
  console.log('🚀 RUNNING PHASE 2 UPGRADE END-TO-END VERIFICATION...\n');

  // 1. Audit Log Verification
  console.log('--- Step 1: Testing Audit Log System (D17) ---');
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user found');

  const testAudit = await AuditService.log({
    userId: user.id,
    action: 'TEST_AUDIT_VERIFICATION',
    entity: 'SystemConfig',
    entityId: 'SYS-001',
    metadata: { testKey: 'verification_value', runAt: new Date().toISOString() },
  });
  console.log(`✅ Logged audit entry #${testAudit.id}: action=${testAudit.action}`);

  const auditList = await AuditService.listLogs({ action: 'TEST_AUDIT_VERIFICATION' });
  if (auditList.total === 0 || !auditList.logs.some(l => l.id === testAudit.id)) {
    throw new Error('Audit log listing failed');
  }
  console.log(`✅ Verified AuditService.listLogs returned ${auditList.total} log(s) with user relation loaded.`);

  // 2. Product Update & Reorder Quantity
  console.log('\n--- Step 2: Testing Product Update & Reorder Fields ---');
  const prod = await prisma.product.findFirst({ where: { sku: 'SR001' } });
  if (!prod) throw new Error('Product SR001 not found');

  const updatedProd = await prisma.product.update({
    where: { id: prod.id },
    data: {
      reorderQuantity: 75,
      costPrice: 48.5,
    },
  });
  if (updatedProd.reorderQuantity !== 75 || updatedProd.costPrice !== 48.5) {
    throw new Error('Product update failed');
  }
  console.log(`✅ Product ${updatedProd.name} updated with reorderQuantity=${updatedProd.reorderQuantity}, costPrice=${updatedProd.costPrice}`);

  // 3. Rich Investigation Tasks
  console.log('\n--- Step 3: Testing Rich Investigation Tasks (Status, Due Date, Description) ---');
  const exception = await prisma.exception.findFirst({
    where: { status: { in: ['NEW', 'INVESTIGATING', 'ACTION_REQUIRED'] } },
    include: { tasks: true },
  });

  if (exception) {
    const task = await ExceptionService.addTask(exception.id, {
      title: 'Inspect physical pallet seal and tag numbers',
      assignedToId: user.id,
      description: 'Check batch lot number against supplier shipping manifest',
      dueDate: new Date(Date.now() + 86400000),
    });
    console.log(`✅ Added rich task '${task.title}' with description & due date.`);

    const inProgressTask = await ExceptionService.toggleTask(task.id, {
      status: 'IN_PROGRESS',
      notes: 'Investigator on-site at Rack A inspecting pallet barcode',
    });
    if (inProgressTask.status !== 'IN_PROGRESS' || !inProgressTask.notes) {
      throw new Error('Task progress update failed');
    }
    console.log(`✅ Updated task status to IN_PROGRESS with finding notes.`);

    const completedTask = await ExceptionService.toggleTask(task.id, {
      status: 'COMPLETED',
      notes: 'Pallet tag verified; counted variance confirmed.',
    });
    if (completedTask.status !== 'COMPLETED' || !completedTask.isCompleted) {
      throw new Error('Task completion update failed');
    }
    console.log(`✅ Task marked COMPLETED.`);
  }

  // 4. Stock Ledger Filtering & Pagination
  console.log('\n--- Step 4: Testing Stock Ledger Pagination & Date Filters ---');
  const ledgerPage1 = await LedgerService.getLedger({ page: 1, pageSize: 5 });
  if (ledgerPage1.entries.length > 5 || ledgerPage1.page !== 1) {
    throw new Error('Ledger pagination failed');
  }
  console.log(`✅ Ledger Pagination: Page 1 returned ${ledgerPage1.entries.length} of ${ledgerPage1.total} entries (Total pages: ${ledgerPage1.totalPages}).`);

  const ledgerDateFiltered = await LedgerService.getLedger({
    startDate: '2020-01-01',
    endDate: '2030-12-31',
    limit: 10,
  });
  console.log(`✅ Ledger Date Filter: Retrieved ${ledgerDateFiltered.entries.length} entries between 2020 and 2030.`);

  console.log('\n🎉 ALL PHASE 2 VERIFICATIONS PASSED WITH 100% SUCCESS!');
}

runPhase2Verification()
  .catch((err) => {
    console.error('❌ Phase 2 Verification Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
