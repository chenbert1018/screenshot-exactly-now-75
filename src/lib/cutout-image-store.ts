const DB_NAME = "idoldays-local-media";
const DB_VERSION = 1;
const STORE_NAME = "cutouts";
const REF_PREFIX = "idb-cutout:";

type CutoutRecord = {
  blob: Blob;
  updatedAt: number;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to open IndexedDB"));
  });
}

function makeKey(): string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `cutout_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function refToKey(ref: string): string | null {
  if (!ref.startsWith(REF_PREFIX)) return null;

  const key = ref.slice(REF_PREFIX.length);
  return key || null;
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const comma = dataUrl.indexOf(",");
    if (
      comma < 0 ||
      !dataUrl.startsWith("data:image/")
    ) {
      return null;
    }

    const header = dataUrl.slice(5, comma);
    const payload = dataUrl.slice(comma + 1);

    if (!payload) return null;

    const contentType =
      header.split(";")[0] || "image/png";

    const isBase64 = header.includes(";base64");

    if (isBase64) {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }

      return new Blob(
        [bytes],
        { type: contentType },
      );
    }

    return new Blob(
      [decodeURIComponent(payload)],
      { type: contentType },
    );
  } catch {
    return null;
  }
}

export function isCutoutImageRef(
  value: string | null | undefined,
): boolean {
  return (
    typeof value === "string" &&
    value.startsWith(REF_PREFIX)
  );
}

export async function saveCutoutImage(
  dataUrl: string,
  existingRef?: string,
): Promise<string> {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is unavailable");
  }

  const blob = dataUrlToBlob(dataUrl);

  if (!blob) {
    throw new Error("Invalid cutout image");
  }

  const existingKey = existingRef
    ? refToKey(existingRef)
    : null;

  const key = existingKey ?? makeKey();
  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(
        STORE_NAME,
        "readwrite",
      );

      const store = transaction.objectStore(STORE_NAME);

      const record: CutoutRecord = {
        blob,
        updatedAt: Date.now(),
      };

      store.put(record, key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ??
            new Error("Unable to save cutout image"),
        );
      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error("Cutout image save aborted"),
        );
    });
  } finally {
    db.close();
  }

  return `${REF_PREFIX}${key}`;
}

export async function loadCutoutImageBlob(
  ref: string,
): Promise<Blob | null> {
  const key = refToKey(ref);

  if (!key || typeof indexedDB === "undefined") {
    return null;
  }

  const db = await openDatabase();

  try {
    return await new Promise<Blob | null>(
      (resolve, reject) => {
        const transaction = db.transaction(
          STORE_NAME,
          "readonly",
        );

        const request = transaction
          .objectStore(STORE_NAME)
          .get(key);

        request.onsuccess = () => {
          const record =
            request.result as CutoutRecord | undefined;

          resolve(
            record?.blob instanceof Blob
              ? record.blob
              : null,
          );
        };

        request.onerror = () =>
          reject(
            request.error ??
              new Error("Unable to load cutout image"),
          );
      },
    );
  } finally {
    db.close();
  }
}

export async function removeCutoutImage(
  ref: string,
): Promise<void> {
  const key = refToKey(ref);

  if (!key || typeof indexedDB === "undefined") {
    return;
  }

  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(
        STORE_NAME,
        "readwrite",
      );

      transaction
        .objectStore(STORE_NAME)
        .delete(key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ??
            new Error("Unable to remove cutout image"),
        );
    });
  } finally {
    db.close();
  }
}
