
import fs from 'fs';
import path from 'path';

const filePath = 'src/data/book-grammar.ts';
const content = fs.readFileSync(filePath, 'utf-8');

// Simple regex to find Japanese text in meaning and tip
// We'll use the Gemini API to translate the whole file content to English
// while keeping Japanese in 'pattern' and 'example'

async function translateFile() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  
  console.log("Translating grammar notes to English...");
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY!,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are a Japanese learning app developer. Translate all Japanese and French descriptions (fields 'meaning' and 'tip') in the given TypeScript file to English. Keep 'pattern' and 'example' as they are (Japanese). Return the full file content with translations." },
        { role: "user", content: content }
      ],
    })
  });

  if (!response.ok) {
    console.error("Translation failed:", await response.text());
    return;
  }

  const data = await response.json();
  const newContent = data.choices[0].message.content;
  
  // Clean up code block markers if AI added them
  const cleanedContent = newContent.replace(/^```typescript\n?/, '').replace(/\n?```$/, '');
  
  fs.writeFileSync(filePath, cleanedContent);
  console.log("Grammar notes translated successfully!");
}

translateFile();
