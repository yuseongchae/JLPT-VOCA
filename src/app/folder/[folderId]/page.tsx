"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useVocaStore } from "@/app/providers";
import { speakJa } from "@/lib/speech";

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-5 sm:p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            닫기
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

async function lookupAutoFill(q: string) {
  const res = await fetch(`/api/lookup?q=${encodeURIComponent(q)}`, { method: "GET" });
  if (!res.ok) return null;
  return (await res.json()) as { word?: string; reading?: string; meaningKo?: string };
}

export default function FolderPage() {
  const params = useParams<{ folderId: string }>();
  const folderId = params.folderId;

  const { data, addItem, deleteItem, toggleFavorite } = useVocaStore();
  const folder = useMemo(() => data.folders.find((f) => f.id === folderId), [data.folders, folderId]);

  const [open, setOpen] = useState(false);
  const [wordJa, setWordJa] = useState("");
  const [readingJa, setReadingJa] = useState("");
  const [meaningKo, setMeaningKo] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex flex-1 justify-center px-5 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <Link href="/" className="rounded-full px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100">
            ←
          </Link>
          <div className="text-base font-semibold">{folder.name}</div>
          <div className="w-10" />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/folder/${folderId}/test`}
            className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
          >
            시험 기능
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            단어 추가
          </button>
        </div>

        {folder.items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            아직 단어가 없어요. 단어를 추가해보세요.
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {folder.items.map((item) => (
              <div key={item.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-zinc-500">{item.readingJa || " "}</div>
                    <div className="mt-1 text-4xl font-semibold tracking-tight">{item.wordJa}</div>
                    <div className="mt-3 text-sm text-zinc-700">{item.meaningKo}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(folderId, item.id)}
                      className="rounded-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                      aria-label="즐겨찾기"
                    >
                      {item.favorite ? "★" : "☆"}
                    </button>
                    <button
                      type="button"
                      onClick={() => speakJa(item.wordJa)}
                      className="rounded-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                      aria-label="발음"
                    >
                      🔊
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(folderId, item.id)}
                      className="rounded-full px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-100"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          open={open}
          title="단어 추가"
          onClose={() => {
            setOpen(false);
            setWordJa("");
            setReadingJa("");
            setMeaningKo("");
            setLoading(false);
          }}
        >
          <div className="flex flex-col gap-3">
            <input
              value={wordJa}
              onChange={(e) => setWordJa(e.target.value)}
              placeholder='한자/일본어 단어 (예: "好", "入り口")'
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!wordJa.trim() || loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const r = await lookupAutoFill(wordJa);
                    if (r?.word) setWordJa(r.word);
                    if (r?.reading) setReadingJa(r.reading);
                    if (r?.meaningKo) setMeaningKo(r.meaningKo);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-zinc-300"
              >
                {loading ? "생성중..." : "자동생성"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReadingJa("");
                  setMeaningKo("");
                }}
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
              >
                초기화
              </button>
            </div>
            <input
              value={readingJa}
              onChange={(e) => setReadingJa(e.target.value)}
              placeholder='히라가나 발음 (예: "かさ")'
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
            <input
              value={meaningKo}
              onChange={(e) => setMeaningKo(e.target.value)}
              placeholder='한글 뜻 (예: "싸움")'
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={() => {
                addItem(folderId, { meaningKo, wordJa, readingJa });
                setOpen(false);
                setWordJa("");
                setReadingJa("");
                setMeaningKo("");
              }}
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              추가하기
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
