"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useVocaStore } from "@/app/providers";
import { speakJa } from "@/lib/speech";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TestPage() {
  const params = useParams<{ folderId: string }>();
  const folderId = params.folderId;
  const { data } = useVocaStore();
  const folder = useMemo(() => data.folders.find((f) => f.id === folderId), [data.folders, folderId]);

  const items = useMemo(() => (folder ? shuffle(folder.items) : []), [folder]);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  if (!folder) {
    return (
      <div className="flex flex-1 justify-center px-5 py-8 sm:px-6 sm:py-10">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-sm text-zinc-600">불러오는 중...</div>
          <Link
            href="/"
            className="mt-4 inline-block rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 justify-center px-5 py-8 sm:px-6 sm:py-10">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-sm text-zinc-600">시험 볼 단어가 없어요.</div>
          <Link
            href={`/folder/${folderId}`}
            className="mt-4 inline-block rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            단어장으로
          </Link>
        </div>
      </div>
    );
  }

  const done = index >= items.length;
  const current = done ? null : items[index];

  return (
    <div className="flex flex-1 justify-center px-5 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <Link href={`/folder/${folderId}`} className="rounded-full px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100">
            ✕
          </Link>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">✕ {wrong}</div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">✓ {correct}</div>
          </div>
          <div className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            {Math.min(index + 1, items.length)}/{items.length}
          </div>
        </div>

        {done ? (
          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <div className="text-lg font-semibold">끝!</div>
            <div className="mt-2 text-sm text-zinc-600">
              맞음 {correct} / 틀림 {wrong}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIndex(0);
                  setCorrect(0);
                  setWrong(0);
                  setRevealed(false);
                }}
                className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                다시하기
              </button>
              <Link
                href={`/folder/${folderId}`}
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
              >
                단어장
              </Link>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="mt-6 w-full rounded-3xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm"
            >
              <div className="text-6xl font-semibold tracking-tight">{current?.wordJa}</div>
              {revealed ? (
                <div className="mt-6">
                  <div className="text-sm text-zinc-500">{current?.readingJa || " "}</div>
                  <div className="mt-2 text-base font-medium text-zinc-800">{current?.meaningKo}</div>
                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakJa(current?.wordJa ?? "");
                      }}
                      className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-200"
                    >
                      🔊 발음
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-sm text-zinc-500">한자를 눌러 정답을 확인</div>
              )}
            </button>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setWrong((v) => v + 1);
                  setIndex((v) => v + 1);
                  setRevealed(false);
                }}
                className="flex-1 rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
              >
                잘 몰라요
              </button>
              <button
                type="button"
                onClick={() => {
                  setCorrect((v) => v + 1);
                  setIndex((v) => v + 1);
                  setRevealed(false);
                }}
                className="flex-1 rounded-2xl bg-zinc-900 px-4 py-4 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                알고 있어요
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
