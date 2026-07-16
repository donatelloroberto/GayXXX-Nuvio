# Provider debug and remediation map

The live baseline below was captured from `https://gay-xxx-nuvio.vercel.app` before this patch on 2026-07-16. Each row tested the manifest, home catalog, the first catalog item's metadata, and its stream resource. A zero in the baseline is evidence of the observed failure, not a permanent statement about the upstream site.

This patch cannot truthfully claim a live post-fix result until it is deployed. Run `npm run audit:live -- https://DEPLOYED-HOST` after deployment; the report tests up to three items per provider so one removed or protected video does not incorrectly condemn the entire provider.

| Provider | Baseline catalog/meta/streams | Remediation in this patch |
|---|---:|---|
| besthdgayporn | 30 / yes / 1 | Removed the incorrect `notWebReady` flag that made header-bearing streams invisible in Stremio Web; added provider-hosted poster proxy/fallback and direct-media regression coverage. |
| blvietsub | 25 / yes / 0 | Added recursive iframe, JSON/JSON-LD, script, and direct-media extraction. |
| boyfriendtv | 0 / no / 0 | Added the current newest/HD listing fallback and image-card fallback parsing. |
| fullboys | 30 / yes / 2 | Preserved the working direct-media path and metadata-ID contract. |
| fxggxt | 30 / yes / 0 | Added packed-script decoding, recursive embeds, and longer fetch/provider timeouts. |
| fxggxtorg | 20 / yes / 11 | Preserved provider extraction and merged/deduplicated it with the universal extractor. |
| gaycock4u | 22 / yes / 0 | Rejects `/categories/` and other navigation pages before creating content IDs; adds player recursion. |
| gaykinkyporn | 0 / no / 0 | Adds fallback card/image discovery and explicit challenge/markup diagnostics. |
| gaypornhot | 0 / no / 0 | Adds fallback card/image discovery and explicit challenge/markup diagnostics. |
| gaypornvidsxxx | 0 / no / 0 | Adds fallback card/image discovery and explicit challenge/markup diagnostics. |
| gaystream | 26 / yes / 0 | Corrected search to `/search/<slug>/`; added recursive player/script extraction, filtered social/placeholder URLs from player probes, and routed posters through the shared image proxy. |
| gayxx | 0 / no / 0 | Replaced retired `asiangaysex.net`/Boyplus targets with `gayxx.net` and date/root catalog fallbacks. |
| geporner | 7 / yes / 0 | Rejects `/parentalcontrol/`; adds the Eporner video XHR flow and base-36 hash conversion. |
| gpornone | 30 / yes / 14 | Preserved the working multi-source extraction path and proxy headers. |
| gvhot | 0 / no / 0 | Increased short timeouts and added data-link/button/script discovery with failure timing. |
| gxtapes | 0 / no / 0 | Replaced retired `gay.xtapes.tw` with `gay.xtapes.in`; added date-filter/root catalog fallbacks. |
| igay69 | 20 / yes / 0 | Added packed-script, JSON state, and nested iframe extraction. |
| justthegays | 30 / yes / 1 | Preserved working extraction and added fallback/diagnostic coverage. |
| krx18 | 0 / no / 0 | Added WordPress `doo_player_ajax` resolution plus recursive resolution of returned embeds. |
| menxtube | 0 / no / 0 | Increased short timeouts, added broad image-card parsing, and nested player extraction. |
| nurgay | 0 / no / 0 | Added latest/most-viewed targets plus a rendered-reader fallback for the origin's 403 response; parses `thumbnailUrl`/ISO duration metadata and resolves ListMirror plus nested mirrors. |
| tophdgayporn | 14 / yes / 1 | Preserved the working direct-media path and added metadata-ID coverage. |
| traingon | 0 / no / 0 | Added image-anchor catalog fallback and challenge/markup diagnostics. |
| videosxgays | 24 / yes / 0 | Replaced the old short provider budget with 35 seconds and added recursive player/script extraction. |
| xhamster | 0 / no / 0 | Added image-card and embedded JSON/player discovery; challenge responses are now identified rather than silently swallowed. |
| xvideosgay | 0 / no / 0 | Added image-card and script/player discovery; HTTP/challenge failures now include status and timing. |

## Failure flow

Each Stremio request receives a request ID. Catalog targets report HTTP, timeout, challenge, or zero-card failures. Metadata reports fallback use while preserving the catalog ID. Stream resolution runs the universal and provider-specific extractors independently, merges successful URLs, and reports both extractor failure and the final empty result when neither path succeeds.

The public diagnostic response deliberately omits complete upstream URLs and secrets. The event schema is:

```json
{
  "service": "stremio-provider-diagnostics",
  "timestamp": "2026-07-16T00:00:00.000Z",
  "level": "warn",
  "provider": "fxggxt",
  "stage": "stream",
  "code": "NO_PLAYABLE_URLS",
  "message": "No direct media in page or 0 embeds",
  "upstreamHost": "fxggxt.com",
  "durationMs": 15321,
  "requestId": "iad1::example"
}
```

Use the request ID to correlate catalog, metadata, extractor-fetch, and stream events for a single Stremio call. Use the counters in `/diagnostics.json` to see repeated failure signatures instead of treating a one-off removed video as a provider-wide outage.
