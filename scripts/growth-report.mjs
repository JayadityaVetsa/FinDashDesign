import { neon } from '@neondatabase/serverless';
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) throw new Error('Set an operator DATABASE_URL in .env.local or the environment to read aggregate signup counts.');
const sql = neon(url);
const rows = await sql.query(`
  SELECT
    count(*)::integer AS total_accounts,
    count(*) FILTER (WHERE u.created_at >= now()-interval '7 days')::integer AS accounts_last_7_days,
    count(*) FILTER (WHERE p.onboarding_completed)::integer AS onboarded_accounts,
    count(*) FILTER (WHERE p.onboarding_completed AND u.created_at >= now()-interval '7 days')::integer AS onboarded_from_last_7_days
  FROM findash_users u JOIN findash_profiles p ON p.id=u.id
  WHERE u.email NOT LIKE 'deployment-check-%@example.test'
    AND u.email NOT LIKE 'browser-check%@example.test'
`);
console.log('Aggregate counts (known deployment verification accounts excluded):');
console.log(JSON.stringify(rows[0],null,2));
console.log('These are account/onboarding counts, not active users or retention. Compare with the same dates in public-page analytics.');
