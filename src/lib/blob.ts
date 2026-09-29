/**
 * Helper Vercel Blob pour les pièces jointes (phase ultérieure).
 * Aucun écran d'upload n'appelle cette fonction en phase 1.
 */
export async function uploadBlob(
  pathname: string,
  body: Buffer | Blob,
  contentType: string,
): Promise<{ url: string; pathname: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN est absent.");
  }
  const { put } = await import("@vercel/blob");
  const result = await put(pathname, body, {
    access: "public",
    token,
    contentType,
  });
  return { url: result.url, pathname: result.pathname };
}
