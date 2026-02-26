import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import { DependencyApi, type Dependency } from "../services/dependencyApi";

export function DependenciesSection() {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());
  const [applying, setApplying] = useState(false);
  const [applyOutput, setApplyOutput] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ group: "", artifact: "", version: "", type: "implementation" });
  const [addLoading, setAddLoading] = useState(false);

  const depKey = (d: { group: string; artifact: string }) => `${d.group}:${d.artifact}`;

  const loadDependencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await DependencyApi.listDependencies();
    if (result.success && result.data) {
      setDependencies(result.data);
    } else {
      setError(result.error || "Failed to load dependencies");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  const handleVersionChange = (dep: Dependency, newVersion: string) => {
    const key = depKey(dep);
    if (newVersion === dep.version) {
      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    } else {
      setPendingChanges((prev) => new Map(prev).set(key, newVersion));
    }
  };

  const handleUpdateSingle = async (dep: Dependency) => {
    const key = depKey(dep);
    const newVersion = pendingChanges.get(key);
    if (!newVersion) return;

    setError(null);
    const result = await DependencyApi.updateVersion(dep.group, dep.artifact, newVersion);
    if (result.success) {
      setSuccess(`Updated ${dep.group}:${dep.artifact} to ${newVersion}`);
      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
      await loadDependencies();
    } else {
      setError(result.error || "Update failed");
    }
  };

  const handleRemove = async (dep: Dependency) => {
    setError(null);
    const result = await DependencyApi.removeDependency(dep.group, dep.artifact);
    if (result.success) {
      setSuccess(`Removed ${dep.group}:${dep.artifact}`);
      await loadDependencies();
    } else {
      setError(result.error || "Remove failed");
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setApplyOutput(null);
    setError(null);
    const result = await DependencyApi.applyChanges();
    setApplying(false);

    if (result.success) {
      const tasks = (result as { tasks?: Array<{ task: string; output?: string }> }).tasks || [];
      const output = tasks.map((t) => `[${t.task}]\n${t.output || "OK"}`).join("\n\n");
      setApplyOutput(output);
      setSuccess("Dependency changes applied successfully");
      await loadDependencies();
    } else {
      const errorMsg = result.error || "Apply failed";
      const tasks = (result as { tasks?: Array<{ task: string; output?: string; error?: string }> }).tasks || [];
      const output = tasks.map((t) => `[${t.task}]\n${t.output || t.error || ""}`).join("\n\n");
      setApplyOutput(output || errorMsg);
      setError(errorMsg);
    }
  };

  const handleAdd = async () => {
    if (!addForm.group || !addForm.artifact || !addForm.version) {
      setError("All fields are required");
      return;
    }
    setAddLoading(true);
    setError(null);
    const result = await DependencyApi.addDependency(addForm.group, addForm.artifact, addForm.version, addForm.type);
    setAddLoading(false);

    if (result.success) {
      setSuccess(`Added ${addForm.type} '${addForm.group}:${addForm.artifact}:${addForm.version}'`);
      setShowAddDialog(false);
      setAddForm({ group: "", artifact: "", version: "", type: "implementation" });
      await loadDependencies();
    } else {
      setError(result.error || "Failed to add dependency");
    }
  };

  const hasPendingChanges = pendingChanges.size > 0;

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 1200 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Dependencies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage Etendo module dependencies in build.gradle
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setShowAddDialog(true)}
            size="small"
          >
            Add Dependency
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadDependencies} size="small">
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleApply}
            disabled={applying}
            size="small"
            color="secondary"
          >
            {applying ? "Applying..." : "Apply Changes"}
          </Button>
        </Stack>
      </Box>

      {/* Alerts */}
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
      {hasPendingChanges && (
        <Alert severity="info">
          {pendingChanges.size} pending version change(s) — click the update button per row to save to build.gradle
        </Alert>
      )}

      {/* Loading */}
      {loading && <LinearProgress />}

      {/* Table */}
      {!loading && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Group : Artifact</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Current Version</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Latest</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dependencies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No dependencies found in build.gradle
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {dependencies.map((dep) => {
                const key = depKey(dep);
                const pendingVersion = pendingChanges.get(key);
                const hasChange = pendingVersion !== undefined;

                return (
                  <TableRow key={key} hover>
                    <TableCell>
                      <Chip
                        label={dep.type}
                        size="small"
                        color={dep.type === "moduleDeps" ? "secondary" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize="0.85rem">
                        {dep.group}:{dep.artifact}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {dep.version}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {dep.latestVersion ? (
                        <Chip
                          label={dep.latestVersion}
                          size="small"
                          color={dep.updateAvailable ? "warning" : "success"}
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {dep.availableVersions && dep.availableVersions.length > 0 ? (
                        <Select
                          size="small"
                          value={pendingVersion ?? dep.version}
                          onChange={(e) => handleVersionChange(dep, e.target.value)}
                          sx={{ minWidth: 120, fontFamily: "monospace", fontSize: "0.85rem" }}
                        >
                          {/* Always include current version */}
                          {!dep.availableVersions.includes(dep.version) && (
                            <MenuItem value={dep.version} sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                              {dep.version} (current)
                            </MenuItem>
                          )}
                          {dep.availableVersions.map((v) => (
                            <MenuItem key={v} value={v} sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                              {v}
                              {v === dep.version ? " (current)" : ""}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                          {dep.version}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {hasChange && (
                          <Tooltip title="Update version in build.gradle">
                            <IconButton size="small" color="primary" onClick={() => handleUpdateSingle(dep)}>
                              <UpgradeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Remove dependency">
                          <IconButton size="small" color="error" onClick={() => handleRemove(dep)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Apply Output Dialog */}
      <Dialog open={applyOutput !== null} onClose={() => setApplyOutput(null)} maxWidth="md" fullWidth>
        <DialogTitle>Apply Changes Output</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              p: 2,
              borderRadius: 1,
              overflow: "auto",
              maxHeight: 400,
              fontSize: "0.85rem",
              fontFamily: "monospace",
            }}
          >
            {applyOutput}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyOutput(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dependency Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Dependency</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Group"
              placeholder="com.etendoerp"
              value={addForm.group}
              onChange={(e) => setAddForm({ ...addForm, group: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="Artifact"
              placeholder="copilot.extensions"
              value={addForm.artifact}
              onChange={(e) => setAddForm({ ...addForm, artifact: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="Version"
              placeholder="1.0.0"
              value={addForm.version}
              onChange={(e) => setAddForm({ ...addForm, version: e.target.value })}
              fullWidth
              size="small"
            />
            <Select
              value={addForm.type}
              onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
              size="small"
              fullWidth
            >
              <MenuItem value="implementation">implementation</MenuItem>
              <MenuItem value="moduleDeps">moduleDeps</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={addLoading}>
            {addLoading ? <CircularProgress size={20} /> : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
