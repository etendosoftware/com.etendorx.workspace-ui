"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const FAVICON_BADGE_KEY = "settings.favicon_badge";
const BASE_FAVICON_PATH = "/favicon.ico";

interface PreferencesContextType {
  customFaviconColor: string | null;
  setCustomFaviconColor: (color: string | null) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};

/**
 * Updates the favicon link tag in the document head
 */
const updateFaviconLink = (newUrl: string) => {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
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

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [faviconColor, setFaviconColor] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedColor = localStorage.getItem(FAVICON_BADGE_KEY);
    if (savedColor) {
      setFaviconColor(savedColor);
    }
    setIsInitialized(true);
  }, []);

  // Wrapper to persist color changes to localStorage
  const setCustomFaviconColor = useCallback((color: string | null) => {
    setFaviconColor(color);
    if (color) {
      localStorage.setItem(FAVICON_BADGE_KEY, color);
    } else {
      localStorage.removeItem(FAVICON_BADGE_KEY);
    }
  }, []);

  // Update favicon whenever color changes
  useEffect(() => {
    if (!isInitialized) return;

    // If no color, restore original favicon
    if (!faviconColor) {
      console.log("No favicon color, restoring original favicon");
      updateFaviconLink(BASE_FAVICON_PATH);
      return;
    }

    // Load the base favicon and draw the badge
    const img = new Image();
    img.onload = () => {
      const faviconWithBadge = drawFaviconWithBadge(img, faviconColor);
      updateFaviconLink(faviconWithBadge);
    };
    img.onerror = (e) => {
      console.warn("Failed to load base favicon for badge overlay", e);
    };
    // Add cache buster to ensure fresh load
    img.src = BASE_FAVICON_PATH;
  }, [faviconColor, isInitialized]);

  return (
    <PreferencesContext.Provider value={{ customFaviconColor: faviconColor, setCustomFaviconColor }}>
      {children}
    </PreferencesContext.Provider>
  );
};
