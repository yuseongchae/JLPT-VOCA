"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useVocaStore } from "./providers";

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

export default function Home() {
  const { data, createFolder, deleteFolder } = useVocaStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const folders = useMemo(() => data.folders, [data.folders]);

  return (
    <div className="flex flex-1 justify-center px-5 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">JLPT 단어장</div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            폴더 만들기
          </button>
        </div>

        {folders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            폴더를 만들어 단어장을 만들어보세요.
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {folders.map((f) => (
              <div key={f.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-semibold">{f.name}</div>
                    <div className="mt-1 text-xs text-zinc-500">단어 {f.items.length}개</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/folder/${f.id}`}
                      className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
                    >
                      열기
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteFolder(f.id)}
                      className="rounded-full px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
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
          open={createOpen}
          title="폴더 만들기"
          onClose={() => {
            setCreateOpen(false);
            setFolderName("");
          }}
        >
          <div className="flex flex-col gap-3">
            <input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder='예) "JLPT N4 3장"'
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none focus:border-zinc-400 sm:text-sm"
            />
            <button
              type="button"
              onClick={() => {
                createFolder(folderName);
                setCreateOpen(false);
                setFolderName("");
              }}
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              만들기
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
