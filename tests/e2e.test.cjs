const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { createServer } = require('node:net');
const { once } = require('node:events');
const { startPostgresGateway } = require('./postgres-gateway.cjs');

test('production API: accounts, ownership, CRUD, restart persistence, stale tabs and logout', { timeout: 120000 }, async t => {
  const directory = mkdtempSync(join(tmpdir(), 'findash-e2e-'));
  const gateway = await startPostgresGateway(join(directory,'postgres'));
  const listener = createServer(); listener.listen(0, '127.0.0.1'); await once(listener, 'listening');
  const port = listener.address().port; await new Promise(resolve => listener.close(resolve));
  const origin = `http://localhost:${port}`;
  let server;
  let logs = '';
  async function start() {
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
      cwd: resolve(__dirname, '..'), env: { ...process.env, DATABASE_URL:gateway.url, APP_ORIGIN:origin, ALLOW_REGISTRATION:'true', NEXT_TELEMETRY_DISABLED:'1' },
      stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    server.stdout.on('data', data => { logs += data; }); server.stderr.on('data', data => { logs += data; });
    for (let i = 0; i < 150; i++) {
      if (server.exitCode !== null) throw new Error(logs);
      try { if ((await fetch(origin+'/api/auth')).ok) return; } catch { /* starting */ }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error('Server did not start: '+logs);
  }
  async function stop() {
    if (server && server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
  }
  t.after(async () => {
    await stop();
    await gateway.close();
    // Only remove the disposable directory created by this test.
    if (resolve(directory).startsWith(resolve(tmpdir()) + require('node:path').sep) && directory.includes('findash-e2e-')) rmSync(directory, { recursive: true, force: true });
  });
  await start();
  const landing = await (await fetch(origin)).text();
  assert.match(landing, /For students and newer investors/);
  assert.match(landing, /href="\/demo"/);
  assert.equal((await fetch(origin+'/demo')).status,200);
  assert.equal((await fetch(origin+'/guides/first-stock-watchlist')).status,200);
  assert.equal((await fetch(origin+'/guides/not-a-guide')).status,404);
  const sitemap = await (await fetch(origin+'/sitemap.xml')).text();
  assert.match(sitemap,/\/guides\/first-stock-watchlist/);
  assert.doesNotMatch(sitemap,/\/dashboard/);
  const og = await fetch(origin+'/opengraph-image');
  assert.equal(og.status,200);
  assert.match(og.headers.get('content-type'),/image\/png/);
  async function request(path, method='GET', body, cookie='', customOrigin=origin) {
    const response = await fetch(origin+'/api/'+path, { method, headers: { 'Content-Type': 'application/json', Origin: customOrigin, Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await response.json(); return { response, data };
  }
  assert.equal((await request('workspace?resource=profile')).response.status, 401);
  const password = 'test account password 123';
  const alice = await request('auth', 'POST', { email: 'alice@example.test', password, register: true });
  assert.equal(alice.response.status, 200);
  const aliceCookie = alice.response.headers.get('set-cookie').split(';')[0];
  assert.match(alice.response.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(alice.response.headers.get('set-cookie'), /SameSite=lax/i);
  const bob = await request('auth', 'POST', { email: 'bob@example.test', password, register: true });
  const bobCookie = bob.response.headers.get('set-cookie').split(';')[0];
  const staleTab = await fetch(origin+'/api/workspace', { method: 'POST', headers: {
    'Content-Type': 'application/json', Origin: origin, Cookie: bobCookie, 'X-FinDash-User': alice.data.user.id,
  }, body: JSON.stringify({ action: 'profile', updates: { theme: 'light' } }) });
  assert.equal(staleTab.status, 403);
  const widget = { id: 'quote-1', type: 'stock-quote', x: 0, y: 0, w: 4, h: 5, settings: { ticker: 'AAPL' } };
  const seeds = [{ name: 'Focused', widgets: [widget] }];
  const initialized = await request('workspace', 'POST', { action: 'initialize', seeds, finnhubKey: 'test-key' }, aliceCookie);
  assert.equal(initialized.response.status, 200);
  const board = initialized.data[0];
  const retry = await request('workspace', 'POST', { action: 'initialize', seeds, finnhubKey: 'test-key' }, aliceCookie);
  assert.deepEqual(retry.data.map(b => b.id), [board.id]);
  assert.deepEqual((await request('workspace?resource=dashboards', 'GET', undefined, bobCookie)).data, []);
  assert.equal((await request('workspace', 'POST', { action: 'update', id: board.id, updates: { name: 'Stolen' } }, bobCookie)).response.status, 400);
  assert.equal((await request('workspace', 'POST', { action: 'delete', id: board.id }, bobCookie)).response.status, 400);
  assert.equal((await request('workspace', 'POST', { action: 'profile', updates: { active_dashboard_id: board.id } }, bobCookie)).response.status, 400);
  assert.equal((await request('workspace', 'POST', { action: 'delete', id: board.id }, aliceCookie)).response.status, 400);
  const second = await request('workspace', 'POST', { action: 'create', name: 'Research', widgets: [], position: 1 }, aliceCookie);
  assert.equal(second.response.status, 200);
  assert.equal((await request('workspace', 'POST', { action: 'update', id: board.id, updates: { name: 'My markets', widgets: [{ ...widget, x: 4, settings: { ticker: 'MSFT' } }] } }, aliceCookie)).response.status, 200);
  const positions = [{ id: 'holding-1', ticker: 'AAPL', quantity: 5, avgCost: 100 }];
  await request('workspace', 'POST', { action: 'profile', updates: { theme: 'light', portfolio_holdings: positions } }, aliceCookie);
  assert.equal((await request('workspace', 'POST', { action: 'profile', updates: { portfolio_holdings: [{ ...positions[0], quantity: -1 }] } }, aliceCookie)).response.status, 400);
  assert.equal((await request('workspace', 'POST', { action: 'profile', updates: { theme: 'dark' } }, aliceCookie, 'https://attacker.test')).response.status, 403);
  assert.equal((await request('auth', 'POST', { email: 'alice@example.test', password: 'wrong password' })).response.status, 401);
  await stop(); await start();
  const persisted = await request('workspace?resource=dashboards', 'GET', undefined, aliceCookie);
  assert.equal(persisted.data.find(b => b.id === board.id).name, 'My markets');
  assert.equal(persisted.data.find(b => b.id === board.id).widgets[0].settings.ticker, 'MSFT');
  const profile = (await request('workspace?resource=profile', 'GET', undefined, aliceCookie)).data;
  assert.deepEqual(profile.portfolio_holdings, positions); assert.equal(profile.theme, 'light');
  await request('workspace', 'POST', { action: 'profile', updates: { portfolio_holdings: [] } }, aliceCookie);
  assert.deepEqual((await request('workspace?resource=profile', 'GET', undefined, aliceCookie)).data.portfolio_holdings, []);
  assert.equal((await request('workspace', 'POST', { action: 'delete', id: second.data.id }, aliceCookie)).response.status, 200);
  assert.equal((await request('auth', 'DELETE', undefined, aliceCookie)).response.status, 200);
  assert.equal((await request('auth', 'GET', undefined, aliceCookie)).data, null);
  assert.equal((await request('workspace?resource=profile', 'GET', undefined, aliceCookie)).response.status, 401);
});
