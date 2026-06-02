"use client";

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { createEmptyData, createId, STORAGE_KEY, type AppDataV1, type Folder, type VocaItem } from "@/lib/voca";

type CreateItemInput = {
  meaningKo: string;
  wordJa: string;
  readingJa: string;
};

type VocaStore = {
  hydrated: boolean;
  data: AppDataV1;
  createFolder: (name: string) => void;
  deleteFolder: (folderId: string) => void;
  addItem: (folderId: string, input: CreateItemInput) => void;
  deleteItem: (folderId: string, itemId: string) => void;
  toggleFavorite: (folderId: string, itemId: string) => void;
};

const VocaContext = createContext<VocaStore | null>(null);

function safeParse(raw: string | null): AppDataV1 | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const version = (parsed as { version?: unknown }).version;
    if (version !== 1) return null;
    const folders = (parsed as { folders?: unknown }).folders;
    if (!Array.isArray(folders)) return null;
    return parsed as AppDataV1;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();
let storageEventAttached = false;
const serverSnapshot = createEmptyData();
let cachedRaw: string | null = null;
let cachedSnapshot: AppDataV1 = serverSnapshot;

function safeReadRaw() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeWriteRaw(raw: string) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

function emitChange() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (typeof window !== "undefined" && !storageEventAttached) {
    storageEventAttached = true;
    window.addEventListener("storage", () => emitChange());
  }

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return serverSnapshot;
  const raw = safeReadRaw();
  if (raw === cachedRaw) return cachedSnapshot;

  cachedRaw = raw;
  cachedSnapshot = safeParse(raw) ?? createEmptyData();
  return cachedSnapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function updateData(updater: (prev: AppDataV1) => AppDataV1) {
  const next = updater(getSnapshot());
  if (typeof window !== "undefined") {
    const raw = JSON.stringify(next);
    const ok = safeWriteRaw(raw);
    if (ok) {
      cachedRaw = raw;
      cachedSnapshot = next;
    }
  }
  emitChange();
}

export function VocaProvider({ children }: { children: React.ReactNode }) {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = typeof window !== "undefined";

  const createFolder = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const folder: Folder = { id: createId("folder"), name: trimmed, createdAt: Date.now(), items: [] };
    updateData((prev) => ({ ...prev, folders: [folder, ...prev.folders] }));
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    updateData((prev) => ({ ...prev, folders: prev.folders.filter((f) => f.id !== folderId) }));
  }, []);

  const addItem = useCallback((folderId: string, input: CreateItemInput) => {
    const meaningKo = input.meaningKo.trim();
    const wordJa = input.wordJa.trim();
    const readingJa = input.readingJa.trim();
    if (!meaningKo || !wordJa) return;

    const item: VocaItem = {
      id: createId("item"),
      meaningKo,
      wordJa,
      readingJa,
      createdAt: Date.now(),
      favorite: false,
    };

    updateData((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => (f.id === folderId ? { ...f, items: [item, ...f.items] } : f)),
    }));
  }, []);

  const deleteItem = useCallback((folderId: string, itemId: string) => {
    updateData((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => (f.id === folderId ? { ...f, items: f.items.filter((i) => i.id !== itemId) } : f)),
    }));
  }, []);

  const toggleFavorite = useCallback((folderId: string, itemId: string) => {
    updateData((prev) => ({
      ...prev,
      folders: prev.folders.map((f) =>
        f.id === folderId
          ? { ...f, items: f.items.map((i) => (i.id === itemId ? { ...i, favorite: !i.favorite } : i)) }
          : f,
      ),
    }));
  }, []);

  const value = useMemo<VocaStore>(
    () => ({ hydrated, data, createFolder, deleteFolder, addItem, deleteItem, toggleFavorite }),
    [hydrated, data, createFolder, deleteFolder, addItem, deleteItem, toggleFavorite],
  );

  return <VocaContext.Provider value={value}>{children}</VocaContext.Provider>;
}

export function useVocaStore() {
  const ctx = useContext(VocaContext);
  if (!ctx) throw new Error("VocaProvider is missing");
  return ctx;
}
