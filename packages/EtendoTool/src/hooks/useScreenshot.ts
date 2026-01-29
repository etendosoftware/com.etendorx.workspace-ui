import { useState, useCallback, useRef } from "react";
import { toPng } from "html-to-image";
import { screenshotStorage, Screenshot } from "../services/screenshotStorage";

export function useScreenshot() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const captureScreenshot = useCallback(async () => {
    if (!iframeRef.current) {
      setError("No iframe reference available");
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      // Get the iframe's document
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;

      if (!iframeDoc || !iframeDoc.body) {
        throw new Error("Cannot access iframe content");
      }

      // Capture the iframe's body as an image
      const dataUrl = await toPng(iframeDoc.body, {
        cacheBust: true,
        pixelRatio: 2, // Higher quality
      });

      // Get the next sequence number
      const sequenceNumber = await screenshotStorage.getNextSequenceNumber();

      // Create screenshot object
      const screenshot: Screenshot = {
        id: `screenshot_${Date.now()}_${sequenceNumber}`,
        name: `screenshot_${sequenceNumber}`,
        dataUrl,
        timestamp: Date.now(),
      };

      // Save to IndexedDB
      await screenshotStorage.save(screenshot);

      return screenshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to capture screenshot";
      setError(errorMessage);
      console.error("Screenshot error:", err);
      throw err;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const setIframeRef = useCallback((iframe: HTMLIFrameElement | null) => {
    iframeRef.current = iframe;
  }, []);

  return {
    captureScreenshot,
    isCapturing,
    error,
    setIframeRef,
  };
}
