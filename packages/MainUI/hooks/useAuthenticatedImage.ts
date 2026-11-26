"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/stores/userStore";
import { sessionAwareFetch } from "@/utils/session/sessionAwareFetch";

/** The object URL of a stored image, and whether loading it failed. */
export interface AuthenticatedImageState {
  url: string | null;
  failed: boolean;
}

/**
 * Loads a stored image with the session token. A failure leaves `failed` set, so the field can show
 * the image as missing instead of loading forever, as Classic shows a broken image without a message.
 */
export function useAuthenticatedImageState(imageId: string | null, cacheKey?: number): AuthenticatedImageState {
  const token = useUserStore((s) => s.token);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
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
    // The field shows the failure itself (missing image); only a 401 matters to the session.
    sessionAwareFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      handlesOwnError: true,
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
        if (revoked) return;
        setBlobUrl(null);
        setFailed(true);
      });

    return () => {
      revoked = true;
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    };
  }, [imageId, token, cacheKey]);

  return { url: blobUrl, failed };
}

export function useAuthenticatedImage(imageId: string | null, cacheKey?: number): string | null {
  return useAuthenticatedImageState(imageId, cacheKey).url;
}
