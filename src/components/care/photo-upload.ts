"use client";

/**
 * photo-upload.ts — photo picker helpers for the Care Mode.
 *
 * Reads a chosen photo file and returns a display-ready data URL. This keeps
 * every page usable offline and needs no provider key. When the typed
 * `src/lib/services/storage.ts` lands, swap `uploadCarePhoto` for the real
 * uploader while keeping the same return shape.
 */

export interface CarePhotoResult {
  dataUrl: string;
  file: File;
}

const MAX_PHOTO_BYTES = 6 * 1024 * 1024; // 6 MB, plenty for a phone photo

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.readAsDataURL(file);
  });
}

export async function readCarePhoto(file: File): Promise<CarePhotoResult | null> {
  if (!file.type.startsWith("image/")) {
    return null;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("That photo is too large. Please choose a smaller one.");
  }
  const dataUrl = await fileToDataUrl(file);
  return { dataUrl, file };
}

/** Friendly one-line label for an audio file. */
export function audioFileLabel(file: File): string {
  return `${(file.size / 1024 / 1024).toFixed(1)} MB audio`;
}