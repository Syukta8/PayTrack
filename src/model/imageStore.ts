/** IndexedDB storage helper for high-resolution receipt images.
 * Keeps giant base64 strings out of Google Sheets cells to prevent 400 Bad Request limits.
 */
const DB_NAME = "PayTrackImageStore";
const STORE_NAME = "receipt_images";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveReceiptImage(id: string, base64Data: string): Promise<void> {
  if (!id || !base64Data) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(base64Data, id);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Failed to save receipt image to IndexedDB:", err);
  }
}

export async function getReceiptImage(id: string): Promise<string | null> {
  if (!id) return null;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result as string || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
