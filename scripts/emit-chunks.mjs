#!/usr/bin/env node
/**
 * Reads SQL chunk files and prints them as JSON lines for batch MCP execution.
 * Usage: node scripts/emit-chunks.mjs /tmp/import_chunks_program_collin_johns_right_side 08 09 10 11
 */
import fs from 'fs';
import path from 'path';

const dir = process.argv[2];
const files = process.argv.slice(3);
if (!dir || !files.length) {
  console.error('Usage: node scripts/emit-chunks.mjs <chunk-dir> <file-numbers...>');
  process.exit(1);
}

for (const f of files) {
  const sql = fs.readFileSync(path.join(dir, `${f}.sql`), 'utf8');
  console.log(JSON.stringify({ chunk: f, project_id: 'qdlvidtnfqnqjgrhxwtz', query: sql }));
}
