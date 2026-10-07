import { neon } from '@neondatabase/serverless';
import { randomBytes, scryptSync } from 'node:crypto';
const connection = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const email = process.argv[2]?.trim().toLowerCase();
const password = process.env.FINDASH_NEW_PASSWORD;
if (!connection || !email || !password || password.length < 10 || password.length > 128)
  throw new Error('Set DATABASE_URL and FINDASH_NEW_PASSWORD (10–128 characters), and supply an email argument.');
const sql = neon(connection);
const users = await sql.query('SELECT id FROM findash_users WHERE email=$1', [email]);
if (!users[0]) throw new Error('Account not found.');
const salt = randomBytes(16).toString('hex');
const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
await sql.transaction([
  sql.query('UPDATE findash_users SET password_hash=$1 WHERE id=$2', [hash,users[0].id]),
  sql.query('DELETE FROM findash_sessions WHERE user_id=$1', [users[0].id]),
]);
console.log('Password changed and existing sessions revoked.');
