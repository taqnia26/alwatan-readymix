---
name: Media verification
description: Separate codec support from download failures; keep media tests credential-free and portable to NixOS.
---

Do not classify an MP4 file as broken merely because a test browser lacks H264.
Verify the HTTP response and exact downloaded bytes independently, then compare
native media errors with advertised codec support. WebM must actually advance
playback through an extensionless storage URL.

**Why:** The user explicitly requires distinguishing unsupported browser codecs
from failed downloads; a successful download alone does not establish playback.

**How to apply:** Preserve separate transport and decoder assertions when
extending media tests. Never silently skip required WebM playback.

Use a wrapped system Chromium on NixOS rather than assuming a downloaded Linux
browser can load its shared libraries. Preserve the runtime cache location when
stripping test environment variables.

**Why:** Isolated test processes otherwise look in a different browser cache,
and unwrapped browser downloads can lack required system libraries on NixOS.

**How to apply:** Keep test credentials excluded and pass only runtime settings.
Allow an explicit browser executable override for other environments.

Run component and real-browser media validation sequentially, with bounded
component workers.

**Why:** Concurrent completion validation overloaded the shared workspace:
otherwise-passing component tests timed out and Chromium failed to finish launch.

**How to apply:** Keep one combined sequential media validation command rather
than registering both suites as independent parallel commands.
