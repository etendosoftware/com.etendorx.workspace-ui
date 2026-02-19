import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { ConfigApi, type GroupedConfigs, type PropertyConfig, type TemplateInfo } from "../services/configApi";
import { GithubAuthButton } from "./GithubAuthButton";
import type { NavigationSection } from "../types/navigation";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface ConfigurationSectionProps {
  onClose?: () => void;
  onSectionChange?: (section: NavigationSection) => void;
}

export function ConfigurationSection({ onClose, onSectionChange }: ConfigurationSectionProps) {
  const [configsByGroup, setConfigsByGroup] = useState<GroupedConfigs["groups"]>({});
  const [editedConfigs, setEditedConfigs] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [propertyIndex, setPropertyIndex] = useState<Record<string, PropertyConfig>>({});
  const [processStatus, setProcessStatus] = useState<Record<string, { loading: boolean; output?: string; error?: string }>>(
    {}
  );
  const [totalProperties, setTotalProperties] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [requiredFilter, setRequiredFilter] = useState<"all" | "required" | "optional">("all");
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null);
  const [templateGaps, setTemplateGaps] = useState<Array<{ key: string; templateDefault: string }>>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const normalizeMessage = (message: unknown, fallback = ""): string => {
    if (!message) return fallback;
    if (typeof message === "string") return message;
    try {
      return JSON.stringify(message);
    } catch (e) {
      return fallback || "Operation completed";
    }
  };

  useEffect(() => {
    loadConfigurations();
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const response = await ConfigApi.listTemplates();
    if (response.success && response.data?.templates) {
      setAvailableTemplates(response.data.templates);
    }
  };

  const handleSelectTemplate = async (name: string) => {
    if (selectedTemplate === name) {
      setSelectedTemplate(null);
      setTemplateInfo(null);
      setTemplateGaps([]);
      return;
    }
    setSelectedTemplate(name);
    setLoadingTemplate(true);
    try {
      const response = await ConfigApi.getTemplate(name);
      if (response.success && response.data?.template) {
        const tmpl = response.data.template;
        setTemplateInfo(tmpl);
        // Compute gaps: template properties that have no current value set
        const gaps = Object.entries(tmpl.properties)
          .filter(([key]) => {
            const currentVal = editedConfigs[key];
            return !currentVal || currentVal.trim() === "";
          })
          .map(([key, templateDefault]) => ({ key, templateDefault }));
        setTemplateGaps(gaps);
        // Pre-fill edited configs with template defaults for empty properties
        if (gaps.length > 0) {
          setEditedConfigs((prev) => {
            const updated = { ...prev };
            gaps.forEach(({ key, templateDefault }) => {
              if (!updated[key] || updated[key].trim() === "") {
                updated[key] = templateDefault;
              }
            });
            return updated;
          });
        }
      }
    } finally {
      setLoadingTemplate(false);
    }
  };

  const flattenConfigs = (groupData: GroupedConfigs["groups"]) => {
    const flatConfigs: Record<string, string> = {};
    Object.values(groupData).forEach((group) => {
      group.properties.forEach((prop) => {
        if (prop.process) return;
        flatConfigs[prop.key] = prop.currentValue ?? "";
      });
    });
    return flatConfigs;
  };

  const loadConfigurations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ConfigApi.getConfigsByGroup();
      if (response.success && response.data?.groups) {
        setConfigsByGroup(response.data.groups);
        setTotalProperties(response.data.total);
        const newPropertyIndex: Record<string, PropertyConfig> = {};
        Object.values(response.data.groups).forEach((group) => {
          group.properties.forEach((prop) => {
            newPropertyIndex[prop.key] = prop;
          });
        });
        setPropertyIndex(newPropertyIndex);
        const flatConfigs = flattenConfigs(response.data.groups);
        setEditedConfigs(flatConfigs);
        setInitialValues(flatConfigs);
      } else {
        setError(response.error || normalizeMessage(response.message, "Failed to load configurations"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setEditedConfigs((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    setValidationErrors({});

    try {
      const changes: Record<string, string> = {};
      Object.entries(editedConfigs).forEach(([key, value]) => {
        if (propertyIndex[key]?.process) return;
        if (initialValues[key] !== value) {
          changes[key] = value;
        }
      });

      if (Object.keys(changes).length === 0) {
        setSuccess("No changes to save");
        return;
      }

      const response = await ConfigApi.saveConfigs(changes);

      if (response.success) {
        setSuccess(
          normalizeMessage(response.message, `Updated ${Object.keys(changes).length} properties successfully`)
        );
        await loadConfigurations();
      } else {
        if (response.validationErrors) {
          setValidationErrors(response.validationErrors);
          setError("Please fix the validation errors before saving");
        } else {
          setError(response.error || normalizeMessage(response.message, "Error saving configurations"));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving configurations");
    } finally {
      setSaving(false);
    }
  };

  const getChangedCount = () => {
    return Object.entries(editedConfigs).reduce(
      (count, [key, value]) => (initialValues[key] !== value && !propertyIndex[key]?.process ? count + 1 : count),
      0
    );
  };

  const togglePasswordVisibility = (key: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExecuteProcess = async (property: PropertyConfig) => {
    const command = property.key;
    setProcessStatus((prev) => ({
      ...prev,
      [property.key]: { loading: true, output: undefined, error: undefined },
    }));
    try {
      const response = await ConfigApi.executeCommand(command, {});
      const output =
        (response as unknown as { output?: string }).output || (response as { data?: { output?: string } }).data?.output || "";
      if (response.success) {
        setProcessStatus((prev) => ({
          ...prev,
          [property.key]: { loading: false, output: output || "Command executed successfully" },
        }));
      } else {
        setProcessStatus((prev) => ({
          ...prev,
          [property.key]: {
            loading: false,
            error: response.error || response.message || "Error executing command",
            output,
          },
        }));
      }
    } catch (err) {
      setProcessStatus((prev) => ({
        ...prev,
        [property.key]: { loading: false, error: err instanceof Error ? err.message : "Error executing command" },
      }));
    }
  };

  const renderDefaultInput = (property: PropertyConfig) => {
    const value = editedConfigs[property.key] ?? "";
    const normalizedType = property.type?.toLowerCase();
    const inputType =
      property.sensitive && !visiblePasswords[property.key]
        ? "password"
        : normalizedType === "integer" || normalizedType === "int" || normalizedType === "port"
          ? "number"
          : "text";

    return (
      <TextField
        value={value}
        onChange={(e) => handleConfigChange(property.key, e.target.value)}
        type={inputType}
        fullWidth
        error={!!validationErrors[property.key]}
        helperText={validationErrors[property.key]}
        size="small"
        variant="outlined"
        placeholder={property.defaultValue ? `Default value: ${property.defaultValue}` : undefined}
        InputProps={
          property.sensitive
            ? {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => togglePasswordVisibility(property.key)} edge="end">
                      {visiblePasswords[property.key] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            : undefined
        }
      />
    );
  };

  const renderInput = (property: PropertyConfig) => {
    if (property.process) {
      const command = property.key;
      const status = processStatus[property.key] || { loading: false };
      return (
        <Stack spacing={1}>
          <Button
            variant="outlined"
            startIcon={status.loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={() => handleExecuteProcess(property)}
            disabled={status.loading}>
            {status.loading ? "Running..." : "Run"} {command}
          </Button>
          {(status.output || status.error) && (
            <TextField
              value={status.error ? `Error: ${status.error}\n${status.output ?? ""}` : status.output || ""}
              multiline
              fullWidth
              minRows={3}
              InputProps={{ readOnly: true }}
            />
          )}
        </Stack>
      );
    }

    const value = editedConfigs[property.key] ?? "";

    if (property.options && property.options.length > 0) {
      return (
        <TextField
          select
          fullWidth
          value={value}
          onChange={(e) => handleConfigChange(property.key, e.target.value)}
          size="small"
          variant="outlined">
          {property.options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (property.type?.toLowerCase() === "boolean") {
      return (
        <FormControlLabel
          control={
            <Switch
              color="primary"
              checked={(value || "").toLowerCase() === "true"}
              onChange={(e) => handleConfigChange(property.key, e.target.checked.toString())}
            />
          }
          label={(value || "").toLowerCase() === "true" ? "Enabled" : "Disabled"}
        />
      );
    }

    if (property.key === "githubToken") {
      return (
        <Stack spacing={1}>
          {renderDefaultInput(property)}
          <GithubAuthButton onSuccess={(token) => handleConfigChange("githubToken", token)} />
        </Stack>
      );
    }

    return renderDefaultInput(property);
  };

  if (loading) {
    return (
      <Box className="section-content">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  const changedCount = getChangedCount();

  return (
    <Box className="section-content">
      <Stack spacing={3}>

        {/* Template Selector */}
        {availableTemplates.length > 0 && (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Quick Setup — Select a template
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Templates pre-fill your configuration with sensible defaults. Only missing values will be shown for review.
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {availableTemplates.map((tmpl) => (
                <Card
                  key={tmpl}
                  variant="outlined"
                  sx={{
                    minWidth: 130,
                    border: selectedTemplate === tmpl ? "2px solid" : "1px solid",
                    borderColor: selectedTemplate === tmpl ? "primary.main" : "divider",
                    backgroundColor: selectedTemplate === tmpl ? "primary.50" : "background.paper",
                  }}>
                  <CardActionArea onClick={() => handleSelectTemplate(tmpl)} disabled={loadingTemplate}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Typography variant="body2" fontWeight={selectedTemplate === tmpl ? 700 : 400} textTransform="capitalize">
                        {tmpl}
                      </Typography>
                      {selectedTemplate === tmpl && (
                        <Chip size="small" label="Selected" color="primary" sx={{ mt: 0.5 }} />
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {/* Template Gaps — properties without a value */}
        {selectedTemplate && templateInfo && (
          <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "primary.light", backgroundColor: "primary.50" }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {templateGaps.length === 0
                  ? `✓ Template "${selectedTemplate}" — all properties already configured`
                  : `Complete setup for "${selectedTemplate}" (${templateGaps.length} missing)`}
              </Typography>
              {loadingTemplate && <CircularProgress size={16} />}
            </Stack>
            {templateGaps.length > 0 && (
              <Stack spacing={1.5}>
                {templateGaps.map(({ key, templateDefault }) => {
                  const prop = propertyIndex[key];
                  return (
                    <Stack key={key} direction="row" spacing={2} alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={500}>
                          {key} <Typography component="span" color="error">*</Typography>
                        </Typography>
                        {prop?.description && (
                          <Typography variant="caption" color="text.secondary">{prop.description}</Typography>
                        )}
                        {templateDefault && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Template default: {templateDefault}
                          </Typography>
                        )}
                      </Box>
                      <Box flex={1}>
                        {prop ? renderInput(prop) : (
                          <TextField
                            size="small"
                            fullWidth
                            value={editedConfigs[key] ?? ""}
                            onChange={(e) => handleConfigChange(key, e.target.value)}
                            placeholder={templateDefault}
                          />
                        )}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            )}
            {templateInfo.dependencies.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Dependencies: {templateInfo.dependencies.join(", ")}
                </Typography>
              </Box>
            )}
            {templateInfo.modules.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Modules: {templateInfo.modules.join(", ")}
                </Typography>
              </Box>
            )}
            {onSectionChange && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => onSectionChange("start-all")}
                  sx={{ fontWeight: 600 }}>
                  Next: Start All
                </Button>
              </Box>
            )}
          </Paper>
        )}

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            gradle.properties Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the Etendo project configuration. Values and metadata are read from each module's config.gradle files
            and saved into gradle.properties.
          </Typography>
          {totalProperties > 0 && (
            <Typography variant="body2" color="text.secondary">
              Detected properties: {totalProperties}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Properties marked as a <strong>Gradle Process</strong> execute a backend command instead of being saved.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading || saving || changedCount === 0}>
            Save {changedCount > 0 && `(${changedCount})`}
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadConfigurations} disabled={loading || saving}>
            Refresh
          </Button>
          {changedCount > 0 && (
            <Alert severity="info" sx={{ flex: 1 }}>
              {changedCount} modified property(ies). Click Save to apply the changes.
            </Alert>
          )}
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Advanced Configuration — collapsed by default */}
        <Accordion defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight={600}>
              Advanced Configuration ({totalProperties} properties)
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Stack spacing={3} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">View:</Typography>
                <ToggleButtonGroup
                  exclusive
                  value={requiredFilter}
                  onChange={(_, value) => value && setRequiredFilter(value)}
                  size="small"
                  color="primary">
                  <ToggleButton value="all">All</ToggleButton>
                  <ToggleButton value="required">Required</ToggleButton>
                  <ToggleButton value="optional">Optional</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {Object.entries(configsByGroup).map(([groupKey, groupData]) => (
                <Box key={groupKey}>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 1 }}>
                    {groupKey} ({groupData.count} properties)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configurations provided by config.gradle. If you edit a sensitive value, you can toggle its visibility from
                    the field.
                  </Typography>

                  {groupData.properties.some((p) => p.process) && (
                    <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e4e7ec", backgroundColor: "#f9fafb" }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                        Group processes
                      </Typography>
                      <Stack spacing={1}>
                        {groupData.properties
                          .filter((property) => property.process)
                          .map((property) => (
                            <Stack key={property.key} direction="row" spacing={2} alignItems="flex-start">
                              <Stack spacing={0.5} flex={1}>
                                <Typography variant="body2" fontWeight={500}>
                                  {property.key}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {property.description}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  <Chip size="small" label="Gradle Process" color="success" />
                                  {property.source && <Chip size="small" label={`Module: ${property.source}`} />}
                                </Stack>
                              </Stack>
                              <Box flex={1}>{renderInput(property)}</Box>
                            </Stack>
                          ))}
                      </Stack>
                    </Paper>
                  )}

                  <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e4e7ec" }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                          <TableCell sx={{ fontWeight: 600, width: "45%" }}>Property</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupData.properties
                          .filter((property) => !property.process)
                          .filter((property) => {
                            if (requiredFilter === "all") return true;
                            if (requiredFilter === "required") return property.required === true;
                            return property.required !== true;
                          })
                          .map((property) => (
                          <TableRow key={property.key} hover>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Typography variant="body2" fontWeight={500}>
                                  {property.key} {property.required && <Typography component="span" color="error">*</Typography>}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {property.description}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  {property.type && <Chip size="small" label={`Type: ${property.type}`} />}
                                  {property.source && <Chip size="small" label={`Module: ${property.source}`} />}
                                  {property.sensitive && <Chip size="small" color="warning" label="Sensitive" />}
                                  {property.required && <Chip size="small" color="error" label="Required" />}
                                  {property.process && <Chip size="small" color="success" label="Gradle Process" />}
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  Default value: {property.defaultValue || "N/A"}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              {renderInput(property)}
                              {validationErrors[property.key] && (
                                <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                                  {validationErrors[property.key]}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))}

              {Object.keys(configsByGroup).length === 0 && !loading && (
                <Paper elevation={0} sx={{ p: 3, textAlign: "center", border: "1px solid #e4e7ec" }}>
                  <Typography color="text.secondary">
                    No configurations found. Make sure the Gradle server is running on port 3851.
                  </Typography>
                </Paper>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Paper elevation={0} sx={{ p: 2, backgroundColor: "#f8fafc", border: "1px solid #e4e7ec" }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> Configuration changes are applied immediately to gradle.properties. Some properties may
            require restarting the server to take effect.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
