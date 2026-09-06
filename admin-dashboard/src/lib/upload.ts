/**
 * uploadFileToServer
 *
 * Uploads a File to /api/upload (multipart/form-data) and returns the
 * permanent public URL stored in PostgreSQL-compatible text columns.
 * No Firebase Storage is involved.
 *
 * @param file       The File object from a <input type="file"> element.
 * @param authHeader The Authorization header object from getAuthHeader().
 * @returns          The public URL string to persist in the database.
 * @throws           An Error if the upload fails.
 */
export async function uploadFileToServer(
  file: File,
  authHeader: Record<string, string>
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: authHeader, // Content-Type is set automatically by browser for FormData
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.url) throw new Error('Upload response missing URL');
  return data.url as string;
}
