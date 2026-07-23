import 'dotenv/config';

process.env.JWT_SECRET ??= 'test-secret-not-for-production';
process.env.ADMIN_TOKEN ??= 'test-admin-secret';
process.env.KYC_PROVIDER ??= 'mock';
process.env.CLIENT_ORIGIN ??= 'http://localhost:5173';
process.env.LOG_LEVEL ??= 'silent';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Integration tests need a real Postgres database - ' +
      'see packages/server/.env.example, or the ci job for how CI provisions one.'
  );
}
