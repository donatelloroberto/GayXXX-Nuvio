# GayXXX Nuvio

This repository now supports both Nuvio extension systems:

1. **Plugin repository** — the 26 converted JavaScript stream providers.
2. **Hosted addon** — catalogs, search, metadata and stream endpoints for the original provider sites.

## 1. Plugin repository

Install this URL under **Settings → General → Plugin manifest URL**:

```text
https://raw.githubusercontent.com/donatelloroberto/GayXXX-Nuvio/refs/heads/main/manifest.json
```

The root `manifest.json` remains the plugin repository manifest so existing installations continue to work.

## 2. Catalog/search addon

The addon must run on a Node.js host because catalog and stream responses are generated dynamically. Deploy this repository to Vercel, then install the deployment URL under **Addons**:

```text
https://YOUR-PROJECT.vercel.app/manifest.json
```

The hosted addon provides:

```text
/manifest.json
/catalog/movie/gayxxx.json
/catalog/movie/gayxxx/search=<query>.json
/catalog/movie/gayxxx/genre=<provider>.json
/meta/movie/gayxxx:<provider>:<payload>.json
/stream/movie/gayxxx:<provider>:<payload>.json
```

### Vercel deployment

1. Import `donatelloroberto/GayXXX-Nuvio` in Vercel.
2. Keep the framework preset as **Other**.
3. Deploy without a build command.
4. Copy the resulting `/manifest.json` URL into Nuvio's **Addons** page.

`vercel.json` routes all addon API requests to `api/index.js`. The raw GitHub plugin manifest is unaffected.

## Local test

```bash
npm install
npm test
npm start
```

Then install:

```text
http://127.0.0.1:7000/manifest.json
```

## How browsing works

- The combined **GayXXX** catalog queries the actual provider sites rather than TMDB.
- The catalog supports search, provider filtering through the genre selector, and pagination.
- Catalog IDs contain the source provider and page URL.
- Metadata is extracted from the source page.
- Playback uses the corresponding converted provider's direct-link resolver and passes required Referer/User-Agent headers through `behaviorHints.proxyHeaders`.

## Notes

Some sites may require a VPN, may block datacenter IP addresses, or may change their HTML. Failed providers are skipped so one unavailable site does not prevent other catalog results from loading.
