# Jayboys

Independent Stremio addon for Jayboys.

- Manifest ID: `community.jayboys`
- Resources: catalog, meta, stream
- Content type: movie
- Local run: `npm run dev --workspace addons/jayboys`
- Local manifest: `http://localhost:7000/manifest.json`
- Shared deployment manifest: `https://DEPLOYED-HOST/jayboys/manifest.json`
- Environment: `PORT`, `FETCH_TIMEOUT_MS`, `PROVIDER_TIMEOUT_MS`, `CACHE_TTL_MS`, optional `TMDB_API_KEY`

Deploy the repository to Vercel with the root configuration. Upstream markup or host protection can require extractor maintenance.
