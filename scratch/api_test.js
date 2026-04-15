async function test() {
  const verseKey = "1:1";
  const urls = [
    `https://api.quran.com/api/v4/verses/by_key/${verseKey}?translations=20&language=en`,
    `https://api.quran.com/api/v4/quran/translations/20?verse_key=${verseKey}`,
  ];

  for (const url of urls) {
    console.log("\nTesting URL:", url);
    const res = await fetch(url);
    const data = await res.json();
    console.log("Raw Response Keys:", Object.keys(data));
    if (data.verse) console.log("Verse Keys:", Object.keys(data.verse));
    if (data.translations) console.log("Translations length:", data.translations.length);
    if (data.verse?.translations) console.log("Verse.Translations length:", data.verse.translations.length);
  }
}

test();
