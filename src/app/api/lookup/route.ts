import { NextResponse } from "next/server";
import { containsJapanese } from "@/lib/voca";

async function translateKoToJa(text: string) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|ja`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return text;
  const json = (await res.json()) as { responseData?: { translatedText?: unknown } };
  const translatedText = json?.responseData?.translatedText;
  if (typeof translatedText !== "string") return text;
  return translatedText.trim() || text;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) return NextResponse.json({ error: "missing_q" }, { status: 400 });
  if (q.length > 100) return NextResponse.json({ error: "too_long" }, { status: 400 });

  const keyword = containsJapanese(q) ? q : await translateKoToJa(q);

  const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;
  const jishoRes = await fetch(jishoUrl, { cache: "no-store" });
  if (!jishoRes.ok) return NextResponse.json({ keyword, word: keyword, reading: "" });

  const jishoJson = (await jishoRes.json()) as {
    data?: Array<{ japanese?: Array<{ word?: string; reading?: string }> }>;
  };

  const first = jishoJson?.data?.[0]?.japanese?.[0];
  const word = (first?.word ?? "").trim() || keyword;
  const reading = (first?.reading ?? "").trim();

  return NextResponse.json({ keyword, word, reading });
}

