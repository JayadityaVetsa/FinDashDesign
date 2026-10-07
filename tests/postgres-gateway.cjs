const { PGlite } = require('@electric-sql/pglite');
const { createServer } = require('node:http');
// Real PostgreSQL (WASM), exposing Neon's documented HTTP query protocol on
// loopback only. Tests exercise the production driver without cloud credentials.
async function startPostgresGateway(directory) {
  const database = new PGlite(directory);
  await database.waitReady;
  const serialize = result => ({
    command: 'SELECT', rowCount: result.affectedRows || result.rows.length,
    fields: result.fields, rowAsArray: true,
    rows: result.rows.map(row => result.fields.map(field => {
      const value = row[field.name];
      if (value == null) return null;
      if (typeof value === 'boolean') return value ? 't' : 'f';
      if (value instanceof Date) return value.toISOString();
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    })),
  });
  const server = createServer(async (request, response) => {
    try {
      let raw = ''; for await (const chunk of request) raw += chunk;
      const body = JSON.parse(raw);
      const run = async (db, query) => serialize(await db.query(query.query, query.params));
      const result = body.queries
        ? { results: await database.transaction(async tx => {
          const results = []; for (const query of body.queries) results.push(await run(tx, query)); return results;
        }) }
        : await run(database, body);
      response.writeHead(200, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(result));
    } catch (error) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ message: error.message, code: error.code, severity: 'ERROR' }));
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { database, url: `postgresql://test:test@127.0.0.1:${server.address().port}/test`,
    async close() { await new Promise(resolve => server.close(resolve)); await database.close(); } };
}
module.exports = { startPostgresGateway };
