import { neon } from '@neondatabase/serverless';
import { schemaStatements } from '../lib/server/schema.ts';
const connection = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connection) throw new Error('Set DATABASE_URL before initializing the database.');
const sql = neon(connection);
await sql.transaction(schemaStatements.map(statement => sql.query(statement)));
console.log('FinDash PostgreSQL schema is ready.');
