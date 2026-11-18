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

import { useRef, useState, type KeyboardEvent } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useTranslation } from "@/hooks/useTranslation";
import { isSubmitShortcut, NOTE_MAX_LENGTH } from "./noteUtils";
import { useNoteStyles } from "./noteStyles";

const MIN_ROWS = 2;
const MAX_ROWS = 10;

interface NoteComposerProps {
  /** Saves the note; resolves true when it was created, so the input is cleared. */
  onSubmit: (content: string) => Promise<boolean>;
  placeholder?: string;
  submitLabel?: string;
}

/**
 * Inline input to write a note. Ctrl+Enter (Cmd+Enter on macOS) submits it; the button stays disabled
 * while the note is blank or being saved, and the text is kept when saving fails.
 */
const NoteComposer = ({ onSubmit, placeholder, submitLabel }: NoteComposerProps) => {
  const { t } = useTranslation();
  const sx = useNoteStyles();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = content.trim().length > 0 && !isSaving;

  const submit = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    let created = false;
    try {
      created = await onSubmit(content);
    } finally {
      setIsSaving(false);
    }
    if (created) {
      setContent("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isSubmitShortcut(event)) {
      event.preventDefault();
      submit();
    }
  };

  const counterSx = content.length >= NOTE_MAX_LENGTH ? sx.composerCounterLimit : sx.composerCounter;

  return (
    <Box sx={sx.composer} data-testid="Box__c6547b">
      <TextField
        fullWidth
        multiline
        minRows={MIN_ROWS}
        maxRows={MAX_ROWS}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t("forms.notes.noteInputPlaceholder")}
        inputRef={inputRef}
        inputProps={{ maxLength: NOTE_MAX_LENGTH, "aria-label": t("forms.notes.noteInputLabel") }}
        sx={sx.composerInput}
        data-testid="TextField__a680f8_input"
      />
      <Box sx={sx.composerFooter} data-testid="Box__c6547b">
        <Typography variant="caption" sx={sx.composerHint} data-testid="Typography__c6547b">
          {t("forms.notes.submitShortcutHint")}
        </Typography>
        <Typography variant="caption" sx={counterSx} data-testid="Typography__c6547b">
          {`${content.length}/${NOTE_MAX_LENGTH}`}
        </Typography>
        <Button
          variant="contained"
          size="small"
          disabled={!canSubmit}
          onClick={submit}
          sx={sx.submitButton}
          data-testid="Button__a680f8_submit">
          {submitLabel || t("forms.notes.addNoteSubmit")}
        </Button>
      </Box>
    </Box>
  );
};

export default NoteComposer;
