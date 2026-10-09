# Portable media storage

No schema migration, SQL, admin-authentication change, or studio change is needed.
The client still requests a URL, PUTs raw bytes to that URL, and calls finalize.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `MEDIA_STORAGE_DRIVER` | `local` | Explicit `local` or opt-in `replit`; other values stop startup. |
| `MEDIA_STORAGE_DIR` | `<API process working directory>/var/media` | Local persistent data directory. Prefer an absolute path such as `/srv/alwatan-data/media` on a VPS. |

Local mode needs **none** of `PRIVATE_OBJECT_DIR`, `DEFAULT_OBJECT_STORAGE_BUCKET_ID`,
`PUBLIC_OBJECT_SEARCH_PATHS`, or a Replit sidecar. These remain required/configured
only for the optional Replit driver/export command. No cloud credentials are created
or requested in local mode.

Run all API processes from the same working directory, or set an absolute
`MEDIA_STORAGE_DIR`. Keep it outside `public`, `dist`, and `build` directories
(including symlink targets); startup/use rejects those directory segments.
The API account needs read/write permissions. The data directory must be a
**persistent volume**, not an ephemeral deployment filesystem.
The default `var/media` directory is ignored by Git. If you choose a different
directory inside the repository, ignore that entire directory too; never commit
uploaded files or private upload state.

**Include the complete directory in server backups**, along with the existing
PostgreSQL backup. Keep backups private: `.upload-signing-key` is a secret.
Never expose this directory through nginx/static file serving. Only the API
serves verified objects. Replicas require the **same shared filesystem** with
atomic rename/hard-link support (or opt into a shared cloud backend).

Layout:

- `uploads/<object-id>`: verified original bytes, no filename-derived extensions.
- `.metadata/<object-id>.json`: verified type, actual byte count, logical object path.
- `public-files/public-<hash>` and matching metadata: migrated legacy public objects.
- `.upload-signing-key`: automatically generated 32-byte HMAC key, mode `0600`.
- `.tickets`, `.claimed`, `.tmp`: private upload state/temporary files; stale state
  older than 30 minutes is swept when another URL is requested.

## Token and upload security

`POST /api/storage/uploads/request-url` remains admin + same-origin protected.
In local mode it returns a **relative API URL** carrying an HMAC-SHA256 signed
token with a random nonce, exact object path, MIME type, exact declared byte
count/hard cap, and expiry (15 minutes). No cookie is needed for the PUT.
The pending ticket is atomically moved before consuming the body: only one
process can use it. Failed attempts also consume it; request a fresh URL to retry.
The signing key persists across restarts without a new environment secret.

`PUT /api/storage/uploads/direct?token=...` streams with backpressure to a
private temporary file, keeps only the first 512 bytes for signature inspection,
and enforces the cap while streaming (including chunked requests). The header
MIME and size must match the token. JPEG/PNG/WebP/GIF/PDF/MP4/WebM signatures
must match the declared type; this is not a full decoder or antivirus scan.
MP4 requires an MP4-compatible `ftyp` brand; WebM requires EBML DocType `webm`.
Only validated files are atomically promoted, without overwriting an object.
Interrupted, expired, oversized, or mismatched uploads are removed.

Finalize rechecks verified metadata and the original limits: images 10 MiB,
PDF 25 MiB, MP4/WebM 100 MiB. SVG, HTML, JavaScript, and all other MIME types
are disallowed. Serving derives MIME from verified metadata, rejects symlinks/
traversal/unverified bytes, and returns 200/206/416 with `nosniff`, byte-range
and cache headers. Missing files/metadata return 404. Finalize/delete retain
admin + same-origin guards; deletion retains reference protection (409) across
products, articles, certificates, page content, settings, drafts, and published
content. No database columns were added.

## Object paths and production scope

The owner verified on a full production database dump that there are **zero
existing `/objects/` references**. No legacy copy is needed, so this task
intentionally includes **no copy/export script or cloud migration steps**.
No production access, SQL, or database migration is needed or performed.

Changing drivers does not fetch cloud objects automatically. Upload URLs retain
the existing `/objects/uploads/<id>` identity and
`/api/storage/objects/uploads/<id>` serving route, backed locally by
`uploads/<id>` plus `.metadata/<id>.json`. Missing or unverified objects return
**404**, not 500.
Public `/api/storage/public-objects/<relative-path>` uses the exact relative path
and private hash-based files/metadata. Bundled frontend assets (`/media/...`,
`/logo.png`, company PDF) are unaffected.

## Verification

```bash
pnpm run typecheck
pnpm --filter @workspace/api-server test:storage
```

The test runner removes database and all storage environment variables. It
starts the real storage HTTP router on loopback with an isolated temporary local
directory and an **in-memory media repository** (no SQL/production/database).
It tests upload/finalize/ranges/reference protection/deletion, cookie-free PUT,
replay/concurrent use/expiry/tampering/size caps/MIME signatures, imports, traversal,
symlinks and corrupted metadata. Admin/origin guards are injected test guards;
the production wrapper still uses the existing unchanged authentication guards.
The optional Replit round-trip test is skipped without its configuration/sidecar.
