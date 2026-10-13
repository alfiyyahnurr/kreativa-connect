import { Client } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Load DATABASE_URL from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);

if (!dbUrlMatch) {
  console.error('ERROR: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1];
console.log('Connecting to Neon PostgreSQL database...');

// Read docs/erd.md
const erdPath = path.join(process.cwd(), 'docs', 'erd.md');
if (!fs.existsSync(erdPath)) {
  console.error('ERROR: docs/erd.md not found at', erdPath);
  process.exit(1);
}

const erdContent = fs.readFileSync(erdPath, 'utf8');

// Extract DDL block (under ## 2. Schema DDL)
const ddlMatch = erdContent.match(/## 2\. Schema DDL[\s\S]*?```sql([\s\S]*?)```/);
if (!ddlMatch) {
  console.error('ERROR: Could not find DDL code block in docs/erd.md');
  process.exit(1);
}
const ddlSql = ddlMatch[1].trim();

// Extract Seed block (under ## 3. Realistic Seed Data)
const seedMatch = erdContent.match(/## 3\. Realistic Seed Data[\s\S]*?```sql([\s\S]*?)```/);
if (!seedMatch) {
  console.error('ERROR: Could not find Seed code block in docs/erd.md');
  process.exit(1);
}
const seedSql = seedMatch[1].trim();

console.log(`Extracted DDL (${ddlSql.length} chars) and Seed (${seedSql.length} chars).`);

const client = new Client(dbUrl);

try {
  await client.connect();
  console.log('Connected to Neon DB successfully.');

  console.log('1. Executing Schema DDL (creating tables, constraints, triggers, indexes)...');
  await client.query(ddlSql);
  console.log('Schema DDL executed successfully!');

  console.log('2. Executing Realistic Seed Data...');
  await client.query(seedSql);
  console.log('Realistic Seed Data executed successfully!');

  console.log('\n--- VERIFYING TABLE ROW COUNTS ---');
  const tables = [
    'schools',
    'users',
    'channels',
    'contacts',
    'students',
    'admission_records',
    'fee_structures',
    'fee_items',
    'knowledge_base',
    'chatbot_flow_nodes',
    'chatbot_flow_options',
    'settings',
    'conversations',
    'messages',
    'tasks'
  ];

  for (const table of tables) {
    const res = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(`  Table [${table}]: ${res.rows[0].count} rows`);
  }

  console.log('\nALL SCHEMA & SEED DATA MIGRATION COMPLETED 100%!');
} catch (error) {
  console.error('Migration failed with error:', error);
  process.exit(1);
} finally {
  await client.end();
}
