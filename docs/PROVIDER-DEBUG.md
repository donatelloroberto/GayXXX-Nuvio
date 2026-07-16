# Provider source audit and remediation

## Repository provenance

`Tuangayxx/GayXXX` is a distribution repository, not a hidden runtime dependency. Its `builds` branch contains compiled `.cs3` files plus two registries. Commit/workflow history identifies two independent build inputs:

- `plugins.json`: the Gayvn-derived provider family.
- `BLxplugins.json`: the BLx-derived provider family.

BLx is not merely a hash-verified copy of the main list. It contains different providers and different implementations. The current registry union contains 29 distinct providers after deduplicating Gayxx. Three current entries—Jayboys, JavmovieChudai, and Pinoymoviepedia—were missing from the previous Stremio generator and are now included.

The Gayvn Kotlin sources were used where available. For BLx-only providers, routes, selectors, player entry points, host aliases, and headers were recovered from the current compiled artifact constants. The compiled files are build inputs only; the deployed Stremio runtime does not download or execute them.

## Root causes found

1. The first conversion applied generic WordPress routes and card selectors to unrelated sites. Exact catalog/search behavior was lost.
2. Dynamic player entry points were treated as direct media. Mirror menus, tab-button JavaScript, `data-v` base64 data, WordPress AJAX, packed scripts, and literal episode tokens therefore returned no streams.
3. Only the first packed script was decoded. Players such as ssPlay place the useful configuration after unrelated packed anti-debug scripts.
4. HLS endpoints sometimes use an `.html` path and an incorrect `text/html` content type. Extension/content-type-only detection rejected valid `#EXTM3U` responses.
5. Poster URLs requiring a Referer were handed directly to Stremio, so hotlink protection produced blank artwork.
6. Timeout handling attempted to assign to the read-only `code` property of a DOMException, masking the actual upstream timeout with `Cannot set property code ... which has only a getter`.
7. The deployed server and CloudStream app do not have the same network identity. Many adult origins return an identical 195-byte `Site Unavailable` page to datacenter requests even when parsing is correct.
8. The rendered-reader fallback inherited browser `User-Agent`, `Accept`, `Accept-Language`, and `Referer` headers. The reader endpoint rejects that header combination with HTTP 403; minimal reader-specific headers return the rendered origin HTML.
9. Some direct requests returned HTTP 200 with unusable markup. Fallback previously ran only on non-2xx responses, so a misleading 200 response prevented recovery.
10. Current compiled artifacts and redirects moved Gayxx to `asiangaysex.net`/`boyplus.net`, GXtapes to `gay.xtapes.tw` (canonical links use `gayxtapes.tw`), and MenXtube to `gayxfans.com`.

## Source-faithful behavior now implemented

| Providers | Catalog/poster mapping | Stream mapping |
|---|---|---|
| BestHDgayporn, topHDgayporn, Justthegays | AIOVG cards, Firefox/age cookies, lazy image attributes | JSON-LD, video/source, iframe media |
| BoyfriendTV | media grid and `/search/?q=` | `var sources = [...]` with source labels and HLS flags |
| Fxggxt, FxggxtOrg | `article.loop-video` and schema metadata | `div.responsive-player iframe` plus nested hosts |
| GayStream | `div.grid-item`, `/?s=&page=` | tab-button `.src`, `iframe#ifr`, download link, ListMirror, Voe/Dood aliases |
| Nurgay | `article.loop-video`, schema poster/duration | `#mirrorMenu`/dropdown mirrors, ListMirror, StreamTape/Dood/Filemoon/Bigwarp aliases |
| Gayxx, Gaycock4U, GayKinkyPorn, Gaypornvidsxxx, iGay69 | provider-specific cards and lazy posters | source-specific iframe/data attributes plus recursive player state |
| GEPorner | exact Eporner result cards | `EP.video.player.vid/hash` XHR with base-36 hash conversion |
| GPornOne | `.popbop.vidLinkFX` | `#pornone-video-player source` |
| GXtapes | `ul.listing-tube li` | `#video-code iframe` plus 74k/88z/44x/Dood aliases |
| BLvietsub | Blogger `div.phimitem` and lazy posters | `[label\|embed]` episode tokens, all packed blocks, ssPlay source arrays, mislabeled HLS bodies |
| KRX18 | archive cards | WordPress `doo_player_ajax` and returned embeds |
| MenXtube, Videosxgays, Traingon, GVhot, Gaypornhot | exact BLx card/search constants; MenXtube follows the current GayXFans redirect | iframe, flashvar, data-link, packed/JSON player traversal |
| Xhamster, XvideosGay | exact mobile/mosaic cards and `srcset` posters | Xhamster initial JSON and Xvideos player state |
| Jayboys | `div.list-item div.video.col-2` | player/video `data-src`, iframes, sources and downloads |
| JavmovieChudai | `article.video-card`, CSS `div.art-poster` | direct `video.art-video source` and decoded `data-v` server JSON |
| Pinoymoviepedia | Doothemes archive cards and multi-attribute posters | `div.pframe iframe` plus Dood/Mixdrop/Voe/VidHide/StreamWish-compatible recursion |

## Posters and metadata

Catalog parsing now honors each provider's title, link, and poster selectors, including `srcset`, lazy-image attributes, CSS `url(...)`, schema.org metadata, and JSON-LD `VideoObject` data. Metadata preserves the exact catalog ID used by Stremio. Artwork is returned through a signed provider-scoped proxy that supplies the original Referer and provider headers. If an origin still rejects the image, the proxy returns a valid SVG poster instead of an empty field.

## Live verification and network limits

On 2026-07-16 the corrected BLvietsub chain returned a live stream from its current page through ssPlay. Pinoymoviepedia returned 57 valid catalog items with posters and resolved a current item to a live HLS URL. After correcting reader headers, 200-response fallback, redirect hosts, and detail URL recognition, live end-to-end samples also returned web-ready streams for Nurgay (7), GEPorner (12), GXtapes (2), XvideosGay (2), and MenXtube/GayXFans (4 non-preview source qualities, with duplicate download variants removed by URL deduplication where identical).

The 29-origin probe from this workspace produced:

- 1 fully parsed origin (Pinoymoviepedia).
- 18 origins returning the same 195-byte `Site Unavailable` response with HTTP 200.
- 9 origins exceeding the intentionally short 12-second concurrent probe budget.
- 1 origin returning HTTP 502 (GXtapes).

Those 195-byte responses contain no provider markup and cannot be repaired with another CSS selector. They are recorded as `CHALLENGE_OR_UNAVAILABLE`, distinct from `NO_ITEMS_PARSED`. A different deployment region or an authorized browser/proxy service may be required for origins that block Vercel/datacenter traffic. The deterministic suite verifies the recovered routes and player flows without pretending a blocked origin passed a live test.

## Failure logging

Every request receives a request ID. Failures are emitted as structured JSON to the Vercel or Netlify runtime logs with `service=stremio-provider-diagnostics` and are also available in the bounded current-instance window at `/diagnostics.json`.

Events include provider, stage, reason code, safe message, upstream hostname, HTTP status, duration, and request ID. Full paths, tokens, cookies, authorization values, and API keys are omitted or redacted. Use the request ID to correlate catalog, metadata, poster, extractor-fetch, and final stream events.

Run after deployment:

```bash
npm run audit:live -- https://DEPLOYED-HOST
```

The audit checks every manifest and catalog, then samples metadata, posters, total streams, and Stremio-Web-ready streams. It also stores the current diagnostic snapshot in the report.
