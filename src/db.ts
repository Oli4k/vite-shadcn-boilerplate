import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: 'postgres://default:password@ep-summer-frog-70313043.us-east-1.aws.neon.tech/neondb?sslmode=require',
}); 