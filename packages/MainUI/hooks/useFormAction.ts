import { buildFormPayload, buildQueryString } from "@/utils";
import { shouldRemoveIdFields } from "@/utils/form/entityConfig";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { EntityData, FormMode, Tab, WindowMetadata } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UseFormHandleSubmit } from "react-hook-form";
import { useUserContext } from "./useUserContext";

export interface UseFormActionParams {
  windowMetadata?: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  onSuccess: (data: EntityData) => void;
  onError: (data: string) => void;
  initialState?: EntityData;
  submit: UseFormHandleSubmit<EntityData>;
}

export const useFormAction = ({
  windowMetadata,
  tab,
  mode,
  onSuccess,
  onError,
  initialState,
  submit,
}: UseFormActionParams) => {
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController>(new AbortController());
  const { user } = useUserContext();
  const userId = user?.id;

  const execute = useCallback(
    async (values: EntityData) => {
      try {
        setLoading(true);

        const queryStringParams = buildQueryString({ mode, windowMetadata, tab });

        const shouldRemoveId = shouldRemoveIdFields(tab.entityName, mode);

        let processedValues = { ...values };
        let processedInitialState = { ...initialState };

        if (shouldRemoveId) {
          const { id, id$_identifier: idIdentifier, ...valuesWithoutId } = processedValues;
          processedValues = valuesWithoutId as EntityData;

          if (processedInitialState) {
            const { id: initialId, id$_identifier: initialIdIdentifier, ...initialWithoutId } = processedInitialState;
            processedInitialState = initialWithoutId as EntityData;
          }
        }

        const body = buildFormPayload({
          values: processedValues,
          oldValues: processedInitialState,
          mode,
          csrfToken: userId,
        });

        const url = `${tab.entityName}?${queryStringParams}`;
        const options = { signal: controller.current.signal, method: "POST", body };
        const { ok, data } = await Metadata.datasourceServletClient.request(url, options);

        if (ok && data?.response?.status === 0 && !controller.current.signal.aborted) {
          setLoading(false);
          onSuccess?.(data.response.data[0]);
        } else {
          throw new Error(data.response.error?.message);
        }
      } catch (err) {
        setLoading(false);
        onError?.(String(err));
      }
    },
    [initialState, mode, onError, onSuccess, tab, userId, windowMetadata]
  );

  const save = useMemo(() => submit(execute), [execute, submit]);

  useEffect(() => {
    const _controller = controller.current;

    return () => {
      _controller.abort();
      controller.current = new AbortController();
    };
  }, []);

  return { save, loading };
};
