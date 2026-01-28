import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Typography,
  Tooltip,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import ImageIcon from "@mui/icons-material/Image";
import { screenshotStorage, Screenshot } from "../services/screenshotStorage";

interface ScreenshotManagerProps {
  open: boolean;
  onClose: () => void;
}

export function ScreenshotManager({ open, onClose }: ScreenshotManagerProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScreenshots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await screenshotStorage.getAll();
      setScreenshots(data);
    } catch (error) {
      console.error("Error loading screenshots:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadScreenshots();
    }
  }, [open, loadScreenshots]);

  const handleDownload = useCallback((screenshot: Screenshot) => {
    const link = document.createElement("a");
    link.href = screenshot.dataUrl;
    link.download = `${screenshot.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await screenshotStorage.delete(id);
        await loadScreenshots();
      } catch (error) {
        console.error("Error deleting screenshot:", error);
      }
    },
    [loadScreenshots]
  );

  const handleDeleteAll = useCallback(async () => {
    if (window.confirm("Are you sure you want to delete all screenshots?")) {
      try {
        await screenshotStorage.clear();
        await loadScreenshots();
      } catch (error) {
        console.error("Error clearing screenshots:", error);
      }
    }
  }, [loadScreenshots]);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <ImageIcon />
            <Typography variant="h6">Screenshot Manager</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">Loading screenshots...</Typography>
          </Box>
        ) : screenshots.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No screenshots saved yet. Capture screenshots from the Development section to see them here.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {screenshots.map((screenshot) => (
              <Grid item xs={12} sm={6} md={4} key={screenshot.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={screenshot.dataUrl}
                    alt={screenshot.name}
                    sx={{ objectFit: "contain", backgroundColor: "#f5f5f5" }}
                  />
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {screenshot.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(screenshot.timestamp)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
                    <Tooltip title="Download">
                      <IconButton color="primary" size="small" onClick={() => handleDownload(screenshot)}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" size="small" onClick={() => handleDelete(screenshot.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button startIcon={<DeleteSweepIcon />} color="error" onClick={handleDeleteAll} disabled={screenshots.length === 0}>
          Delete All
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
