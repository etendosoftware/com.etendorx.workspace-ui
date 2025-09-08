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

import { memo } from "react";
import { useForm, FormProvider, type FieldValues } from "react-hook-form";
import { Box, Paper, Button, Grid, Typography } from "@mui/material";
import DynamicField from "./DynamicField";
import type { ReportMetadata, ReportField } from "@workspaceui/api-client/src/hooks/types";

interface DynamicReportProps<T> {
  metadata: ReportMetadata;
  onSubmit: (format: string, data: T) => Promise<void>;
}

function DynamicReport<T extends FieldValues>({ metadata, onSubmit }: DynamicReportProps<T>) {
  const methods = useForm<T>();

  const handleSubmit = async (format: string) => {
    const isValid = await methods.trigger();
    if (isValid) {
      const data = methods.getValues();
      await onSubmit(format, data);
    }
  };

  return (
    <FormProvider {...methods} data-testid="FormProvider__390fd1">
      <Paper sx={{ p: 2 }} data-testid="Paper__390fd1">
        {metadata.sections.map((section) => (
          <Box key={section.id} sx={{ mb: 4 }} data-testid="Box__390fd1">
            <Typography variant="h6" sx={{ mb: 2 }} data-testid="Typography__390fd1">
              {section.title}
            </Typography>
            <Grid container spacing={2} data-testid="Grid__390fd1">
              {section.fields.map((field: ReportField) => (
                <Grid item xs={8} md={4} key={field.id} data-testid="Grid__390fd1">
                  <DynamicField field={field} data-testid="DynamicField__390fd1" />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }} data-testid="Box__390fd1">
          {metadata.actions.map((action) => (
            <Button
              key={action.id}
              variant="contained"
              onClick={() => handleSubmit(action.format)}
              data-testid="Button__390fd1">
              {action.name}
            </Button>
          ))}
        </Box>
      </Paper>
    </FormProvider>
  );
}

export default memo(DynamicReport);
