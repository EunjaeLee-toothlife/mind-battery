/**
 * db.js - IndexedDB 데이터베이스 인터페이스 모듈
 */

const DB_NAME = 'MindBatteryDB';
const DB_VERSION = 1;

let dbInstance = null;

export function initDatabase(onStatusChange) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }
    };

    request.onsuccess = function(e) {
      dbInstance = e.target.result;
      if (onStatusChange) {
        onStatusChange(true);
      }
      resolve(dbInstance);
    };

    request.onerror = function(e) {
      console.error('IndexedDB 로드 실패:', e.target.error);
      reject(e.target.error);
    };
  });
}

export function saveHistory(data) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject('DB가 초기화되지 않았습니다.');
    const tx = dbInstance.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    store.put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function loadHistoryList() {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject('DB가 초기화되지 않았습니다.');
    const tx = dbInstance.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getHistoryItem(id) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject('DB가 초기화되지 않았습니다.');
    const tx = dbInstance.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function deleteHistoryItem(id) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject('DB가 초기화되지 않았습니다.');
    const tx = dbInstance.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function saveSession(data) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject('DB가 초기화되지 않았습니다.');
    const tx = dbInstance.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    store.put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function loadSession(id) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject('DB가 초기화되지 않았습니다.');
    const tx = dbInstance.transaction('sessions', 'readonly');
    const store = tx.objectStore('sessions');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function deleteSession(id) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject('DB가 초기화되지 않았습니다.');
    const tx = dbInstance.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
