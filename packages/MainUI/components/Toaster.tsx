import React from "react";
import { Toaster as SonnerToaster } from "sonner";

export const Toaster = () => {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          color: "#111827", // text-gray-900 for high contrast
          fontSize: "1rem", // larger font
          width: "min(100vw, 420px)", // larger width
        },
        classNames: {
          closeButton: "!absolute !right-0 !left-auto !top-3 !bg-gray-500 !text-white",
          toast: "!border !border-gray-500/30 relative", // darker border
          title: "!text-[1.10rem] !font-bold", // larger title
          description: "!text-[0.95rem] !font-medium", // larger description
          success: "!border-green-600 !bg-[#e8fbe8]",
          error: "!border-red-600 !bg-[#feeced]",
          warning: "!border-amber-500 !bg-[#fff8e1]",
          info: "!border-blue-500 !bg-[#e8f4fe]",
        },
      }}
    />
  );
};
