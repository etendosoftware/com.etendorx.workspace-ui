/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

/**
 * @fileoverview Shared React components for custom process modals.
 * Used by PackingProcess and PickValidateProcess.
 */

import type React from "react";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import CheckIcon from "@workspaceui/componentlibrary/src/assets/icons/check-circle.svg";
import AlertIcon from "@workspaceui/componentlibrary/src/assets/icons/alert-circle.svg";
import Loading from "../../../loading";
import type { ConfirmDialogState, ResultMessage } from "./processModalUtils";

// ---------------------------------------------------------------------------
// LoadingOverlay
// ---------------------------------------------------------------------------

interface LoadingOverlayProps {
  testId?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ testId }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white rounded-lg p-8 shadow-lg">
      <Loading data-testid={testId} />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// ErrorAlert
// ---------------------------------------------------------------------------

interface ErrorAlertProps {
  message: string;
  title: string;
  onDismiss: () => void;
  testId?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, title, onDismiss, testId }) => (
  <div className="p-3 rounded border-l-4 bg-gray-50 border-red-500 flex justify-between items-start">
    <div>
      <h4 className="font-bold text-sm text-red-600">{title}</h4>
      <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{message}</p>
    </div>
    <button type="button" onClick={onDismiss} className="text-gray-400 hover:text-gray-600 font-bold ml-2">
      <CloseIcon className="w-4 h-4" data-testid={testId} />
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// ConfirmDialog
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  state: ConfirmDialogState;
  title: string;
  closeLabel: string;
  onClose: () => void;
  testIdPrefix?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ state, title, closeLabel, onClose, testIdPrefix }) => {
  if (!state.open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors">
          <CloseIcon className="w-5 h-5 text-gray-500" data-testid={`CloseIcon__${testIdPrefix}`} />
        </button>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center">
            <AlertIcon className="w-10 h-10 stroke-red-500" data-testid={`AlertIcon__${testIdPrefix}`} />
          </div>
          <div>
            <h4 className="font-medium text-xl text-center text-red-600">{title}</h4>
            <p className="mt-2 text-sm text-center text-gray-600">{state.message}</p>
          </div>
          <div className="flex w-full mt-2">
            <Button
              variant="filled"
              size="large"
              onClick={state.onConfirm}
              className="flex-1"
              data-testid={`Button__${testIdPrefix}`}>
              {closeLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ResultMessageModal
// ---------------------------------------------------------------------------

interface ResultMessageModalProps {
  result: ResultMessage;
  closeLabel: string;
  onClose: () => void;
  /** Optional navigation link rendered below the message text */
  navigationLink?: React.ReactNode;
  testIdPrefix?: string;
}

export const ResultMessageModal: React.FC<ResultMessageModalProps> = ({
  result,
  closeLabel,
  onClose,
  navigationLink,
  testIdPrefix,
}) => {
  const isWarning = result.type === "warning";
  const isError = result.type === "error";

  let bgGradient = "linear-gradient(180deg, #BFFFBF 0%, #FCFCFD 45%)";
  if (isWarning) bgGradient = "linear-gradient(180deg, #FFF3CD 0%, #FCFCFD 45%)";
  else if (isError) bgGradient = "#fff";

  let titleColor = "text-(--color-success-main)";
  if (isWarning) titleColor = "text-amber-600";
  else if (isError) titleColor = "text-red-600";

  let icon = <CheckIcon className="w-6 h-6 fill-(--color-success-main)" data-testid={`CheckIcon__${testIdPrefix}`} />;
  if (isWarning)
    icon = <AlertIcon className="w-10 h-10 stroke-amber-600" data-testid={`AlertIcon__${testIdPrefix}_warn`} />;
  else if (isError)
    icon = <AlertIcon className="w-10 h-10 stroke-red-600" data-testid={`AlertIcon__${testIdPrefix}_err`} />;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4">
      <div
        className="rounded-2xl p-6 shadow-xl relative max-w-sm w-full"
        style={{ background: isError ? "#fff" : bgGradient }}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/50 transition-colors">
          <CloseIcon className="w-5 h-5" data-testid={`CloseIcon__${testIdPrefix}_result`} />
        </button>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center">{icon}</div>
          <div className="w-full">
            <h4 className={`font-medium text-xl text-center ${titleColor}`}>{result.title}</h4>
            <p className="text-sm text-center text-(--color-transparent-neutral-80) whitespace-pre-line mt-2">
              {result.text}
            </p>
            {navigationLink}
          </div>
          <Button
            variant="filled"
            size="large"
            onClick={onClose}
            className="w-full mt-2"
            data-testid={`Button__${testIdPrefix}_result_close`}>
            {closeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// BoxSelector
// ---------------------------------------------------------------------------

interface BoxSelectorProps {
  label: string;
  currentBox: number;
  boxCount: number;
  onPrev: () => void;
  onNext: () => void;
}

export const BoxSelector: React.FC<BoxSelectorProps> = ({ label, currentBox, boxCount, onPrev, onNext }) => (
  <div className="col-span-12 sm:col-span-2">
    <span className="flex items-center gap-1 font-medium text-sm leading-5 tracking-normal text-(--color-baseline-80) mb-1 select-none">
      {label}
    </span>
    <div className="flex items-center h-10.5 rounded-t bg-(--color-transparent-neutral-5) border-0 border-b-2 border-(--color-transparent-neutral-30)">
      <button
        type="button"
        onClick={onPrev}
        disabled={currentBox <= 1}
        className="flex items-center justify-center w-9 h-full text-(--color-transparent-neutral-60) hover:text-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" aria-label="Previous box">
          <path d="M8 3L4 7l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="flex-1 flex items-center justify-center font-medium text-sm text-(--color-transparent-neutral-80) select-none tabular-nums">
        {currentBox}/{boxCount}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={currentBox >= boxCount}
        className="flex items-center justify-center w-9 h-full text-(--color-transparent-neutral-60) hover:text-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" aria-label="Next box">
          <path d="M6 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// AddBoxButton
// ---------------------------------------------------------------------------

interface AddBoxButtonProps {
  onClick: () => void;
  title: string;
}

export const AddBoxButton: React.FC<AddBoxButtonProps> = ({ onClick, title }) => (
  <div className="col-span-12 sm:col-span-1 flex items-end h-10.5 pb-[2px]">
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center w-full h-10 rounded bg-(--color-transparent-neutral-5) border-0 border-b-2 border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-60) hover:text-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) transition-colors select-none"
      title={title}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" aria-label="Add box">
        <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// FormInput — shared styled input (text or number)
// ---------------------------------------------------------------------------

interface FormInputProps {
  id: string;
  label: string;
  type?: "text" | "number";
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  inputRef?: React.RefObject<HTMLInputElement>;
  colSpan?: number;
}

const INPUT_CLASS =
  "w-full px-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) transition-colors";

const LABEL_CLASS =
  "flex items-center gap-1 font-medium text-sm leading-5 tracking-normal text-(--color-baseline-80) mb-1 select-none";

export const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  onKeyDown,
  placeholder,
  min,
  max,
  inputRef,
  colSpan = 2,
}) => (
  <div className={`col-span-12 sm:col-span-${colSpan}`}>
    <label htmlFor={id} className={LABEL_CLASS}>
      {label}
    </label>
    <input
      id={id}
      ref={inputRef}
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      min={min}
      max={max}
      className={INPUT_CLASS}
    />
  </div>
);

// ---------------------------------------------------------------------------
// ValidateButton
// ---------------------------------------------------------------------------

interface ValidateButtonProps {
  onClick: () => void;
  disabled: boolean;
  label: string;
  testId?: string;
}

export const ValidateButton: React.FC<ValidateButtonProps> = ({ onClick, disabled, label, testId }) => (
  <div className="col-span-12 sm:col-span-2 flex items-end h-10.5 pb-[2px]">
    <Button
      variant="filled"
      size="large"
      onClick={onClick}
      disabled={disabled}
      className="whitespace-nowrap w-full px-4 !h-10"
      data-testid={testId}>
      {label}
    </Button>
  </div>
);
