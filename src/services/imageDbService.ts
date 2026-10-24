/**
 * Serviço de Cache no IndexedDB para Fotos e Dados Eleitorais
 * Armazena as fotos e os snapshots da apuração localmente no navegador,
 * possibilitando renderização instantânea (0ms), funcionamento resiliente e economia de banda.
 */

import type { Candidate, ElectionDataPackage } from '../types/election';

const DB_NAME = 'TSE_ELECTIONS_STORAGE_V2';
const PHOTO_STORE = 'candidate_photos';
const DATA_STORE = 'election_snapshots';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

// Cache em memória de ObjectURLs criados na sessão para acesso ultra-rápido sem recriação
const memoryBlobUrlCache = new Map<string, string>();

/**
 * Inicializa a conexão com o IndexedDB
 */
export function openStorageDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado neste navegador'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// ========================================================
// 1. CACHE DE IMAGENS / FOTOS NO INDEXEDDB
// ========================================================

/**
 * Busca uma imagem armazenada no IndexedDB
 */
export async function getImageFromDb(url: string): Promise<Blob | null> {
  try {
    const db = await openStorageDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(PHOTO_STORE, 'readonly');
      const store = transaction.objectStore(PHOTO_STORE);
      const request = store.get(url);

      request.onsuccess = () => {
        if (request.result && request.result.blob) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Salva uma foto no IndexedDB
 */
export async function saveImageToDb(url: string, blob: Blob): Promise<void> {
  try {
    const db = await openStorageDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTO_STORE, 'readwrite');
      const store = transaction.objectStore(PHOTO_STORE);
      const item = {
        url,
        blob,
        savedAt: Date.now(),
      };

      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Falha silenciosa se armazenamento estiver temporariamente bloqueado
  }
}

/**
 * Obtém URL pronta para exibição (seja do cache de memória, do IndexedDB ou baixando da CDN e salvando)
 */
export async function getCachedOrFetchPhotoUrl(url: string): Promise<string> {
  if (!url) return '';

  // 1. Verifica cache rápido de memória
  if (memoryBlobUrlCache.has(url)) {
    return memoryBlobUrlCache.get(url)!;
  }

  try {
    // 2. Verifica se já está salvo no IndexedDB
    const cachedBlob = await getImageFromDb(url);
    if (cachedBlob) {
      const blobUrl = URL.createObjectURL(cachedBlob);
      memoryBlobUrlCache.set(url, blobUrl);
      return blobUrl;
    }

    // 3. Se não estiver no IndexedDB, baixa da CDN oficial do TSE
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha no download da foto: ${response.status}`);
    }

    const blob = await response.blob();

    // 4. Salva no IndexedDB para as próximas vezes
    await saveImageToDb(url, blob);

    // 5. Gera ObjectURL e salva no cache da sessão
    const blobUrl = URL.createObjectURL(blob);
    memoryBlobUrlCache.set(url, blobUrl);
    return blobUrl;
  } catch {
    // Fallback para a própria URL original em caso de erro
    return url;
  }
}

/**
 * Pré-aquecimento assíncrono em segundo plano para fotos dos líderes da apuração
 */
export function preloadTopCandidatePhotos(candidates: Candidate[]): void {
  if (!candidates || candidates.length === 0) return;

  // Pré-aquece as fotos dos 6 primeiros colocados
  const topCandidates = candidates.slice(0, 6);
  topCandidates.forEach((cand) => {
    if (cand.avatar && !memoryBlobUrlCache.has(cand.avatar)) {
      // Dispara em baixa prioridade
      setTimeout(() => {
        getCachedOrFetchPhotoUrl(cand.avatar).catch(() => {});
      }, 50);
    }
  });
}

// ========================================================
// 2. CACHE DE SNAPSHOTS DE DADOS ELEITORAIS (SWR)
// ========================================================

/**
 * Salva um snapshot de dados apurados no IndexedDB
 */
export async function saveElectionSnapshotToDb(key: string, data: ElectionDataPackage): Promise<void> {
  try {
    const db = await openStorageDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DATA_STORE, 'readwrite');
      const store = transaction.objectStore(DATA_STORE);
      const record = {
        key,
        data,
        timestamp: Date.now(),
      };
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Falha silenciosa
  }
}

/**
 * Recupera um snapshot de dados eleitorais salvo no IndexedDB
 */
export async function getElectionSnapshotFromDb(key: string): Promise<ElectionDataPackage | null> {
  try {
    const db = await openStorageDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(DATA_STORE, 'readonly');
      const store = transaction.objectStore(DATA_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result && request.result.data) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}
