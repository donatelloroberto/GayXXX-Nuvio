# GayXXX Nuvio

This repository is both:

1. a Nuvio addon providing catalog, search, metadata and stream endpoints; and
2. a Nuvio native plugin repository containing 26 JavaScript scrapers.

## Install as an addon

Add this URL in **Nuvio → Addons**:

```text
https://gay-xxx-nuvio.vercel.app/manifest.json
```

## Install as a plugin repository

Add the same URL in **Settings → General → Plugin manifest URL**:

```text
https://gay-xxx-nuvio.vercel.app/manifest.json
```

The manifest intentionally contains both the addon contract and the `scrapers` registry. Each Nuvio parser ignores fields that do not belong to its subsystem.

## Required live checks

After every Vercel deployment, these URLs must return HTTP 200:

```text
https://gay-xxx-nuvio.vercel.app/health
https://gay-xxx-nuvio.vercel.app/manifest.json
https://gay-xxx-nuvio.vercel.app/catalog/movie/gayxxx.json
```

Expected health response:

```json
{"ok":true,"version":"2.1.0","service":"com.donatelloroberto.gayxxx"}
```

## Runtime

- Node.js is pinned to `22.x` for stable Vercel dependency installation.
- `manifest.json` is a static hybrid manifest.
- `/catalog`, `/meta`, `/stream`, `/health`, `/logo.svg`, and `/` are routed to `api/index.js`.
- Provider scripts remain available under `/providers/*.js`.

## Validation

```bash
npm ci
npm test
```

The tests validate all 26 plugin entries, execute every provider with fixture HTTP responses, and verify addon catalog/meta/stream behavior.
