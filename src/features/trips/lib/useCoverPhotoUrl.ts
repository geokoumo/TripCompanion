import { useEffect, useState } from 'react';
import { getTripFileUrl, isLocalDataUrl } from '../../../data/storage/tripFilesBucket';

/** Resolves a trip's optional coverPhotoPath into something an <img> can use — null while there's no photo set or none loaded yet. */
export function useCoverPhotoUrl(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(path && isLocalDataUrl(path) ? path : null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    if (isLocalDataUrl(path)) {
      setUrl(path);
      return;
    }
    let cancelled = false;
    getTripFileUrl(path)
      .then((signed) => {
        if (!cancelled) setUrl(signed);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}
