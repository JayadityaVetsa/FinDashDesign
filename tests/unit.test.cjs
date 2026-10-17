require('./load-typescript.cjs');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { SaveQueue } = require('../lib/saveQueue.ts');
const { ApiClient } = require('../lib/apiClient.ts');
const { getQuote } = require('../lib/finnhub.ts');
const { createPresetDashboard } = require('../lib/widgetConfig.ts');
const { widgets, holdings } = require('../lib/server/validation.ts');
const { getDatabase, initializeWorkspace, listDashboards, getUserProfile } = require('../lib/server/database.ts');
const { hashPassword, checkPassword, createSession, sessionFromToken, tokenHash, assertSameOrigin } = require('../lib/server/security.ts');
const { startPostgresGateway } = require('./postgres-gateway.cjs');
const { publicAnalyticsUrl } = require('../lib/publicAnalytics.ts');
const { demoWidgets } = require('../lib/demoData.ts');
let gateway;
before(async () => { gateway = await startPostgresGateway(); process.env.DATABASE_URL = gateway.url; });
after(async () => { await gateway.close(); });

test('public demo uses isolated fixtures with no provider requests; a demo-looking key stays a real credential outside demo mode', async () => {
  const original = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls++; return new Response('{}', { status: 401 }); };
  try {
    const demo = new ApiClient({ apiKey: 'sample-data', demo: true });
    const quote = await demo.getQuote('AAPL');
    assert.ok(quote.c > 0);
    const candles = await demo.getCandle('AAPL', 'D', 1000, 5000);
    assert.equal(candles.c.length, candles.t.length);
    assert.equal(candles.t[0], 1000);
    assert.equal(candles.t.at(-1), 5000);
    assert.equal((await demo.searchSymbol('Apple'))[0].symbol, 'AAPL');
    assert.ok((await demo.getCompanyNews('AAPL','2026-01-01','2026-02-01'))[0].headline.startsWith('Sample:'));
    assert.equal(calls, 0);
    quote.c = -1;
    assert.ok((await demo.getQuote('AAPL')).c > 0);
    await assert.rejects(new ApiClient({ apiKey: 'sample-data' }).getQuote('AAPL'), /INVALID_KEY/);
    assert.equal(calls, 1);
    const layout = demoWidgets();
    layout[0].settings.tickers.push('CHANGED');
    assert.ok(!demoWidgets()[0].settings.tickers.includes('CHANGED'));
  } finally { global.fetch = original; }
});

test('analytics drops private paths and strips public query strings and fragments', () => {
  assert.equal(publicAnalyticsUrl('https://example.com/demo?key=secret#private'), 'https://example.com/demo');
  assert.equal(publicAnalyticsUrl('https://example.com/login?email=private@example.com'), 'https://example.com/login');
  for (const path of ['/dashboard','/onboarding','/api/workspace','/auth/callback','/clear-storage'])
    assert.equal(publicAnalyticsUrl('https://example.com'+path), null);
  assert.equal(publicAnalyticsUrl('not a url'), null);
});

test('dashboard switching does not cancel another dashboard save', async () => {
  const writes = [];
  const queue = new SaveQueue(async (id, value) => writes.push([id, value]), assert.fail, () => {}, 10000);
  queue.schedule('first', [1]); queue.schedule('second', [2]); queue.schedule('first', [3]);
  assert.equal(await queue.flushAll(), true);
  assert.deepEqual(writes.sort(), [['first', [3]], ['second', [2]]]);
  assert.equal(queue.busy, false);
});
test('writes to a dashboard are serialized and failures retain the latest edits', async () => {
  let release;
  let calls = 0;
  const writes = [];
  const queue = new SaveQueue(async (_id, value) => {
    calls++; writes.push(value);
    if (calls === 1) await new Promise(resolve => { release = resolve; });
    if (calls === 2) throw new Error('offline');
  }, () => {}, () => {}, 10000);
  queue.schedule('board', 1); const first = queue.flush('board');
  await Promise.resolve();
  queue.schedule('board', 2); release();
  assert.equal(await first, false); assert.equal(queue.busy, true);
  queue.schedule('board', 3);
  assert.equal(await queue.flushAll(), true);
  assert.deepEqual(writes, [1, 2, 3]);
});
test('invalid API keys cannot pass validation using another credential cache', async () => {
  const original = global.fetch;
  const storage = new Map();
  global.window = { localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } };
  let calls = 0;
  global.fetch = async url => {
    calls++;
    if (new URL(url).searchParams.get('token') === 'invalid') return new Response('{}', { status: 401 });
    return Response.json({ c: 100, d: 1, dp: 1, h: 101, l: 99, o: 99, pc: 99, t: 1 });
  };
  try {
    await new ApiClient({ apiKey: 'valid' }).getQuote('AAPL');
    await assert.rejects(new ApiClient({ apiKey: 'invalid' }).getQuote('AAPL'), /INVALID_KEY/);
    await new ApiClient({ apiKey: 'valid' }).getQuote('AAPL');
    assert.equal(calls, 2);
    assert.ok([...storage.keys()].every(key => !key.includes('valid')));
    global.fetch = async () => Response.json({});
    await assert.rejects(getQuote('INVALID', 'valid'), /No quote data/);
  } finally { global.fetch = original; delete global.window; }
});
test('chosen preset determines the initial workspace; validation rejects malformed data', () => {
  const focused = createPresetDashboard('focused');
  const portfolio = createPresetDashboard('portfolio');
  assert.equal(focused.name, 'Focused');
  assert.equal(portfolio.widgets[0].type, 'portfolio');
  assert.notDeepEqual(focused.widgets, portfolio.widgets);
  assert.equal(widgets(focused.widgets).length, focused.widgets.length);
  assert.throws(() => widgets([{ ...focused.widgets[0], w: -1 }]));
  assert.throws(() => holdings([{ id: 'x', ticker: 'AAPL', quantity: -1, avgCost: 10 }]));
  assert.deepEqual(holdings([]), []);
});
test('workspace initialization is atomic, retry-safe and user-scoped', async () => {
  const db = await getDatabase();
  for (const uid of ['alice', 'bob']) {
    await db.query('INSERT INTO findash_users (id,email,password_hash) VALUES ($1,$2,$3)', [uid,uid+'@example.com','test']);
    await db.query('INSERT INTO findash_profiles (id) VALUES ($1)', [uid]);
  }
  const seeds = [createPresetDashboard('focused')];
  const [first,retry] = await Promise.all([initializeWorkspace('alice', seeds, 'key'),initializeWorkspace('alice', seeds, 'key')]);
  assert.deepEqual(first.map(b => b.id), retry.map(b => b.id));
  assert.equal((await getUserProfile('alice')).onboarding_completed, true);
  assert.deepEqual(await listDashboards('bob'), []);
  assert.deepEqual((await getUserProfile('alice')).portfolio_holdings, []);
  await assert.rejects(initializeWorkspace('bob', [seeds[0], { name:null,widgets:[] }], 'key'));
  assert.deepEqual(await listDashboards('bob'), []);
  assert.equal((await getUserProfile('bob')).onboarding_completed, false);
});
test('passwords and session tokens are hashed; logout revokes access; CSRF is rejected', async () => {
  const hash = await hashPassword('correct horse battery');
  assert.notEqual(hash, 'correct horse battery');
  assert.equal(await checkPassword('correct horse battery', hash), true);
  assert.equal(await checkPassword('incorrect password', hash), false);
  const token = await createSession('alice');
  assert.equal((await sessionFromToken(token)).user.id, 'alice');
  const db = await getDatabase();
  assert.notEqual((await db.query('SELECT token_hash FROM findash_sessions'))[0].token_hash, token);
  await db.query('DELETE FROM findash_sessions WHERE token_hash=$1', [tokenHash(token)]);
  assert.equal(await sessionFromToken(token), null);
  assert.throws(() => assertSameOrigin(new Request('http://localhost/api/auth', { headers: { origin: 'https://attacker.example' } })));
});
