# Nurgay

Independent Stremio addon for Nurgay.

- Manifest ID: `community.nurgay`
- Resources: catalog, meta, stream
- Content type: movie
- Local run: `npm run dev --workspace addons/nurgay`
- Local manifest: `http://localhost:7000/manifest.json`
- Shared deployment manifest: `https://DEPLOYED-HOST/nurgay/manifest.json`
- Environment: `PORT`, `FETCH_TIMEOUT_MS`, `PROVIDER_TIMEOUT_MS`, `CACHE_TTL_MS`, optional `TMDB_API_KEY`

Deploy the repository to Vercel with the root configuration. Upstream markup or host protection can require extractor maintenance.
