/**
 * Helper Vercel Blob pour la pièce jointe d'une pièce de rechange.
 * L'écran Stocks appelle cette fonction. Sans jeton, l'envoi est refusé.
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
