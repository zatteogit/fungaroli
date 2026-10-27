import type { NotebookPhoto } from "./notebook-types.js";
import { isRecord, isFiniteNumber } from "./data-guards.js";
// Una copia privata leggera: canvas rimuove metadati e coordinate EXIF.
export const MAX_PHOTO_BYTES = 120_000;
const JPEG_PREFIX = "data:image/jpeg;base64,";
// Segmenti di metadati tolti anche lato server (decisione del 22/10/2026): APP1 contiene Exif (data, apparecchio,
// coordinate GPS) e XMP, APP13 IPTC/Photoshop. Restano APP0 (JFIF), APP2 (profilo colore) e APP14 (Adobe), che
// servono a mostrare i colori giusti. Le chiamate dirette all'API non devono poter salvare metadati che il browser toglie.
const METADATA_MARKERS = new Set([0xe1, 0xed]);
export function stripJpegMetadata(raw: string): {
  raw: string;
  removed: boolean;
} {
  function bad(): never {
    throw Error("Fotografia non valida o troppo grande.");
  }
  if (!raw.startsWith("\xff\xd8")) bad();
  let out = "\xff\xd8",
    i = 2,
    removed = false;
  while (i < raw.length) {
    if (raw.charCodeAt(i) !== 0xff) bad();
    let j = i;
    while (raw.charCodeAt(j) === 0xff) j++;
    const marker = raw.charCodeAt(j);
    if (j >= raw.length || marker === 0x00) bad();
    if (marker === 0xd9)
      return { raw: out + "\xff\xd9", removed: removed || j + 1 < raw.length };
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      out += "\xff" + raw[j];
      i = j + 1;
      continue;
    }
    const length = (raw.charCodeAt(j + 1) << 8) | raw.charCodeAt(j + 2),
      end = j + 1 + length;
    if (!(length >= 2) || end > raw.length) bad();
    if (METADATA_MARKERS.has(marker)) removed = true;
    else out += "\xff" + raw.slice(j, end);
    i = end;
    if (marker !== 0xda) continue;
    // Dati compressi della scansione: 0xFF seguito da 0x00 o da un marcatore RSTn ne fa parte.
    let k = i;
    while (
      k < raw.length &&
      !(
        raw.charCodeAt(k) === 0xff &&
        raw.charCodeAt(k + 1) !== 0x00 &&
        !(raw.charCodeAt(k + 1) >= 0xd0 && raw.charCodeAt(k + 1) <= 0xd7)
      )
    )
      k += raw.charCodeAt(k) === 0xff ? 2 : 1;
    out += raw.slice(i, k);
    i = k;
  }
  return bad();
}
export function normalizeNotebookPhoto(photo: unknown): NotebookPhoto | null {
  if (photo == null) return null;
  if (
    !isRecord(photo) ||
    typeof photo.data !== "string" ||
    photo.data.length > 160_024 ||
    !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.data) ||
    !isFiniteNumber(photo.width) ||
    !Number.isInteger(photo.width) ||
    !isFiniteNumber(photo.height) ||
    !Number.isInteger(photo.height) ||
    Math.min(photo.width, photo.height) < 1 ||
    Math.max(photo.width, photo.height) > 1280
  )
    throw Error("Fotografia non valida: scegli di nuovo un’immagine.");
  const raw = atob(photo.data.slice(JPEG_PREFIX.length));
  if (
    raw.length > MAX_PHOTO_BYTES ||
    !raw.startsWith("\xff\xd8") ||
    !raw.endsWith("\xff\xd9")
  )
    throw Error("Fotografia non valida o troppo grande.");
  const clean = stripJpegMetadata(raw);
  return {
    data: clean.removed ? JPEG_PREFIX + btoa(clean.raw) : photo.data,
    width: photo.width,
    height: photo.height,
  };
}
export async function prepareNotebookPhoto(
  file: File | null | undefined,
): Promise<NotebookPhoto> {
  if (!file || !file.type.startsWith("image/") || file.size > 30_000_000)
    throw Error("Scegli una fotografia fino a 30 MB.");
  const url = URL.createObjectURL(file),
    img = new Image();
  try {
    img.src = url;
    await img.decode();
    let scale = Math.min(
      1,
      1280 / Math.max(img.naturalWidth, img.naturalHeight),
    );
    if (!img.naturalWidth || !img.naturalHeight) throw Error();
    const canvas = document.createElement("canvas");
    for (let attempt = 0; attempt < 8; attempt++) {
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas
        .getContext("2d")!
        .drawImage(img, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.84, 0.72, 0.6, 0.48]) {
        const data = canvas.toDataURL("image/jpeg", quality);
        if ((data.length - 23) * 0.75 <= MAX_PHOTO_BYTES)
          return normalizeNotebookPhoto({
            data,
            width: canvas.width,
            height: canvas.height,
          })!;
      }
      scale *= 0.8;
    }
    throw Error();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Fotografia"))
      throw error;
    throw Error(
      "Non riesco a leggere questa foto. Prova un file JPEG, PNG o WebP.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
