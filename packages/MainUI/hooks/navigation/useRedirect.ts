import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

export const useRedirect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { openWindow, buildURL } = useMultiWindowURL();

  const handleAction = useCallback(
    (windowId: string | undefined) => {
      if (!windowId) {
        console.warn("No windowId found");
        return;
      }

      const isInWindowRoute = pathname.includes("window");

      if (isInWindowRoute) {
        openWindow(windowId);
      } else {
        const newWindow = {
          windowId,
          isActive: true,
          title: "",
          selectedRecords: {},
          tabFormStates: {},
        };

        const targetURL = buildURL([newWindow]);

        router.push(targetURL);
      }
    },
    [router, pathname, buildURL, openWindow]
  );

  const handleClickRedirect = useCallback(
    (e: React.MouseEvent, windowId: string | undefined) => {
      e.stopPropagation();
      e.preventDefault();
      handleAction(windowId);
    },
    [handleAction]
  );

  const handleKeyDownRedirect = useCallback(
    (e: React.KeyboardEvent, windowId: string | undefined) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.key === "Enter" || e.key === " ") {
        handleAction(windowId);
      }
    },
    [handleAction]
  );

  return {
    handleClickRedirect,
    handleKeyDownRedirect,
  };
};
