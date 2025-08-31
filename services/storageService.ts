// A new file to handle IndexedDB operations for large data like media files.
const DB_NAME = 'SerendipityDB';
const STORE_NAME = 'mediaFiles';
const DB_VERSION = 1;

class StorageService {
    private dbPromise: Promise<IDBDatabase>;

    constructor() {
        this.dbPromise = new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                console.error("IndexedDB is not supported in this environment.");
                // Reject the promise with an error
                return reject(new Error("IndexedDB not supported"));
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error("IndexedDB error:", request.error);
                reject(new Error("Error opening IndexedDB."));
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    private async getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
        const db = await this.dbPromise;
        const transaction = db.transaction(STORE_NAME, mode);
        return transaction.objectStore(STORE_NAME);
    }

    public async setItem<T>(key: string, value: T): Promise<void> {
        const store = await this.getStore('readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(value, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    public async getItem<T>(key: string): Promise<T | undefined> {
        const store = await this.getStore('readonly');
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result as T | undefined);
            request.onerror = () => reject(request.error);
        });
    }

    public async deleteItem(key: string): Promise<void> {
        const store = await this.getStore('readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const storageService = new StorageService();
