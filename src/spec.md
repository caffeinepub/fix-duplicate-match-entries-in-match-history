# Specification

## Summary
**Goal:** Re-run the previously failed build and deployment, and provide clear, actionable failure details if it fails again.

**Planned changes:**
- Retry the full build + deploy process.
- Improve failure reporting to clearly indicate whether the failure occurred during build or canister deploy and include the exact underlying error message.
- Ensure any user-facing error text (if shown) is in English.

**User-visible outcome:** A new build/deploy attempt is executed, and if it fails, the developer/operator can see clear output identifying the failed step (build vs deploy) along with the exact error message.
