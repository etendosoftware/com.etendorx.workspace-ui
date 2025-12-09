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

import type React from "react";
import type { ActionModalProps } from "./types";

const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  title,
  message,
  buttons,
  onClose,
  isLoading = false,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-5000 flex items-center justify-center bg-black/50">
      <div className="relative flex w-[500px] flex-col rounded-xl border-4 border-gray-300 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-[var(--color-baseline-10)] p-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            disabled={isLoading}
            aria-label={t("common.close")}>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <title>{t("common.close")}</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 rounded-b-xl border-t border-gray-200 bg-[var(--color-baseline-10)] p-4">
          {buttons.map((button, index) => {
            const getButtonClass = () => {
              switch (button.variant) {
                case "primary":
                  return "bg-[var(--color-etendo-main)] text-white hover:bg-[var(--color-etendo-dark)]";
                case "danger":
                  return "bg-red-600 text-white hover:bg-red-700";
                default:
                  return "bg-gray-200 text-gray-800 hover:bg-gray-300";
              }
            };

            return (
              <button
                key={index}
                type="button"
                onClick={button.onClick}
                disabled={button.disabled || isLoading}
                className={`rounded px-4 py-2 font-medium focus:outline-none disabled:opacity-50 ${getButtonClass()}`}>
                {button.label}
              </button>
            );
          })}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-etendo-main)] border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionModal;
