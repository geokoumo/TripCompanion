import { useEffect, useState } from 'react';
import { getTripFileUrl, isLocalDataUrl } from '../../../data/storage/tripFilesBucket';

/** Resolves a document's storage_path into something an <img>/<a> can use — a data: URL is already usable as-is; a Storage path needs a signed URL fetched first. */
export function useDocumentUrl(storagePath: string): { url: string | null; loading: boolean } {
  const [url, setUrl] = useState<string | null>(isLocalDataUrl(storagePath) ? storagePath : null);
  const [loading, setLoading] = useState(!isLocalDataUrl(storagePath));

  useEffect(() => {
    if (isLocalDataUrl(storagePath)) {
      setUrl(storagePath);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getTripFileUrl(storagePath)
      .then((signed) => {
        if (!cancelled) setUrl(signed);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  return { url, loading };
}
