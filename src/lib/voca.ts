export type VocaItem = {
  id: string;
  meaningKo: string;
  wordJa: string;
  readingJa: string;
  createdAt: number;
  favorite: boolean;
};

export type Folder = {
  id: string;
  name: string;
  createdAt: number;
  items: VocaItem[];
};

export type AppDataV1 = {
  version: 1;
  folders: Folder[];
};

export const STORAGE_KEY = "jlpt-voca:data";

export function createId(prefix: string) {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;
}

export function containsJapanese(text: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
}

export function createEmptyData(): AppDataV1 {
  return { version: 1, folders: [] };
}
