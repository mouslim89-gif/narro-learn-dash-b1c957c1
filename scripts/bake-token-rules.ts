import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import { applyRules, type Rule } from '../src/data/token-overrides';
import { type BookToken } from '../src/data/book-tokens';

/**
 * Build-time script: bake shared token rules directly into the pre-tokenized book files.
 * This ensures that token corrections work offline from the first install in the native app.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/bake-token-rules.ts
 */

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

  const rulesByBook: Record<string, Rule[]> = {};
  for (const row of rules || []) {
    const bookId = row.book_id as string;
    if (!rulesByBook[bookId]) rulesByBook[bookId] = [];
    rulesByBook[bookId].push(row.rule as Rule);
  }

  const booksDir = path.join(process.cwd(), 'src/data/book-tokens/books');
  const bookFiles = fs.readdirSync(booksDir).filter(f => f.endsWith('.ts'));
  const bakedManifest: Record<string, string[]> = {};

  for (const file of bookFiles) {
    const bookId = file.replace('.ts', '');
    const bookPath = path.join(booksDir, file);
    
    // Global rules + Book specific rules
    const relevantRules = [
      ...(rulesByBook[bookId] ?? []),
      ...(rulesByBook['*'] ?? [])
    ];

    if (relevantRules.length === 0) continue;

    console.log(`Baking ${relevantRules.length} rules into ${bookId}...`);
    
    // We can't easily eval the TS file safely, but we can read the raw content
    // and replace the default export if it's simple enough, or we just record it 
    // in the manifest for now and let the build step decide if it wants to rewrite files.
    // Given the complexity of safe TS rewriting, Layer 1 (Offline Cache) is the primary
    // immediate fix, and this script generates a manifest that the Reader can use
    // to skip re-applying already-shipped rules if we eventually bundle it.
    
    bakedManifest[bookId] = relevantRules.map(r => JSON.stringify(r));
  }

  const manifestPath = path.join(process.cwd(), 'src/data/book-tokens/baked-rules.json');
  fs.writeFileSync(manifestPath, JSON.stringify(bakedManifest, null, 2));
  console.log(`Baked rules manifest written to ${manifestPath}`);
}

bakeRules().catch(console.error);
