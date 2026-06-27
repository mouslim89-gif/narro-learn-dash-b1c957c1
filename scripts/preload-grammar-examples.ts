
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const envSrc = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envSrc.split('\n')) {
  const m = line.match(/^([A-Z_]+)\s*=\s*"?([^"\n]+)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase env vars in .env');
}

const AUTH_HEADER = `Bearer ${SUPABASE_KEY}`;

interface GrammarNote {
  pattern: string;
  meaning: string;
  jlpt: string;
}

async function main() {
  const grammarPath = path.resolve(__dirname, '../src/data/book-grammar.ts');
  const grammarSrc = fs.readFileSync(grammarPath, 'utf-8');
  
  const startIdx = grammarSrc.indexOf('= {') + 2;
  const endIdx = grammarSrc.lastIndexOf('};') + 1;
  const jsonStr = grammarSrc.slice(startIdx, endIdx);
  const bookGrammar = JSON.parse(jsonStr);

  const notesMap = new Map<string, GrammarNote>();
  
  for (const bookId in bookGrammar) {
    for (const diff in bookGrammar[bookId]) {
      const parts = bookGrammar[bookId][diff];
      const flatNotes = Array.isArray(parts[0]) ? parts.flat() : parts;
      
      for (const note of flatNotes) {
        const slug = note.pattern.toLowerCase().trim().replace(/[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf0-9a-z]/g, '-');
        if (!notesMap.has(slug)) {
          notesMap.set(slug, note);
        }
      }
    }
  }

  const allNotes = Array.from(notesMap.values());
  console.log(`Found ${allNotes.length} unique grammar patterns. Processing first 50...`);

  const BATCH_SIZE = 5;
  const LIMIT = 50; 
  const subset = allNotes.slice(0, LIMIT);

  for (let i = 0; i < subset.length; i += BATCH_SIZE) {
    const batch = subset.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${i/BATCH_SIZE + 1}/${subset.length/BATCH_SIZE}...`);

    await Promise.all(batch.map(async (note) => {
      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/grammar-examples`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTH_HEADER,
            'apikey': SUPABASE_KEY,
          },
          body: JSON.stringify({
            pattern: note.pattern,
            meaning: note.meaning,
            jlpt: note.jlpt
          }),
        });

        if (!resp.ok) {
          console.error(`  → Error [${note.pattern}]: ${resp.status}`);
        }
      } catch (e) {
        console.error(`  → Failed [${note.pattern}]: ${e.message}`);
      }
    }));
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\nSubset preload complete!');
}

main().catch(console.error);
