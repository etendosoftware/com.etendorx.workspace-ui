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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import CheckCircleIcon from "@workspaceui/componentlibrary/src/assets/icons/check-circle.svg";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import Select from "@workspaceui/componentlibrary/src/components/Input/Select";
import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";
import {
  fetchInstancePurpose,
  saveInstancePurpose,
  type InstancePurposeValue,
} from "@workspaceui/api-client/src/api/instancePurpose";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/userStore";
import { logger } from "@/utils/logger";

const PURPOSE_LABEL_KEYS = {
  P: "instancePurpose.production",
  D: "instancePurpose.development",
  T: "instancePurpose.testing",
  E: "instancePurpose.evaluation",
} as const;

const MODAL_WIDTH = 480;

/**
 * Instance Purpose Configuration, the counterpart of Classic's first-login pop-up. When the backend says
 * the current session has to configure the purpose of the instance (a system-level role on an instance
 * without one), it asks for it in a modal and stores the choice, so it is not asked again. Closing the
 * modal without choosing only hides it for the current session.
 */
const InstancePurposeModal: React.FC = () => {
  const { t } = useTranslation();
  const token = useUserStore((s) => s.token);
  const roleId = useUserStore((s) => s.currentRole?.id);
  const passwordExpired = useUserStore((s) => s.passwordExpired);
  const [open, setOpen] = useState(false);
  const [purposes, setPurposes] = useState<InstancePurposeValue[]>([]);
  const [selected, setSelected] = useState<Option | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-checked whenever the session becomes usable or switches role; undefined while it is not.
  const checkKey = token && roleId && !passwordExpired ? roleId : undefined;

  useEffect(() => {
    if (!checkKey) {
      return;
    }
    let cancelled = false;
    fetchInstancePurpose()
      .then((state) => {
        if (cancelled) return;
        setPurposes(state.options);
        setSelected(null);
        setError(null);
        setOpen(state.required);
      })
      .catch((e) => logger.warn("[InstancePurpose] Could not check the instance purpose:", e));
    return () => {
      cancelled = true;
    };
  }, [checkKey]);

  const options = useMemo<Option[]>(
    () => purposes.map((value) => ({ id: value, value, title: t(PURPOSE_LABEL_KEYS[value]) })),
    [purposes, t]
  );

  const handleClose = useCallback(() => setOpen(false), []);

  const handleSave = useCallback(async () => {
    const purpose = purposes.find((value) => value === selected?.value);
    if (!purpose) {
      setError(t("instancePurpose.required"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveInstancePurpose(purpose);
      setOpen(false);
    } catch (e) {
      logger.warn("[InstancePurpose] Could not save the instance purpose:", e);
      setError(t("instancePurpose.error"));
    } finally {
      setSaving(false);
    }
  }, [purposes, selected, t]);

  const handleChange = useCallback((_event: React.SyntheticEvent, value: Option | null) => {
    setSelected(value);
    setError(null);
  }, []);

  if (!open) {
    return null;
  }

  return (
    <Modal
      open
      showHeader
      tittleHeader={t("instancePurpose.title")}
      width={MODAL_WIDTH}
      saveButtonLabel={t("instancePurpose.continue")}
      SaveIcon={CheckCircleIcon}
      onSave={saving ? undefined : handleSave}
      onClose={handleClose}
      onCancel={handleClose}
      data-testid="instance-purpose-dialog">
      <Box className="flex flex-col gap-4" data-testid="instance-purpose-content">
        <Typography variant="body2" data-testid="Typography__71e02f">
          {t("instancePurpose.welcome")}
        </Typography>
        <Select
          id="instance-purpose-select"
          title={t("instancePurpose.label")}
          options={options}
          value={selected}
          onChange={handleChange}
          disableClearable
          isOptionEqualToValue={(a, b) => a.value === b.value}
          helperText={error ? { label: error } : undefined}
          data-testid="instance-purpose-select"
        />
      </Box>
    </Modal>
  );
};

export default InstancePurposeModal;
