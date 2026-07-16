# BLvietsub

Independent Stremio addon for BLvietsub.

- Manifest ID: `community.blvietsub`
- Resources: catalog, meta, stream
- Content type: movie
- Local run: `npm run dev --workspace addons/blvietsub`
- Local manifest: `http://localhost:7000/manifest.json`
- Shared deployment manifest: `https://DEPLOYED-HOST/blvietsub/manifest.json`
- Environment: `PORT`, `FETCH_TIMEOUT_MS`, `PROVIDER_TIMEOUT_MS`, `CACHE_TTL_MS`, optional `TMDB_API_KEY`

Deploy the repository to Vercel with the root configuration. Upstream markup or host protection can require extractor maintenance.
