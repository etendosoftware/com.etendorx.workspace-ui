"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { FAVICON_BADGE_KEY, usePreferencesStore } from "@/stores/preferencesStore";

const BASE_FAVICON_PATH = "/favicon.ico";

/**
 * Updates the favicon link tag in the document head
 */
const updateFaviconLink = (newUrl: string) => {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = newUrl;
};

/**
 * Draws a colored badge on the favicon using Canvas API
 */
const drawFaviconWithBadge = (baseImage: HTMLImageElement, color: string): string => {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return baseImage.src;
  }

  // Draw the base favicon
  ctx.drawImage(baseImage, 0, 0, size, size);

  // Draw the colored badge circle in the bottom-right corner
  const badgeRadius = size * 0.2; // 20% of total size
  const badgeCenterX = size - badgeRadius - 2; // 2px padding from edge
  const badgeCenterY = size - badgeRadius - 2;

  // Draw the badge with white border for contrast
  ctx.beginPath();
  ctx.arc(badgeCenterX, badgeCenterY, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.stroke();

  return canvas.toDataURL("image/png");
};

// Re-export for backward compatibility during migration.
// New code should import directly from @/stores/preferencesStore.
export const usePreferences = () => ({
  customFaviconColor: usePreferencesStore((s) => s.customFaviconColor),
  setCustomFaviconColor: usePreferencesStore((s) => s.setCustomFaviconColor),
});

/**
 * Hydrates the store from localStorage and keeps the favicon DOM element in sync.
 * State lives in Zustand — this provider only handles browser side-effects.
 */
export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const customFaviconColor = usePreferencesStore((s) => s.customFaviconColor);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hydrate store from localStorage on mount (bypasses the action to avoid a redundant write)
  useEffect(() => {
    const savedColor = localStorage.getItem(FAVICON_BADGE_KEY);
    usePreferencesStore.setState({ customFaviconColor: savedColor });
    setIsInitialized(true);
  }, []);

  // Update favicon whenever color changes
  useEffect(() => {
    if (!isInitialized) return;

    if (!customFaviconColor) {
      updateFaviconLink(BASE_FAVICON_PATH);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const faviconWithBadge = drawFaviconWithBadge(img, customFaviconColor);
      updateFaviconLink(faviconWithBadge);
    };
    img.onerror = (e) => {
      console.warn("Failed to load base favicon for badge overlay", e);
    };
    // Cache-buster to ensure browsers always fetch the latest version
    img.src = `${BASE_FAVICON_PATH}?v=${Date.now()}`;
  }, [customFaviconColor, isInitialized]);

  return <>{children}</>;
};
