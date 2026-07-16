# Validation report

The generated repository was checked in three layers:

1. **Coverage:** 26 source package directories in `GayXXX-builds.zip`; 26 Nuvio scraper entries in `manifest.json`.
2. **Static validation:** all manifest IDs are unique, every referenced provider file exists, all JavaScript files parse successfully, every provider exports `getStreams`, and no unsupported local/Node imports are used.
3. **Fixture runtime test:** every provider was loaded in an isolated JavaScript VM, received mocked TMDB/search/detail responses, executed `getStreams(1, "movie")`, and returned a valid direct stream object.

Commands:

```bash
node tools/validate.mjs
npm install --omit=optional
node tools/smoke-test.mjs
```

Observed result:

```text
OK: 26 scraper entries, unique IDs, valid JavaScript syntax, and supported imports.
OK: loaded and invoked 26 providers with fixture HTTP responses.
```

The fixture test verifies repository/runtime integration and extraction flow. Individual public sites can still require future selector/domain updates when their HTML or anti-bot rules change.
