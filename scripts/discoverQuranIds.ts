// scripts/discoverQuranIds.ts
async function discoverIds() {
  const LANGS = ['en','ar','ur','bn','ru','tr','id','fa','fr','es','zh'];
  const results: any = { translations: {}, tafsirs: [] };

  for (const lang of LANGS) {
    const r = await fetch(`https://api.quran.com/api/v4/resources/translations?language=${lang}`);
    const d = await r.json();
    results.translations[lang] = d.translations?.map((t: any) => ({ id: t.id, name: t.name })) || [];
  }

  const tr = await fetch('https://api.quran.com/api/v4/resources/tafsirs');
  const td = await tr.json();
  results.tafsirs = td.tafsirs?.map((t: any) => ({ id: t.id, lang: t.language_name, name: t.name })) || [];

  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, '../docs');
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(dir, 'quran-ids.json'), JSON.stringify(results, null, 2));
  console.log('Successfully wrote to docs/quran-ids.json');
}

discoverIds().catch(console.error);
