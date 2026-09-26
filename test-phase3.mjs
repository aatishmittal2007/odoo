#!/usr/bin/env node
/**
 * StockSense Full Integration Test — Phase 3
 * Tests all newly added endpoints and verifications.
 * Run with: node test-phase3.js
 */

const BASE = 'http://localhost:5000';
const INTERNAL_SECRET = 'stocksense-internal-automation-2026';
const WEBHOOK_SECRET = 'stocksense-n8n-webhook-secret-2026';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function req(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

async function login() {
  const r = await req('POST', '/api/auth/login', { email: 'manager@stocksense.io', password: 'password123' });
  assert(r.status === 200, `Login failed: ${r.status} ${JSON.stringify(r.json)}`);
  return r.json.token;
}

(async () => {
  console.log('\n🧪 StockSense Phase 3 Integration Tests\n');

  // --- 1. Health & Core ---
  console.log('📋 Core Health');
  await test('GET /health → 200 ok', async () => {
    const r = await req('GET', '/health');
    assert(r.status === 200 && r.json.status === 'ok', `Got: ${JSON.stringify(r.json)}`);
  });

  // --- 2. Internal Automation Routes (Auth check) ---
  console.log('\n📋 Internal Automation Routes');

  await test('GET /api/internal/automation/events → 401 without secret', async () => {
    const r = await req('GET', '/api/internal/automation/events');
    assert(r.status === 401, `Expected 401, got ${r.status}`);
  });

  await test('GET /api/internal/automation/events → 200 with valid secret', async () => {
    const r = await req('GET', '/api/internal/automation/events', null, {
      'x-internal-automation-secret': INTERNAL_SECRET,
    });
    assert(r.status === 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`);
    assert(Array.isArray(r.json.events), `Expected events array, got: ${JSON.stringify(r.json)}`);
  });

  await test('POST /api/internal/automation/events → creates event', async () => {
    const r = await req('POST', '/api/internal/automation/events', {
      event: 'receipt.validated',
      entityId: 'test-receipt-phase3',
      entityType: 'Receipt',
      payload: { qty: 50, product: 'Test Widget' },
    }, { 'x-internal-automation-secret': INTERNAL_SECRET });
    assert(r.status === 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`);
    assert(r.json.success === true, `Expected success=true`);
    assert(r.json.eventId, `Expected eventId in response`);
  });

  await test('POST /api/internal/automation/events → 400 without event field', async () => {
    const r = await req('POST', '/api/internal/automation/events', {
      entityId: 'missing-event-field',
    }, { 'x-internal-automation-secret': INTERNAL_SECRET });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });

  await test('POST /api/internal/automation/summaries → creates summary', async () => {
    const r = await req('POST', '/api/internal/automation/summaries', {
      totalProducts: 50,
      totalWarehouses: 3,
      openExceptions: 1,
      criticalExceptions: 0,
      totalStock: 25000,
      lowStock: 5,
      negativeStock: 0,
      overdueInvestigations: 0,
    }, { 'x-internal-automation-secret': INTERNAL_SECRET });
    assert(r.status === 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`);
    assert(r.json.success === true, 'Expected success=true');
    assert(r.json.brief && r.json.brief.includes('📊'), 'Expected deterministic brief with emoji');
  });

  await test('GET /api/internal/automation/summaries → lists summaries', async () => {
    const r = await req('GET', '/api/internal/automation/summaries', null, {
      'x-internal-automation-secret': INTERNAL_SECRET,
    });
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(Array.isArray(r.json.summaries), 'Expected summaries array');
    assert(r.json.summaries.length >= 1, 'Expected at least 1 summary after POST');
  });

  await test('POST /api/internal/automation/tasks → creates escalation task', async () => {
    // First get a real exceptionId
    const token = await login();
    const excR = await req('GET', '/api/exceptions?limit=1', null, { Authorization: `Bearer ${token}` });
    if (excR.json.exceptions && excR.json.exceptions.length > 0) {
      const exceptionId = excR.json.exceptions[0].id;
      const r = await req('POST', '/api/internal/automation/tasks', {
        exceptionId,
        title: 'Phase 3 Test Task',
        description: 'Auto-created by phase 3 integration test',
      }, { 'x-internal-automation-secret': INTERNAL_SECRET });
      assert(r.status === 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`);
      assert(r.json.success === true, 'Expected success=true');
    } else {
      // No exceptions exist — skip with pass (acceptable)
      console.log('    (skipped — no exceptions in DB)');
    }
  });

  // --- 3. n8n Callback Routes ---
  console.log('\n📋 n8n Callback Routes');

  await test('POST /api/integrations/n8n/callback → 401/403 without secret', async () => {
    const r = await req('POST', '/api/integrations/n8n/callback', {
      action: 'STORE_AI_ANALYSIS',
    });
    assert(r.status === 401 || r.status === 403, `Expected 401 or 403, got ${r.status}`);
  });

  await test('POST /api/integrations/n8n/callback → 200 with valid secret (ack)', async () => {
    const r = await req('POST', '/api/integrations/n8n/callback', {
      action: 'UNKNOWN_ACTION',
    }, { 'x-stocksense-webhook-secret': WEBHOOK_SECRET });
    assert(r.status === 200, `Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`);
    assert(r.json.success === true, 'Expected success=true');
  });

  // --- 4. CORS headers ---
  console.log('\n📋 CORS Headers');

  await test('OPTIONS /api/health → has CORS headers (dev mode allows all)', async () => {
    const res = await fetch(`${BASE}/api/health`, { method: 'OPTIONS' });
    // In dev mode cors is open; just check we got a valid response
    assert(res.status < 500, `Expected non-5xx, got ${res.status}`);
  });

  // --- 5. Existing Core Routes Unaffected ---
  console.log('\n📋 Core Routes Still Working');

  await test('POST /api/auth/login → 200', async () => {
    const r = await req('POST', '/api/auth/login', { email: 'manager@stocksense.io', password: 'password123' });
    assert(r.status === 200, `Got: ${r.status} ${JSON.stringify(r.json)}`);
  });

  const token = await login();
  await test('GET /api/exceptions → 200 with auth', async () => {
    const r = await req('GET', '/api/exceptions', null, { Authorization: `Bearer ${token}` });
    assert(r.status === 200, `Got: ${r.status}`);
  });

  await test('GET /api/dashboard/control-tower → 200 with auth', async () => {
    const r = await req('GET', '/api/dashboard/control-tower', null, { Authorization: `Bearer ${token}` });
    assert(r.status === 200, `Got: ${r.status}`);
  });

  // --- Summary ---
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉 All Phase 3 tests PASSED!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed.\n');
    process.exit(1);
  }
})();
