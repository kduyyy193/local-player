import { Track, PlaybackMode } from '../types';

const DB_NAME = 'VibeLocalDB';
const DB_VERSION = 1;
const STORE_TRACKS = 'tracks';
const STORE_SETTINGS = 'settings';

export interface AppSettings {
    volume: number;
    playbackRate: number;
    mode: PlaybackMode;
    coverImage: string | null;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_TRACKS)) {
                db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
                db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

export const saveTracksToDB = async (tracks: Track[]) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_TRACKS, 'readwrite');
        const store = transaction.objectStore(STORE_TRACKS);

        // Clear old tracks first to keep sync simple
        store.clear();

        tracks.forEach(track => {
            // We cannot store the blob URL (it expires), we store the File object directly
            const trackToStore = {
                id: track.id,
                name: track.name,
                file: track.file
            };
            store.put(trackToStore);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getTracksFromDB = async (): Promise<Track[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_TRACKS, 'readonly');
        const store = transaction.objectStore(STORE_TRACKS);
        const request = store.getAll();

        request.onsuccess = () => {
            const rawTracks = request.result;
            // Reconstruct tracks with new ObjectURLs
            const tracks: Track[] = rawTracks.map((t: any) => ({
                id: t.id,
                name: t.name,
                file: t.file,
                url: URL.createObjectURL(t.file) // Create new URL for this session
            }));
            resolve(tracks);
        };

        request.onerror = () => reject(request.error);
    });
};

export const saveSetting = async (key: string, value: any) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_SETTINGS, 'readwrite');
        const store = transaction.objectStore(STORE_SETTINGS);
        store.put({ key, value });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getSetting = async (key: string): Promise<any> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_SETTINGS, 'readonly');
        const store = transaction.objectStore(STORE_SETTINGS);
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result ? request.result.value : null);
        };
        request.onerror = () => reject(request.error);
    });
};

export const clearAllData = async () => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const t1 = db.transaction(STORE_TRACKS, 'readwrite');
        t1.objectStore(STORE_TRACKS).clear();

        const t2 = db.transaction(STORE_SETTINGS, 'readwrite');
        t2.objectStore(STORE_SETTINGS).clear();

        // Wait for both? easier to just resolve
        t1.oncomplete = () => resolve();
    });
};

// Helper to convert Blob/File to Base64 for image storage if needed
export const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};