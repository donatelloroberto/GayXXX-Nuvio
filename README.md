# GayXXX Nuvio Repository

A native Nuvio local-scraper repository converted from the supplied GayXXX CloudStream build archive.

## Install

Host this folder in a public GitHub repository, then add either the repository URL or its raw manifest URL in Nuvio:

```text
https://raw.githubusercontent.com/<owner>/<repo>/main/manifest.json
```

The manifest registers 26 standalone JavaScript scrapers under `providers/`.

## Runtime contract

Each scraper exports:

```javascript
module.exports = {
  getStreams(tmdbId, mediaType, season, episode),
  scrape(metadata)
};
```

The files are self-contained and only require the module supported by current Nuvio runtimes:

```javascript
require("cheerio-without-node-native")
```

## Conversion behavior

1. Nuvio supplies a TMDB ID for the selected movie or TV title.
2. The scraper gets its title/year from TMDB.
3. It uses the original CloudStream provider's search path and item selector.
4. It resolves direct MP4/M3U8/MKV/WebM links, JSON-LD sources, embedded state, iframe players, download links, and common script patterns.
5. Site-specific paths are included for Eporner, KRX18, Nurgay, BoyfriendTV, XHamster, and Xvideos-style pages.

## Validation

```bash
node tools/validate.mjs
```

For the fixture smoke test:

```bash
npm install --no-save cheerio-without-node-native
node tools/smoke-test.mjs
```

## Important model difference

CloudStream providers can publish their own browse/search catalogs. Nuvio native local scrapers are stream providers invoked for a selected metadata title. Therefore this repository preserves source searching and stream resolution, but it cannot recreate the original CloudStream home-page catalogs through `manifest.json` alone. A catalog requires a separate HTTP/Stremio-compatible addon service.

## Maintenance

The source sites can change HTML, domains, or anti-bot behavior. Update the corresponding entry in `docs/conversion-map.json` and its provider file when that happens.
