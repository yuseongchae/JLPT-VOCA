import { NextResponse } from "next/server";
import { containsHangul, containsJapanese } from "@/lib/voca";

async function translateKoToJa(text: string) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|ja`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return text;
  const json = (await res.json()) as { responseData?: { translatedText?: unknown } };
  const translatedText = json?.responseData?.translatedText;
  if (typeof translatedText !== "string") return text;
  return translatedText.trim() || text;
}

async function translateJaToKo(text: string) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ja|ko`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return "";
  const json = (await res.json()) as { responseData?: { translatedText?: unknown } };
  const translatedText = json?.responseData?.translatedText;
  if (typeof translatedText !== "string") return "";
  return translatedText.trim();
}

function hangulSyllableToJpRomaji(ch: string) {
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return ch;

  const sIndex = code - 0xac00;
  const lIndex = Math.floor(sIndex / 588);
  const vIndex = Math.floor((sIndex % 588) / 28);
  const tIndex = sIndex % 28;

  const vowel = (() => {
    switch (vIndex) {
      case 0:
        return "a";
      case 1:
        return "e";
      case 2:
      case 3:
        return "ya";
      case 4:
        return "o";
      case 5:
        return "e";
      case 6:
        return "yo";
      case 7:
        return "e";
      case 8:
        return "o";
      case 9:
      case 10:
        return "wa";
      case 11:
        return "e";
      case 12:
        return "yo";
      case 13:
        return "u";
      case 14:
        return "o";
      case 15:
        return "e";
      case 16:
        return "i";
      case 17:
        return "yu";
      case 18:
        return "u";
      case 19:
        return "u";
      case 20:
        return "i";
      default:
        return "";
    }
  })();

  const base = (() => {
    const isYaYuYo = vowel.startsWith("y");
    switch (lIndex) {
      case 11:
        return "";
      case 2:
        return "n";
      case 5:
        return "r";
      case 6:
        return "m";
      case 7:
      case 8:
        return "b";
      case 0:
      case 1:
        return "k";
      case 15:
        return "k";
      case 3:
      case 4:
        return "d";
      case 16:
        return "t";
      case 17:
        return "p";
      case 18:
        return "h";
      case 9:
      case 10: {
        if (vowel === "i") return "sh";
        if (isYaYuYo) return "sh";
        return "s";
      }
      case 12:
      case 13: {
        if (vowel === "i") return "j";
        return "j";
      }
      case 14: {
        if (vowel === "i") return "ch";
        if (vowel === "u" && vIndex === 18) return "ts";
        return "ch";
      }
      default:
        return "";
    }
  })();

  const romaji = (() => {
    if (lIndex === 14 && vIndex === 18) return "tsu";
    if ((lIndex === 9 || lIndex === 10) && vIndex === 20) return "shi";
    if (lIndex === 12 && vIndex === 20) return "ji";
    if (lIndex === 14 && vIndex === 20) return "chi";
    if (lIndex === 18 && vIndex === 13) return "fu";

    const contractedVowel = vowel.startsWith("y") ? vowel.slice(1) : vowel;

    if (base === "sh") return `sh${contractedVowel}`;
    if (base === "ch") return `ch${contractedVowel}`;
    if (base === "ts") return `ts${contractedVowel}`;
    if (base === "j") return `j${contractedVowel}`;
    return `${base}${vowel}`;
  })();

  const tail = (() => {
    switch (tIndex) {
      case 4:
      case 5:
      case 6:
        return "n";
      case 16:
      case 17:
      case 18:
        return "m";
      case 21:
        return "n";
      default:
        return "";
    }
  })();

  return `${romaji}${tail}`;
}

function hangulToJpRomaji(text: string) {
  return Array.from(text)
    .map((ch) => hangulSyllableToJpRomaji(ch))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

async function jishoSearch(keyword: string) {
  const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;
  const jishoRes = await fetch(jishoUrl, { cache: "no-store" });
  if (!jishoRes.ok) return null;

  const jishoJson = (await jishoRes.json()) as {
    data?: Array<{ japanese?: Array<{ word?: string; reading?: string }> }>;
  };

  const first = jishoJson?.data?.[0]?.japanese?.[0];
  const word = (first?.word ?? "").trim();
  const reading = (first?.reading ?? "").trim();

  if (!word && !reading) return null;
  return { word: word || keyword, reading };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) return NextResponse.json({ error: "missing_q" }, { status: 400 });
  if (q.length > 100) return NextResponse.json({ error: "too_long" }, { status: 400 });

  const candidates: string[] = [];
  const treatAsKoreanMeaning = containsHangul(q) && !containsJapanese(q);
  if (containsJapanese(q)) {
    candidates.push(q);
  } else {
    if (containsHangul(q)) {
      const romaji = hangulToJpRomaji(q);
      if (romaji) candidates.push(romaji);
    }

    candidates.push(q);

    const translated = await translateKoToJa(q);
    if (translated && translated !== q) candidates.push(translated);
  }

  const seen = new Set<string>();
  for (const c of candidates) {
    const keyword = c.trim();
    if (!keyword) continue;
    if (seen.has(keyword)) continue;
    seen.add(keyword);

    const hit = await jishoSearch(keyword);
    if (hit) {
      const meaningKo = treatAsKoreanMeaning ? q : await translateJaToKo(hit.word || hit.reading || keyword);
      return NextResponse.json({ keyword, word: hit.word, reading: hit.reading, meaningKo });
    }
  }

  return NextResponse.json({ keyword: candidates[0] ?? q, word: candidates[0] ?? q, reading: "", meaningKo: treatAsKoreanMeaning ? q : "" });
}
