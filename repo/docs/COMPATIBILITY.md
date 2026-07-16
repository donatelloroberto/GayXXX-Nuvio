# Compatibility notes

## Corrected conversion contract

The attached conversion notes proposed `getSourcesProvider`. Current Nuvio repositories and compatible runtimes use `getStreams(tmdbId, mediaType, season, episode)` as the primary export, with `scrape(metadata, options)` as a fuller fallback contract. This repository exports both supported forms.

## Sandboxed runtime assumptions

The providers use only:

- `fetch`
- `URL`
- `URLSearchParams`
- `console`
- CommonJS `module.exports`
- `cheerio-without-node-native`

They do not use Node filesystem, `axios`, standard `cheerio`, local module imports, environment variables, or a package bundler.

## Source coverage

The conversion includes every provider directory in the supplied ZIP, including packages present only in `BLxplugins.json` and not in the primary `plugins.json`.
