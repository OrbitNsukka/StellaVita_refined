// On-device storage: IndexedDB, used directly (D-53). Nothing is sent anywhere.
// The database has its own name, so it never touches the original build's
// data when both are served from the same site.

export const DB_NAME = "stellavita-refined";
export const DB_VERSION = 1;

export const STORES = Object.freeze({
  profiles: "profiles",
  readings: "readings",
  settings: "settings",
  meta: "meta",
});

const PROFILE_INDEX = "profileId";

function asPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function finished(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error("The storage transaction was aborted."));
  });
}

function upgrade(db) {
  if (!db.objectStoreNames.contains(STORES.profiles)) db.createObjectStore(STORES.profiles, { keyPath: "id" });
  if (!db.objectStoreNames.contains(STORES.readings)) {
    const readings = db.createObjectStore(STORES.readings, { keyPath: "id" });
    readings.createIndex(PROFILE_INDEX, PROFILE_INDEX);
  }
  if (!db.objectStoreNames.contains(STORES.settings)) db.createObjectStore(STORES.settings, { keyPath: "version" });
  if (!db.objectStoreNames.contains(STORES.meta)) db.createObjectStore(STORES.meta, { keyPath: "key" });
}

export function openStore(factory = globalThis.indexedDB, name = DB_NAME) {
  return new Promise((resolve, reject) => {
    if (!factory) {
      reject(new Error("This browser offers no on-device storage (IndexedDB)."));
      return;
    }
    let request;
    try {
      request = factory.open(name, DB_VERSION);
    } catch (error) {
      reject(error);
      return;
    }
    request.onupgradeneeded = () => upgrade(request.result);
    request.onsuccess = () => resolve(makeStore(request.result));
    request.onerror = () => reject(request.error ?? new Error("On-device storage could not be opened."));
    request.onblocked = () => reject(new Error("On-device storage is in use by another tab."));
  });
}

function makeStore(db) {
  const read = (storeName, work) => {
    const transaction = db.transaction([storeName], "readonly");
    return asPromise(work(transaction.objectStore(storeName)));
  };
  const write = async (storeName, work) => {
    const transaction = db.transaction([storeName], "readwrite");
    const done = finished(transaction);
    work(transaction.objectStore(storeName));
    await done;
  };

  return {
    // profiles
    getProfiles: () => read(STORES.profiles, (store) => store.getAll()),
    getProfile: (id) => read(STORES.profiles, (store) => store.get(id)).then((found) => found ?? null),
    putProfiles: (profiles) => write(STORES.profiles, (store) => profiles.forEach((profile) => store.put(profile))),

    // readings
    getReadings: (profileId) => read(STORES.readings, (store) => store.index(PROFILE_INDEX).getAll(profileId)),
    getAllReadings: () => read(STORES.readings, (store) => store.getAll()),
    putReading: (reading) => write(STORES.readings, (store) => store.put(reading)),
    putReadings: (readings) => write(STORES.readings, (store) => readings.forEach((reading) => store.put(reading))),
    deleteReading: (id) => write(STORES.readings, (store) => store.delete(id)),
    clearReadings: () => write(STORES.readings, (store) => store.clear()),

    // cached settings, one copy per version
    getSettings: (version) => read(STORES.settings, (store) => store.get(version)).then((found) => found ?? null),
    listSettings: () => read(STORES.settings, (store) => store.getAll()),
    putSettings: (entry) => write(STORES.settings, (store) => store.put(entry)),

    // small device notes
    getMeta: (key) => read(STORES.meta, (store) => store.get(key)).then((found) => (found ? found.value : null)),
    setMeta: (key, value) => write(STORES.meta, (store) => store.put({ key, value })),

    close: () => db.close(),
  };
}
