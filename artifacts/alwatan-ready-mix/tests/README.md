# Media and certificate regressions

Run from the workspace root:

```sh
pnpm --filter @workspace/alwatan-ready-mix run test:media
pnpm --filter @workspace/api-server run test:storage
```

The component suite renders the real upload hook, MediaPicker, AdminMedia,
VideoPlayer and AdminCertificates in jsdom. Only language/toasts, API hooks and
XHR transport are isolated. Fresh QueryClients/remounts verify that the library
is refetched rather than relying on previous component state. All three upload
stages and every upload UI have failure assertions; a rejected PUT/finalize must
not publish an attachment or show success.

The storage suite runs HTTP against an ephemeral loopback server and temporary
local storage, with an in-memory media repository (no database). It verifies
signature enforcement, verified MIME, library refetch and disk metadata after a
new storage instance. Playwright renders the real VideoPlayer against that same
server and plays the tiny WebM fixture through an extensionless object URL.

## Browser setup

The storage runner uses an installed `chromium` on PATH (including the wrapped
NixOS browser). Otherwise install Playwright's browser and its OS dependencies
in your test environment:

```sh
pnpm --filter @workspace/api-server exec playwright install chromium
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select another installed Chromium;
`PLAYWRIGHT_BROWSERS_PATH` can select its cache. Missing browsers/dependencies
fail the test, rather than silently skipping playback.

MP4 is checked for a successful HTTP response, MIME and exact bytes before any
decoder conclusion. An unsupported H264 result is explicitly classified only
when the browser does not advertise the codec and emits native unsupported-media
error 4. A network error, timeout, decode failure with advertised support, or
damaged bytes remains a failure. jsdom tests separately cover network/codec UI
messages, retry and download links; they do not claim to decode video.

Both runners pass only allowlisted runtime settings into test processes, never
workspace credentials. No production service, auth session or existing user
data is needed. Cleanup removes only the temporary test storage/build directory.
The existing Replit-cloud check intentionally remains skipped without its
configuration; it is not evidence of cloud compatibility.
