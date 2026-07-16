# GayXXX Individual Stremio Addons

The former hybrid Nuvio repository has been replaced by 26 independently installable Stremio addons. Each provider has a unique manifest and catalog ID while sharing a defensive catalog/meta/stream runtime and its original provider-specific extractor.

The deployment root provides a searchable installation directory. Every provider card has its own **Install in Stremio** and **Copy Manifest** actions generated from the active deployment hostname.

## Addons

`besthdgayporn`, `blvietsub`, `boyfriendtv`, `fullboys`, `fxggxt`, `fxggxtorg`, `gaycock4u`, `gaykinkyporn`, `gaypornhot`, `gaypornvidsxxx`, `gaystream`, `gayxx`, `geporner`, `gpornone`, `gvhot`, `gxtapes`, `igay69`, `justthegays`, `krx18`, `menxtube`, `nurgay`, `tophdgayporn`, `traingon`, `videosxgays`, `xhamster`, and `xvideosgay`.

No provider represented by the former repository was omitted. The CloudStremio-Converter, gayxxx, and gayvn-cs repositories were consulted read-only for conversion and extractor behavior.

## Structure

- `addons/<provider>/`: independent npm workspace and provider documentation
- `packages/shared/`: Stremio runtime, provider registry, configurations, and extractors
- `api/`: shared Vercel entry point
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

Every manifest is then available at:

```text
https://DEPLOYED-HOST/<provider>/manifest.json
```

For example, the G_Xtapes template is `https://DEPLOYED-HOST/gxtapes/manifest.json`. Replace `DEPLOYED-HOST` only after deployment, then paste the resulting HTTPS manifest URL into Stremio.

## Contract behavior

- Home/search pages map to searchable catalogs.
- Reversible provider-scoped IDs map catalog entries to metadata and streams.
- Invalid IDs return empty Stremio results rather than server errors.
- Stream URLs are deduplicated and required Referer/Origin headers are carried in `behaviorHints.proxyHeaders`.
- Upstream, parser, and extractor failures are isolated.

## Validation

`npm test` runs deterministic mocked catalog, metadata, stream, header, manifest-ID, catalog-ID, and invalid-ID tests for every addon. Live upstream smoke checks are separate because provider availability and anti-bot behavior can change.

## Troubleshooting

- An empty catalog usually means the upstream site changed its markup or blocked the server region.
- An empty stream list means the provider extractor found no supported playable URL.
- Increase timeout environment variables only when the upstream source is consistently slow.
- Provider site or host changes may require selector or extractor maintenance.
