import { useState, useCallback, useRef } from "react";
import { screenshotStorage, type Screenshot } from "../services/screenshotStorage";

export function useScreenshot() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // kept for API compatibility — no longer used for capture but still passed to iframe
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const captureScreenshot = useCallback(async () => {
    setIsCapturing(true);
    setError(null);

    try {
      const response = await fetch("/api/screenshot");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Screenshot failed");

      const sequenceNumber = await screenshotStorage.getNextSequenceNumber();
      const screenshot: Screenshot = {
        id: `screenshot_${Date.now()}_${sequenceNumber}`,
        name: `screenshot_${sequenceNumber}`,
        dataUrl: data.dataUrl,
        timestamp: Date.now(),
      };

      await screenshotStorage.save(screenshot);
      return screenshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to capture screenshot";
      setError(errorMessage);
      throw err;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const setIframeRef = useCallback((iframe: HTMLIFrameElement | null) => {
    iframeRef.current = iframe;
  }, []);

  return { captureScreenshot, isCapturing, error, setIframeRef };
}
