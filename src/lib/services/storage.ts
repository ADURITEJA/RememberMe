/**
 * Storage service abstraction.
 * When no cloud credentials are configured, files are stored in-memory
 * and served back as data-URLs. Swap this out for S3, GCS, etc.
 */

const inMemoryStore = new Map<string, string>();

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

/**
 * "Upload" a file and return a URL that can be fetched later.
 * In dev/demo mode the file is kept in memory as a data URL.
 */
export async function uploadFile(
  file: Blob,
  filename: string,
  prefix = "uploads",
): Promise<UploadResult> {
  const key = `${prefix}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  // Convert to data URL for in-memory storage (demo / local dev)
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      "",
    ),
  );
  const contentType = file.type || "application/octet-stream";
  const dataUrl = `data:${contentType};base64,${base64}`;

  inMemoryStore.set(key, dataUrl);

  return { url: `/${key}`, key, size: file.size };
}

/**
 * Retrieve a previously uploaded file URL by its key.
 */
export function getFileUrl(key: string): string | null {
  return inMemoryStore.get(key) ?? null;
}

/**
 * Delete a file by key.
 */
export function deleteFile(key: string): boolean {
  return inMemoryStore.delete(key);
}
