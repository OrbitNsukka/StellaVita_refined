// A small in-memory stand-in for IndexedDB, written for the tests. It covers
// only what app/js/store.js uses. The real IndexedDB is exercised in the
// browser test (tests/e2e.test.js).

function later(work) {
  setTimeout(work, 0);
}

function makeRequest(transaction, compute) {
  const request = { result: undefined, error: null, onsuccess: null, onerror: null };
  transaction.pending += 1;
  later(() => {
    try {
      request.result = compute();
      request.onsuccess?.({ target: request });
    } catch (error) {
      request.error = error;
      transaction.failed = error;
      request.onerror?.({ target: request });
    }
    transaction.pending -= 1;
    transaction.settle();
  });
  return request;
}

function makeObjectStore(definition, transaction) {
  const needWrite = () => {
    if (transaction.mode !== "readwrite") throw new Error("ReadOnlyError: the transaction is read-only");
  };
  return {
    put(value) {
      needWrite();
      const copy = structuredClone(value);
      const key = copy[definition.keyPath];
      if (key === undefined || key === null) throw new Error("DataError: the value has no key");
      return makeRequest(transaction, () => {
        definition.rows.set(key, copy);
        return key;
      });
    },
    get(key) {
      return makeRequest(transaction, () => structuredClone(definition.rows.get(key)));
    },
    getAll() {
      return makeRequest(transaction, () => [...definition.rows.keys()].sort().map((key) => structuredClone(definition.rows.get(key))));
    },
    delete(key) {
      needWrite();
      return makeRequest(transaction, () => {
        definition.rows.delete(key);
      });
    },
    clear() {
      needWrite();
      return makeRequest(transaction, () => {
        definition.rows.clear();
      });
    },
    index(name) {
      const keyPath = definition.indexes.get(name);
      if (!keyPath) throw new Error(`NotFoundError: no index ${name}`);
      return {
        getAll(key) {
          return makeRequest(transaction, () =>
            [...definition.rows.keys()].sort().map((k) => definition.rows.get(k)).filter((row) => row[keyPath] === key).map((row) => structuredClone(row)));
        },
      };
    },
  };
}

function makeDatabase(record) {
  return {
    objectStoreNames: { contains: (name) => record.stores.has(name) },
    createObjectStore(name, options) {
      const definition = { keyPath: options.keyPath, rows: new Map(), indexes: new Map() };
      record.stores.set(name, definition);
      return { createIndex: (indexName, keyPath) => definition.indexes.set(indexName, keyPath) };
    },
    transaction(names, mode = "readonly") {
      for (const name of names) {
        if (!record.stores.has(name)) throw new Error(`NotFoundError: no object store ${name}`);
      }
      const transaction = {
        mode, pending: 0, failed: null, done: false, error: null,
        oncomplete: null, onerror: null, onabort: null,
        objectStore: (name) => makeObjectStore(record.stores.get(name), transaction),
        settle() {
          if (transaction.pending > 0 || transaction.done) return;
          later(() => {
            if (transaction.pending > 0 || transaction.done) return;
            transaction.done = true;
            if (transaction.failed) {
              transaction.error = transaction.failed;
              transaction.onerror?.({ target: transaction });
            } else {
              transaction.oncomplete?.({ target: transaction });
            }
          });
        },
      };
      later(() => transaction.settle());
      return transaction;
    },
    close() {},
  };
}

export function createFakeIndexedDB() {
  const databases = new Map();
  return {
    open(name, version) {
      const request = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null };
      later(() => {
        let record = databases.get(name);
        const oldVersion = record ? record.version : 0;
        if (!record) {
          record = { version: 0, stores: new Map() };
          databases.set(name, record);
        }
        request.result = makeDatabase(record);
        if (version > oldVersion) {
          record.version = version;
          request.onupgradeneeded?.({ oldVersion, newVersion: version, target: request });
        }
        request.onsuccess?.({ target: request });
      });
      return request;
    },
    names: () => [...databases.keys()],
  };
}
