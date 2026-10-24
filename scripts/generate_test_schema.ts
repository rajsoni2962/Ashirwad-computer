import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const testSchemaPath = path.join(process.cwd(), 'prisma', 'schema.test.prisma');

let content = fs.readFileSync(schemaPath, 'utf-8');

// Replace datasource block with sqlite provider
content = content.replace(
  /datasource db \{[\s\S]*?\}/,
  `datasource db {
  provider = "sqlite"
  url      = "file:./isolated_test_restore.db"
}`
);

// In sqlite, generator should output to a custom location or standard
content = content.replace(
  /generator client \{[\s\S]*?\}/,
  `generator client {
  provider = "prisma-client-js"
  output   = "./generated-test-client"
}`
);

fs.writeFileSync(testSchemaPath, content, 'utf-8');
console.log('✓ Created prisma/schema.test.prisma');
