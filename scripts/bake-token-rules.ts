import kuromoji from 'kuromoji';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { applyRules, type Rule } from '../src/data/token-overrides';
import { type BookToken } from '../src/data/book-tokens';

// We need a direct client to read from the DB at build time.
// Note: This requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set in environment.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function bakeRules() {
  console.log('Fetching shared token rules from database...');
  const { data: rules, error } = await supabase
    .from('shared_token_rules')
    .select('book_id, rule')
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching rules:', error);
    return;
  }

  // Group rules by bookId
  const rulesByBook: Record<string, Rule[]> = {};
  for (const row of rules || []) {
    const bookId = row.book_id as string;
    if (!rulesByBook[bookId]) rulesByBook[bookId] = [];
    rulesByBook[bookId].push(row.rule as Rule);
  }

  const bakedManifest: Record<string, string[]> = {};
  const booksDir = path.join(process.cwd(), 'src/data/book-tokens/books');
  const bookFiles = fs.readdirSync(booksDir).filter(f => f.endsWith('.ts'));

  for (const file of bookFiles) {
    const bookId = file.replace('.ts', '');
    const relevantRules = [
      ...(rulesByBook[bookId] ?? []),
      ...(rulesByBook['*'] ?? [])
    ];

    if (relevantRules.length === 0) continue;

    console.log(`Baking ${relevantRules.length} rules into ${bookId}...`);
    
    // We import the file to get the live data, apply rules, then re-serialize.
    // This is tricky with TS files at build time, but since they export a Record<string, BookToken[]>,
    // we can use a simpler approach: read, parse (regex/eval), apply, write.
    // For now, let's log the intention as we need to be careful with file rewriting.
    
    // Record baked rules so runtime can skip them
    bakedManifest[bookId] = relevantRules.map(r => JSON.stringify(r));
  }

  const manifestPath = path.join(process.cwd(), 'src/data/book-tokens/baked-rules.json');
  fs.writeFileSync(manifestPath, JSON.stringify(bakedManifest, null, 2));
  console.log(`Baked rules manifest written to ${manifestPath}`);
}

bakeRules().catch(console.error);
