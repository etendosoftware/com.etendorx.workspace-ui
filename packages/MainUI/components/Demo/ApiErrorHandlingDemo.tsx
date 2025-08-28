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

/**
 * DEMO: API Error Handling Implementation
 * 
 * This file demonstrates how to use the new API error handling system.
 * It shows the integration between AuthInterceptor, useApiRequest hook,
 * and the ErrorBoundary component.
 */

import React, { useState } from "react";
import { Button, Box, Typography, Alert } from "@mui/material";
import { useApiRequest } from "../hooks/useApiRequest";
import { AuthInterceptor } from "@workspaceui/api-client/src/interceptors/authInterceptor";

// Example component demonstrating the useApiRequest hook
export const ApiRequestDemo: React.FC = () => {
  const { data, loading, error, execute, cancel } = useApiRequest<{ message: string }>();
  const [authErrorCount, setAuthErrorCount] = useState(0);

  // Simulate different types of API responses
  const simulateSuccessRequest = () => {
    execute("/api/success").catch(() => {
      // Error handled by hook
    });
  };

  const simulateNotFoundRequest = () => {
    execute("/api/not-found").catch(() => {
      // Error handled by hook
    });
  };

  const simulateAuthErrorRequest = () => {
    execute("/api/auth-error").catch(() => {
      // Error handled by hook
    });
  };

  const simulateLongRequest = () => {
    execute("/api/long-request").catch(() => {
      // Error handled by hook
    });
    
    // Auto-cancel after 2 seconds
    setTimeout(() => {
      cancel();
    }, 2000);
  };

  // Register a logout callback to track auth errors
  React.useEffect(() => {
    const logoutCallback = () => {
      setAuthErrorCount((prev) => prev + 1);
      console.log("Logout triggered by AuthInterceptor");
    };

    AuthInterceptor.registerLogoutCallback(logoutCallback);

    return () => {
      AuthInterceptor.unregisterLogoutCallback(logoutCallback);
    };
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        API Error Handling Demo
      </Typography>
      
      <Typography variant="body1" paragraph>
        This demonstrates the new API error handling system with automatic logout,
        request cancellation, and graceful error handling.
      </Typography>

      <Box mb={2}>
        <Button variant="contained" onClick={simulateSuccessRequest} sx={{ mr: 1 }}>
          Success Request
        </Button>
        <Button variant="contained" onClick={simulateNotFoundRequest} sx={{ mr: 1 }}>
          Not Found Request
        </Button>
        <Button variant="contained" onClick={simulateAuthErrorRequest} sx={{ mr: 1 }}>
          Auth Error Request
        </Button>
        <Button variant="contained" onClick={simulateLongRequest} sx={{ mr: 1 }}>
          Long Request (Auto-Cancel)
        </Button>
        <Button variant="outlined" onClick={cancel}>
          Cancel Current
        </Button>
      </Box>

      {loading && <Alert severity="info">Loading...</Alert>}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
      )}
      
      {data && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Success: {data.message}
        </Alert>
      )}

      {authErrorCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Auth errors detected: {authErrorCount} (would trigger logout)
        </Alert>
      )}

      <Box mt={3}>
        <Typography variant="h6">Key Features:</Typography>
        <ul>
          <li>✅ Automatic logout on 401/403 errors</li>
          <li>✅ Request cancellation with AbortController</li>
          <li>✅ Consistent loading and error states</li>
          <li>✅ Global error boundary for unhandled errors</li>
          <li>✅ Graceful handling of auth vs non-auth errors</li>
          <li>✅ Observer pattern for logout callbacks</li>
        </ul>
      </Box>

      <Box mt={3}>
        <Typography variant="h6">Integration Points:</Typography>
        <ul>
          <li><strong>AuthInterceptor</strong>: Centralized auth error detection</li>
          <li><strong>Enhanced Client</strong>: Request cancellation support</li>
          <li><strong>useApiRequest Hook</strong>: Consistent API interaction</li>
          <li><strong>ErrorBoundary</strong>: Global error catching</li>
          <li><strong>UserContext</strong>: Logout callback registration</li>
        </ul>
      </Box>
    </Box>
  );
};

// Example of how to use the ErrorBoundary
export const ErrorBoundaryDemo: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  const ThrowError: React.FC = () => {
    if (shouldThrow) {
      throw new Error("Simulated component error");
    }
    return <Typography>Component working normally</Typography>;
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Error Boundary Demo
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={() => setShouldThrow(!shouldThrow)}
        sx={{ mb: 2 }}
      >
        {shouldThrow ? "Stop Error" : "Trigger Error"}
      </Button>
      
      <ThrowError />
    </Box>
  );
};

export default ApiRequestDemo;