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

  for (const file of bookFiles) {
    const bookId = file.replace('.ts', '');
    const bookPath = path.join(booksDir, file);
    
    // Global rules + Book specific rules
    const relevantRules = [
      ...(rulesByBook[bookId] ?? []),
      ...(rulesByBook['*'] ?? [])
    ];

    if (relevantRules.length === 0) {
      console.log(`No rules to bake for ${bookId}, skipping.`);
      continue;
    }

    console.log(`Baking ${relevantRules.length} rules into ${bookId}...`);
    
    // Read the file and parse its tokens
    const content = fs.readFileSync(bookPath, 'utf-8');
    const startMarker = 'const tokens: Record<string, Record<string, BookToken[]>> = ';
    const startIdx = content.indexOf(startMarker);
    if (startIdx === -1) {
      console.error(`Could not find tokens definition in ${file}`);
      continue;
    }
    
    const prefix = content.slice(0, startIdx + startMarker.length);
    // The JSON block ends at the last '}' before the sequence '};'
    // We search for the specific end of the object assignment.
    const suffixStart = content.lastIndexOf('};');
    if (suffixStart === -1) {
       console.error(`Could not find end of tokens object in ${file}`);
       continue;
    }
    const jsonStr = content.slice(startIdx + startMarker.length, suffixStart + 1);
    
    try {
      const data = JSON.parse(jsonStr);
      
      // Data shape: { [bookId]: { [difficulty]: BookToken[] } }
      const bookData = data[bookId];
      if (!bookData) {
        console.error(`Book data for ${bookId} not found in ${file}`);
        continue;
      }

      for (const difficulty in bookData) {
        const originalTokens = bookData[difficulty];
        if (Array.isArray(originalTokens)) {
          const bakedTokens = applyRules(relevantRules, originalTokens);
          bookData[difficulty] = bakedTokens;
          console.log(`  [${difficulty}] ${originalTokens.length} -> ${bakedTokens.length} tokens`);
        }
      }

      // Re-emit with the original structure
      const updatedContent = `${prefix}${JSON.stringify(data)};\n\nexport default tokens;\n`;
      fs.writeFileSync(bookPath, updatedContent);
      console.log(`  Updated ${file} successfully.`);
      
    } catch (e) {
      console.error(`Failed to bake rules for ${file}:`, e);
      console.error(`  JSON snippet (start): ${jsonStr.slice(0, 100)}...`);
      console.error(`  JSON snippet (end): ...${jsonStr.slice(-100)}`);
    }
  }

  // Clear manifest since rules are now in files
  const manifestPath = path.join(process.cwd(), 'src/data/book-tokens/baked-rules.json');
  fs.writeFileSync(manifestPath, JSON.stringify({}, null, 2));
  console.log(`Baked rules manifest cleared.`);
}

bakeRules().catch(console.error);
