import { useState, useEffect } from 'react';
import { parseDeploymentError, DeploymentError } from '../utils/deploymentErrorParser';

/**
 * Hook to read deployment/build failure context from client-side sources
 */
export function useDeploymentDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DeploymentError | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Check for debug flag in localStorage
    const debugFlag = localStorage.getItem('deployment-debug');
    
    // Check for error in query params
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('deployment-error');
    
    // Check for error in localStorage
    const storedError = localStorage.getItem('deployment-error');
    
    // Enable diagnostics if debug flag is set or error is present
    if (debugFlag === 'true' || errorParam || storedError) {
      setIsEnabled(true);
    }

    // Parse error if available
    const errorString = errorParam || storedError || '';
    if (errorString) {
      const parsed = parseDeploymentError(decodeURIComponent(errorString));
      setDiagnostics(parsed);
    }
  }, []);

  const clearDiagnostics = () => {
    localStorage.removeItem('deployment-error');
    const params = new URLSearchParams(window.location.search);
    params.delete('deployment-error');
    window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
    setDiagnostics(null);
  };

  const enableDebugMode = () => {
    localStorage.setItem('deployment-debug', 'true');
    setIsEnabled(true);
  };

  const disableDebugMode = () => {
    localStorage.removeItem('deployment-debug');
    setIsEnabled(false);
  };

  const setError = (errorString: string) => {
    localStorage.setItem('deployment-error', errorString);
    const parsed = parseDeploymentError(errorString);
    setDiagnostics(parsed);
  };

  return {
    diagnostics,
    isEnabled,
    clearDiagnostics,
    enableDebugMode,
    disableDebugMode,
    setError,
  };
}
