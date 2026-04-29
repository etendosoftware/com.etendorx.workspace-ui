/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";

import { useTranslation } from "@/hooks/useTranslation";

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M3 8h10M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BookIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 7h8M8 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function CTABanner() {
  const { t } = useTranslation();

  return (
    <div className="w-full rounded-2xl bg-[#1E293B] text-white flex items-center gap-5 px-6 py-5 relative overflow-hidden">
      {/* Subtle decorative gradient */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 80% 50%, #3B82F6 0%, transparent 60%)" }}
        aria-hidden="true"
      />
      {/* Icon */}
      <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-blue-300 z-10">
        <BookIcon data-testid="BookIcon__514220" />
      </div>
      {/* Content */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0 z-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
          {t("dashboard.ctaBanner.badge")}
        </p>
        <p className="text-base font-semibold text-white leading-snug">{t("dashboard.ctaBanner.title")}</p>
        <p className="text-sm text-white/60 leading-snug">{t("dashboard.ctaBanner.description")}</p>
      </div>
      {/* CTA */}
      <div className="shrink-0 z-10">
        <a
          href="https://docs.etendo.software/whats-new/etendo-news/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-medium text-white transition-colors duration-200 cursor-pointer">
          {t("dashboard.ctaBanner.learnMore")}
          <ArrowIcon data-testid="ArrowIcon__514220" />
        </a>
      </div>
    </div>
  );
}
