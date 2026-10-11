---
name: Temporary ESM test bundles
description: Package resolution when isolated test output lives outside the workspace
---

Node resolves external ESM package imports relative to the generated module's location,
not the shell's working directory. A temporary bundle outside a package does not inherit
that package's dependency search path.

**Why:** An isolated test bundle failed to load installed workspace dependencies even
though the command ran from the owning package. This can look like a missing installation
and lead to unnecessary dependency changes.

**How to apply:** When running generated ESM tests from temporary directories, ensure
external imports resolve from the owning package at build time. Keep workspace database
imports substituted before module evaluation; moving the output or fixing resolution
must not accidentally reintroduce live database access.
