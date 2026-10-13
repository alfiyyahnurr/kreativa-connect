import { put, del } from '@vercel/blob';

export async function uploadPublicFile(
  path: string,
  file: File | Buffer,
  contentType?: string
): Promise<{ url: string; size: number }> {
  const blob = await put(path, file, {
    access: 'public',
    contentType,
  });

  const fileSize = typeof file === 'object' && 'size' in file ? (file as File).size : (file as Buffer).length;
  return { url: blob.url, size: fileSize };
}

export async function deletePublicFile(url: string): Promise<void> {
  await del(url);
}
