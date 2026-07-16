# GayXXX Individual Stremio Addons

The former hybrid Nuvio repository has been replaced by 29 independently installable Stremio addons. Each provider has a unique manifest and catalog ID while sharing a defensive catalog/meta/stream runtime, source-faithful provider mappings, a recursive player extractor, and structured failure diagnostics.

The deployment root provides a searchable installation directory. Every provider card has its own **Install in Stremio** and **Copy Manifest** actions generated from the active deployment hostname.

## Addons

`besthdgayporn`, `blvietsub`, `boyfriendtv`, `fullboys`, `fxggxt`, `fxggxtorg`, `gaycock4u`, `gaykinkyporn`, `gaypornhot`, `gaypornvidsxxx`, `gaystream`, `gayxx`, `geporner`, `gpornone`, `gvhot`, `gxtapes`, `igay69`, `javmoviechudai`, `jayboys`, `justthegays`, `krx18`, `menxtube`, `nurgay`, `pinoymoviepedia`, `tophdgayporn`, `traingon`, `videosxgays`, `xhamster`, and `xvideosgay`.

No provider represented by the former repository was omitted. The CloudStremio-Converter, gayxxx, and gayvn-cs repositories were consulted read-only for conversion and extractor behavior.

## Structure

- `addons/<provider>/`: independent npm workspace and provider documentation
- `packages/shared/`: Stremio runtime, provider registry, configurations, and extractors
- `api/`: shared Vercel entry point
- `netlify/functions/`: Netlify Functions adapter for the same application
- `tools/`: deterministic fixture tests, workspace generation, and build validation

## Development

```bash
npm install
npm test
npm run build
npm run dev
npm run dev --workspace addons/gxtapes
```

The directory is served at `http://localhost:7000`. A selected standalone workspace addon is served at `http://localhost:7000/manifest.json`. Change `PORT`, `FETCH_TIMEOUT_MS`, `PROVIDER_TIMEOUT_MS`, `CACHE_TTL_MS`, or `MAX_CATALOG_ITEMS` as needed.

## Deployment and installation

Deploy the repository as one Vercel project:

```bash
vercel deploy
```

The committed `vercel.json` pins Node.js 24, uses `public` as the non-empty build output directory, and forwards every public route to the shared serverless API while preserving the provider path.

For Netlify, import the same repository and leave the base directory empty. The committed `netlify.toml` supplies the build command (`npm run build`), publish directory (`public`), Node/npm versions, Functions directory, and the catch-all rewrite to the shared handler. No Corepack setup is required.

Every manifest is then available at:

```text
https://DEPLOYED-HOST/<provider>/manifest.json
```

For example, the G_Xtapes template is `https://DEPLOYED-HOST/gxtapes/manifest.json`. Replace `DEPLOYED-HOST` only after deployment, then paste the resulting HTTPS manifest URL into Stremio.

## Contract behavior

- Home/search pages map to searchable catalogs.
- Reversible provider-scoped IDs map catalog entries to metadata and streams.
- Invalid IDs return empty Stremio results rather than server errors.
- Stream URLs are deduplicated and required Referer/Origin headers are carried in `behaviorHints.proxyHeaders`. Headers no longer incorrectly set `notWebReady`, so Stremio Web does not hide otherwise playable results.
- Catalog and metadata artwork is served through a provider-scoped poster proxy. It supplies the provider Referer, CORS/cache headers, and a local SVG fallback when the origin blocks image hotlinks.
- Upstream, parser, and extractor failures are isolated.
- Metadata keeps the exact catalog content ID so Stremio can always request the matching stream resource.
- Player discovery covers direct media, JSON/JSON-LD state, base64 player data, every Dean Edwards packed block, nested iframes, CloudStream-style episode tokens, DoodStream, StreamTape, ssPlay, Eporner XHR, and WordPress player AJAX.
- Nurgay retries blocked catalog, metadata, and source-page requests through a rendered-reader fallback, then resolves its ListMirror player and nested mirrors. The fallback is not used by providers that do not need it.

## Provider diagnostics

Every catalog, metadata, and stream failure is recorded with a provider ID, stage, reason code, safe message, upstream hostname, HTTP status, duration, and request ID. Query the recent in-process window at:

```text
https://DEPLOYED-HOST/diagnostics.json
https://DEPLOYED-HOST/diagnostics.json?provider=fxggxt&stage=stream&limit=50
```

The GUI footer links to the same endpoint. This recent window is intentionally bounded and resets when a serverless function instance is recycled. The identical JSON event is written to the hosting runtime logs with `service=stremio-provider-diagnostics`; use the Vercel or Netlify log view for the retained record. URLs are reduced to their hostname and common tokens, cookies, authorization values, and API keys are redacted.

Common reason codes are `UPSTREAM_FETCH_FAILED`, `HTTP_FAILURE`, `TIMEOUT`, `CHALLENGE_OR_UNAVAILABLE`, `READER_FALLBACK_USED`, `NO_ITEMS_PARSED`, `FALLBACK_METADATA`, `POSTER_PROXY_FAILED`, `NO_PLAYABLE_URLS`, `EXTRACTOR_ERROR`, and `EMPTY_STREAMS`.

## Validation

`npm test` runs deterministic mocked catalog, metadata, direct/JSON/iframe stream extraction, header, manifest-ID, catalog-ID, navigation filtering, diagnostics redaction, and invalid-ID tests for every addon. Live upstream smoke checks are separate because provider availability and anti-bot behavior can change.

Run a live audit after every deployment:

```bash
npm run audit:live -- https://DEPLOYED-HOST
```

The audit tests each manifest and catalog, then checks metadata, posters, total streams, and Stremio-Web-ready streams for up to three catalog samples per provider. It writes `live-audit.json`, includes the recent diagnostic snapshot, and returns a non-zero exit code if a provider has no catalog, no metadata, or no web-ready playable sample. `AUDIT_SAMPLE_LIMIT`, `AUDIT_CONCURRENCY`, `AUDIT_TIMEOUT_MS`, and `AUDIT_OUTPUT` tune the run.

The provider-by-provider baseline and remediation map is in [docs/PROVIDER-DEBUG.md](docs/PROVIDER-DEBUG.md).

## Troubleshooting

- An empty catalog usually means the upstream site changed its markup or blocked the server region; inspect the provider's `catalog` events.
- An empty stream list means both extractor paths found no supported playable URL; inspect the provider's `stream` and `extractor-fetch` events.
- Increase timeout environment variables only when the upstream source is consistently slow.
- Provider site or host changes may require selector or extractor maintenance.
