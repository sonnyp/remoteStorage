export class AsyncStorage {
  name: string;
  private open: Promise<IDBDatabase>;

  constructor(name: string) {
    this.name = name;
    this.open = new Promise((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(name);
      };
    });
  }

  private async withObjectStore(mode: IDBTransactionMode) {
    const IDBDatabase = await this.open;
    const IDBTransaction = IDBDatabase.transaction(this.name, mode);
    const IDBObjectStore = IDBTransaction.objectStore(this.name);
    return { IDBObjectStore, IDBTransaction };
  }

  async clear() {
    const { IDBObjectStore, IDBTransaction } = await this.withObjectStore(
      "readwrite",
    );
    const IDBRequest = IDBObjectStore.clear();

    return new Promise((resolve, reject) => {
      IDBRequest.onerror = () => reject(IDBRequest.error);
      IDBTransaction.oncomplete = () => resolve();
      IDBTransaction.onerror = () => reject(IDBTransaction.error);
    });
  }

  async setItem(key: IDBValidKey, value: any) {
    const { IDBObjectStore, IDBTransaction } = await this.withObjectStore(
      "readwrite",
    );
    const IDBRequest = IDBObjectStore.put(value, key);

    return new Promise((resolve, reject) => {
      IDBRequest.onerror = () => reject(IDBRequest.error);
      IDBTransaction.oncomplete = () => resolve();
      IDBTransaction.onerror = () => reject(IDBTransaction.error);
    });
  }

  async getItem(key: IDBValidKey) {
    const { IDBObjectStore, IDBTransaction } = await this.withObjectStore(
      "readonly",
    );
    const IDBRequest = IDBObjectStore.get(key);

    return new Promise((resolve, reject) => {
      IDBRequest.onerror = () => reject(IDBRequest.error);
      IDBRequest.onsuccess = () => {
        const result = IDBRequest.result;
        resolve(result === undefined ? null : result);
      };
      IDBTransaction.onerror = () => reject(IDBTransaction.error);
    });
  }

  async removeItem(key: IDBValidKey) {
    const { IDBObjectStore, IDBTransaction } = await this.withObjectStore(
      "readwrite",
    );
    const IDBRequest = IDBObjectStore.delete(key);

    return new Promise((resolve, reject) => {
      IDBRequest.onerror = () => reject(IDBRequest.error);
      IDBRequest.onsuccess = () => resolve();
      IDBTransaction.onerror = () => reject(IDBTransaction.error);
    });
  }
}

// export default new AsyncStorage("asyncStorage");
