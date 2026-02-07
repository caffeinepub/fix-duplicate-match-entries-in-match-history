/**
 * Parses deployment/build failure messages and classifies them
 */

export type FailureStep = 'build' | 'deploy' | 'unknown';

export interface DeploymentError {
  step: FailureStep;
  message: string;
  rawError: string;
}

/**
 * Classifies a raw error string into build vs deploy failure
 */
export function parseDeploymentError(errorString: string): DeploymentError {
  if (!errorString || errorString.trim() === '') {
    return {
      step: 'unknown',
      message: 'No error information available',
      rawError: '',
    };
  }

  const lowerError = errorString.toLowerCase();

  // Build-related keywords
  const buildKeywords = [
    'build failed',
    'compilation error',
    'syntax error',
    'type error',
    'typescript error',
    'webpack',
    'vite',
    'esbuild',
    'npm run build',
    'yarn build',
    'pnpm build',
    'module not found',
    'cannot find module',
    'failed to compile',
  ];

  // Deploy-related keywords
  const deployKeywords = [
    'deploy failed',
    'deployment error',
    'canister',
    'dfx deploy',
    'replica',
    'internet computer',
    'wasm',
    'upgrade failed',
    'install failed',
    'network error',
    'connection refused',
  ];

  let step: FailureStep = 'unknown';
  
  // Check for build errors
  if (buildKeywords.some(keyword => lowerError.includes(keyword))) {
    step = 'build';
  }
  
  // Check for deploy errors (takes precedence if both are present)
  if (deployKeywords.some(keyword => lowerError.includes(keyword))) {
    step = 'deploy';
  }

  // Extract a clean message
  let message = errorString.trim();
  
  // Try to extract the most relevant error line
  const lines = message.split('\n').filter(line => line.trim() !== '');
  if (lines.length > 0) {
    // Look for lines that contain "error" or "failed"
    const errorLine = lines.find(line => 
      line.toLowerCase().includes('error') || 
      line.toLowerCase().includes('failed')
    );
    if (errorLine) {
      message = errorLine.trim();
    } else {
      message = lines[0].trim();
    }
  }

  return {
    step,
    message,
    rawError: errorString,
  };
}

/**
 * Gets a user-friendly description of the failure step
 */
export function getStepDescription(step: FailureStep): string {
  switch (step) {
    case 'build':
      return 'Build Step';
    case 'deploy':
      return 'Deployment Step';
    default:
      return 'Unknown Step';
  }
}

/**
 * Gets actionable suggestions based on the failure step
 */
export function getSuggestions(step: FailureStep): string[] {
  switch (step) {
    case 'build':
      return [
        'Check for TypeScript compilation errors',
        'Verify all imports and module paths',
        'Review recent code changes',
        'Check package.json dependencies',
        'Clear node_modules and reinstall',
      ];
    case 'deploy':
      return [
        'Verify Internet Computer network connectivity',
        'Check canister configuration',
        'Ensure sufficient cycles',
        'Review dfx.json settings',
        'Check backend canister status',
      ];
    default:
      return [
        'Review the full error message',
        'Check build and deployment logs',
        'Verify system configuration',
      ];
  }
}
