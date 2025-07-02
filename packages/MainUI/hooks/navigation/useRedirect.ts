import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

export const useRedirect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { openWindow, buildURL, getNextOrder, windows } = useMultiWindowURL();

  const handleAction = useCallback(
    (windowId: string | undefined, windowIdentifier: string | undefined) => {
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
          window_identifier: windowIdentifier || windowId,
          isActive: true,
          order: getNextOrder(windows),
          title: windowIdentifier || windowId,
          selectedRecords: {},
          tabFormStates: {},
        };

        const targetURL = buildURL([newWindow]);

        router.push(targetURL);
      }
    },
    [router, pathname, windows, buildURL, openWindow, getNextOrder]
  );

  const handleClickRedirect = useCallback(
    (e: React.MouseEvent, windowId: string | undefined, windowIdentifier: string | undefined) => {
      e.stopPropagation();
      e.preventDefault();
      handleAction(windowId, windowIdentifier);
    },
    [handleAction]
  );

  const handleKeyDownRedirect = useCallback(
    (e: React.KeyboardEvent, windowId: string | undefined, windowIdentifier: string | undefined) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.key === "Enter" || e.key === " ") {
        handleAction(windowId, windowIdentifier);
      }
    },
    [handleAction]
  );

  return {
    handleClickRedirect,
    handleKeyDownRedirect,
  };
};
