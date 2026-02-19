import { useEffect, useState, useMemo } from "react";
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Skeleton,
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

/** Short description shown on each template card */
const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  copilot: "AI assistant with LLM integration and Etendo-native tools",
};

/** Parse `implementation('com.etendoerp:module.id:[ver)')` → `module.id` */
const parseDependencyLabel = (dep: string): string => {
  const match = dep.match(/['"(]?[^:'"(]+:([^:['"]+)/);
  return match ? match[1] : dep;
};

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
  const [requiredFilter, setRequiredFilter] = useState<"all" | "required" | "optional">("required");
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "next" | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null);
  const [templateGaps, setTemplateGaps] = useState<Array<{ key: string; templateDefault: string }>>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [showTemplateFields, setShowTemplateFields] = useState(false);
  const [showRawConfig, setShowRawConfig] = useState(false);

  // Keys provided by the selected template (for visual indicator in Advanced table)
  const templateKeys = useMemo(
    () => new Set(Object.keys(templateInfo?.properties ?? {})),
    [templateInfo]
  );

  // Required fields that have no default value and are currently empty
  const missingRequired = useMemo(
    () =>
      Object.values(propertyIndex).filter(
        (p) =>
          p.required &&
          !p.process &&
          (!p.defaultValue || p.defaultValue.trim() === "") &&
          (!editedConfigs[p.key] || editedConfigs[p.key].trim() === "")
      ),
    [propertyIndex, editedConfigs]
  );

  // Check for missing required fields before save/next; returns true if ok to proceed
  const checkRequired = (action: "save" | "next"): boolean => {
    if (missingRequired.length === 0) return true;
    setPendingAction(action);
    setShowMissingDialog(true);
    return false;
  };

  const handleMissingDialogCancel = () => {
    setShowMissingDialog(false);
    setPendingAction(null);
    setAdvancedExpanded(true);
    setRequiredFilter("required");
  };

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
    setLoadingTemplates(true);
    try {
      const response = await ConfigApi.listTemplates();
      if (response.success && response.data?.templates) {
        setAvailableTemplates(response.data.templates);
      }
    } finally {
      setLoadingTemplates(false);
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
    setShowTemplateFields(false);
    setShowRawConfig(false);
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

  const saveChanges = async () => {
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

  const handleSave = async () => {
    if (!checkRequired("save")) return;
    await saveChanges();
  };

  const handleDialogProceed = async () => {
    const action = pendingAction;
    setShowMissingDialog(false);
    setPendingAction(null);
    await saveChanges();
    if (action === "next") {
      onSectionChange?.("start-all");
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
        {(loadingTemplates || availableTemplates.length > 0) && (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Quick Setup — Select a template
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Templates pre-fill your configuration with sensible defaults. Only missing values will be shown for review.
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {loadingTemplates
                ? [130, 100, 120, 110].map((w) => (
                    <Skeleton key={w} variant="rounded" width={w} height={52} sx={{ borderRadius: 1 }} />
                  ))
                : availableTemplates.map((tmpl) => (
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
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25, lineHeight: 1.3 }}>
                            {TEMPLATE_DESCRIPTIONS[tmpl] ?? "Pre-configured setup template"}
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
            {/* Advanced toggle — shows all template fields on demand */}
            {templateInfo && Object.keys(templateInfo.properties).length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="text"
                  endIcon={<ExpandMoreIcon sx={{ transform: showTemplateFields ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />}
                  onClick={() => setShowTemplateFields((v) => !v)}
                  sx={{ px: 0, color: "primary.main", fontWeight: 600 }}>
                  {showTemplateFields ? "Hide fields" : "Edit template fields"}
                  {templateGaps.length > 0 && ` (${templateGaps.length} to complete)`}
                </Button>
              </Box>
            )}
            {showTemplateFields && templateInfo && Object.keys(templateInfo.properties).length > 0 && (
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                {Object.entries(templateInfo.properties).map(([key, templateDefault]) => {
                  const prop = propertyIndex[key];
                  const isGap = templateGaps.some((g) => g.key === key);
                  return (
                    <Stack key={key} direction="row" spacing={2} alignItems="flex-start">
                      <Box flex={1}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Typography variant="body2" fontWeight={500}>
                            {key}
                            {prop?.required && <Typography component="span" color="error"> *</Typography>}
                          </Typography>
                          {prop?.type?.toLowerCase() === "boolean" && (
                            <Chip label="Boolean" size="small" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />
                          )}
                          {!isGap && (
                            <Chip label="Set" size="small" color="success" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />
                          )}
                        </Stack>
                        {prop?.description && (
                          <Typography variant="caption" color="text.secondary">{prop.description}</Typography>
                        )}
                        {templateDefault && templateDefault.trim() !== "" && (
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
                            placeholder={templateDefault || undefined}
                          />
                        )}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            )}
            {(templateInfo.dependencies.length > 0 || templateInfo.modules.length > 0) && (
              <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "primary.light" }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  What this template installs
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                  Applying this template will add the following to your project. These changes are written to{" "}
                  <strong>build.gradle</strong> and take effect on the next Gradle sync.
                </Typography>
                {templateInfo.dependencies.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Gradle dependencies
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                      Artifacts that will be downloaded and added to your classpath.
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {templateInfo.dependencies.map((dep) => (
                        <Chip key={dep} label={parseDependencyLabel(dep)} size="small" variant="outlined" title={dep} />
                      ))}
                    </Stack>
                  </Box>
                )}
                {templateInfo.modules.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Etendo modules
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                      Business modules installed into Etendo. Includes database schema, UI windows, and processes.
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {templateInfo.modules.map((mod) => (
                        <Chip key={mod} label={mod} size="small" color="secondary" variant="outlined" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }} />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            )}
            {onSectionChange && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => { if (checkRequired("next")) onSectionChange("start-all"); }}
                  sx={{ fontWeight: 600 }}>
                  Next: Start All
                </Button>
              </Box>
            )}
          </Paper>
        )}

        {/* When templates exist, collapse raw config behind a toggle */}
        {!loadingTemplates && availableTemplates.length > 0 && (
          <Button
            size="small"
            variant="text"
            color="inherit"
            endIcon={<ExpandMoreIcon sx={{ transform: showRawConfig ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />}
            onClick={() => setShowRawConfig((v) => !v)}
            sx={{ px: 0, color: "text.secondary", fontWeight: 500 }}>
            {showRawConfig ? "Hide" : "Show"} gradle.properties configuration
          </Button>
        )}

        {(loadingTemplates || availableTemplates.length === 0 || showRawConfig) && (<>
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
        <Accordion expanded={advancedExpanded} onChange={(_, expanded) => setAdvancedExpanded(expanded)}>
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
                                  {templateKeys.has(property.key) && <Chip size="small" color="primary" variant="outlined" label="Template" />}
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
        </>)}
      </Stack>

      {/* Missing required fields — inline edit dialog */}
      <Dialog open={showMissingDialog} onClose={handleMissingDialogCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Complete required fields
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These required fields have no default value. Fill them in to{" "}
            {pendingAction === "next" ? "continue" : "save"}.
          </Typography>
          <Stack spacing={2}>
            {missingRequired.map((p) => (
              <Box key={p.key}>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>{p.key}</Typography>
                  <Typography component="span" color="error" variant="body2">*</Typography>
                  {p.type?.toLowerCase() === "boolean" && (
                    <Chip label="Boolean" size="small" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />
                  )}
                </Stack>
                {p.description && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    {p.description}
                  </Typography>
                )}
                {renderInput(p)}
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={handleMissingDialogCancel}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={missingRequired.length > 0 || saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            onClick={handleDialogProceed}>
            {pendingAction === "next" ? "Save & Continue" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
