import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

if(process.env.NODE_ENV === 'development'){
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
  neonConfig.poolQueryViaFetch = true;
  neonConfig.useSecureWebSocket = false;
}
const useNeonLocal =
  process.env.USE_NEON_LOCAL === 'true' ||
  (process.env.NODE_ENV !== 'production' &&
    process.env.DATABASE_URL?.includes('@neon-local:'));

if (useNeonLocal) {
  const neonLocalHost = process.env.NEON_LOCAL_HOST || 'neon-local';
  const neonLocalPort = process.env.NEON_LOCAL_PORT || '5432';

  neonConfig.fetchEndpoint = `http://${neonLocalHost}:${neonLocalPort}/sql`;
  neonConfig.poolQueryViaFetch = true;
  neonConfig.useSecureWebSocket = false;
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export {db, sql};