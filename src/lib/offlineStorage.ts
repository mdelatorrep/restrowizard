// IndexedDB wrapper for offline POS storage

const DB_NAME = 'restrowizard-pos';
const DB_VERSION = 1;
const STORES = {
  pendingSales: 'pending_sales',
  syncQueue: 'sync_queue',
  cachedProducts: 'cached_products',
  cachedTables: 'cached_tables'
};

interface PendingSale {
  id: string;
  /**
   * B-08: se persiste APENAS se crea la orden en el servidor. Sin esto, un
   * reintento tras un fallo parcial vuelve a crear la orden → venta duplicada.
   */
  orderId?: string;
  tableId?: string | null;
  tableName?: string;
  /**
   * B-09: contexto de la venta que el cierre de caja necesita. Si no se captura
   * al vender, al sincronizar ya no hay forma de saber a qué turno pertenecía
   * ni si entró en efectivo → la plata no cuadra.
   */
  sessionId?: string | null;
  guestsCount?: number;
  orderType?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  tipAmount: number;
  total: number;
  payments: Array<{
    methodId: string;
    methodName: string;
    amount: number;
    reference?: string;
  }>;
  customerName?: string;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  lastError?: string;
}

interface SyncQueueItem {
  id: string;
  type: 'sale' | 'order_update' | 'inventory_deduction';
  data: any;
  createdAt: string;
  retryCount: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Pending sales store
        if (!db.objectStoreNames.contains(STORES.pendingSales)) {
          const salesStore = db.createObjectStore(STORES.pendingSales, { keyPath: 'id' });
          salesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          salesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.syncQueue)) {
          const queueStore = db.createObjectStore(STORES.syncQueue, { keyPath: 'id' });
          queueStore.createIndex('type', 'type', { unique: false });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Cached products store
        if (!db.objectStoreNames.contains(STORES.cachedProducts)) {
          db.createObjectStore(STORES.cachedProducts, { keyPath: 'id' });
        }

        // Cached tables store
        if (!db.objectStoreNames.contains(STORES.cachedTables)) {
          db.createObjectStore(STORES.cachedTables, { keyPath: 'id' });
        }

        console.log('📦 IndexedDB stores created');
      };
    });

    return this.dbPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.init();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Pending Sales Methods
  async addPendingSale(sale: Omit<PendingSale, 'syncStatus' | 'retryCount'>): Promise<string> {
    const store = await this.getStore(STORES.pendingSales, 'readwrite');
    const pendingSale: PendingSale = {
      ...sale,
      syncStatus: 'pending',
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const request = store.add(pendingSale);
      request.onsuccess = () => {
        console.log('💾 Sale saved offline:', sale.id);
        resolve(sale.id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSales(): Promise<PendingSale[]> {
    const store = await this.getStore(STORES.pendingSales);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSalesByStatus(status: PendingSale['syncStatus']): Promise<PendingSale[]> {
    const store = await this.getStore(STORES.pendingSales);
    const index = store.index('syncStatus');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(status);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePendingSale(id: string, updates: Partial<PendingSale>): Promise<void> {
    const store = await this.getStore(STORES.pendingSales, 'readwrite');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const sale = getRequest.result;
        if (!sale) {
          reject(new Error('Sale not found'));
          return;
        }
        
        const updatedSale = { ...sale, ...updates };
        const putRequest = store.put(updatedSale);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deletePendingSale(id: string): Promise<void> {
    const store = await this.getStore(STORES.pendingSales, 'readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('🗑️ Pending sale deleted:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSalesCount(): Promise<number> {
    const store = await this.getStore(STORES.pendingSales);
    
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Cache Methods for Products
  async cacheProducts(products: any[]): Promise<void> {
    const store = await this.getStore(STORES.cachedProducts, 'readwrite');
    
    // Clear existing cache
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Add new products
    for (const product of products) {
      await new Promise<void>((resolve, reject) => {
        const request = store.add(product);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log('📦 Products cached:', products.length);
  }

  async getCachedProducts(): Promise<any[]> {
    const store = await this.getStore(STORES.cachedProducts);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Cache Methods for Tables
  async cacheTables(tables: any[]): Promise<void> {
    const store = await this.getStore(STORES.cachedTables, 'readwrite');
    
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    for (const table of tables) {
      await new Promise<void>((resolve, reject) => {
        const request = store.add(table);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log('📦 Tables cached:', tables.length);
  }

  async getCachedTables(): Promise<any[]> {
    const store = await this.getStore(STORES.cachedTables);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue Methods
  async addToSyncQueue(item: Omit<SyncQueueItem, 'retryCount'>): Promise<void> {
    const store = await this.getStore(STORES.syncQueue, 'readwrite');
    const queueItem: SyncQueueItem = { ...item, retryCount: 0 };
    
    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const store = await this.getStore(STORES.syncQueue);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const store = await this.getStore(STORES.syncQueue, 'readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.init();
    
    for (const storeName of Object.values(STORES)) {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    console.log('🗑️ All offline data cleared');
  }
}

export const offlineStorage = new OfflineStorage();
export type { PendingSale, SyncQueueItem };
