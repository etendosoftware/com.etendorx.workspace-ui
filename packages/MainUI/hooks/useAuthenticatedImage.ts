"use client";

import { useState, useEffect } from "react";
import { useUserContext } from "./useUserContext";

export function useAuthenticatedImage(imageId: string | null, cacheKey?: number): string | null {
  const { token } = useUserContext();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageId || !token) {
      setBlobUrl(null);
      return;
    }

    let revoked = false;
    let currentBlobUrl: string | null = null;

    const url =
      cacheKey !== undefined
        ? `/api/erp/utility/ShowImage?id=${imageId}&nocache=${cacheKey}`
        : `/api/erp/utility/ShowImage?id=${imageId}`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load image: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        currentBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(currentBlobUrl);
      })
      .catch(() => {
        if (!revoked) setBlobUrl(null);
      });

    return () => {
      revoked = true;
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    };
  }, [imageId, token, cacheKey]);

  return blobUrl;
}
