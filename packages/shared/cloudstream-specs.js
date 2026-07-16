"use strict";

/*
 * Provider behaviour recovered from the authoritative Gayvn Kotlin sources and
 * from string constants in the current GayXXX/builds CloudStream artifacts.
 * Keep this data separate from the generated provider list so future manifest
 * refreshes cannot silently replace provider-specific scraping with defaults.
 */

const FIREFOX_139 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0";

module.exports = {
  besthdgayporn: {
    sourceFamily: "gayvn",
    homeUrls: ["https://besthdgayporn.com/", "https://besthdgayporn.com/video-tag/men-com/"],
    searchTemplates: ["/?s=%q%"],
    itemSelector: "div.aiovg-item-video",
    card: { title: ".aiovg-link-title", link: "a[href]", poster: "img", posterAttributes: ["data-src", "data-lazy-src", "src"] },
    requestHeaders: { "User-Agent": FIREFOX_139, Cookie: "hasVisited=1; accessAgeDisclaimerPH=1" },
    streamStrategy: "aiovg"
  },
  blvietsub: {
    sourceFamily: "blx",
    homeUrls: ["https://www.blvietsub.vip/", "https://www.blvietsub.vip/search/label/viet-nam?max-results=24"],
    searchTemplates: ["/?s=%q%"],
    itemSelector: "div.phimitem",
    card: { title: "h3.lable-home div.title-vi, h3.lable-home", link: "a.lable-about[href], a[href]", poster: "div.lable-img img, img", posterAttributes: ["data-image", "data-src", "src"] },
    streamStrategy: "blvietsub"
  },
  boyfriendtv: {
    sourceFamily: "gayvn",
    searchTemplates: ["/search/?q=%q%"],
    itemSelector: "ul.media-listing-grid.main-listing-grid-offset li",
    card: { title: "p.titlevideospot a", link: "a[href]", poster: "img", posterAttributes: ["data-src", "data-lazy-src", "src"] },
    streamStrategy: "boyfriend-sources"
  },
  fullboys: {
    sourceFamily: "gayvn-binary",
    homeUrls: ["https://fullboys.com/?filter=vip", "https://fullboys.com/topic/video/asian"],
    searchTemplates: ["/home?search=%q%"],
    itemSelector: "article.movie-item",
    card: { title: "h3.title", link: "a[href]", poster: "img.fix-w, img", posterAttributes: ["data-main-thumb", "data-src", "src"] },
    streamStrategy: "fullboys"
  },
  fxggxt: {
    sourceFamily: "gayvn",
    searchTemplates: ["/?s=%q%", "/page/2/?s=%q%"],
    itemSelector: "article.loop-video.thumb-block",
    card: { title: "header.entry-header span", link: "a[href]", poster: ".post-thumbnail-container img, img", posterAttributes: ["data-src", "src"] },
    streamStrategy: "responsive-iframe"
  },
  fxggxtorg: {
    sourceFamily: "blx",
    searchTemplates: ["/?s=%q%", "/page/2/?s=%q%"],
    itemSelector: "article.loop-video.thumb-block",
    card: { title: "header.entry-header span", link: "a[href]", poster: ".post-thumbnail-container img, img", posterAttributes: ["data-src", "src"] },
    streamStrategy: "responsive-iframe"
  },
  gaycock4u: {
    sourceFamily: "gayvn",
    homeUrls: ["https://gaycock4u.com/", "https://gaycock4u.com/category/bareback/"],
    searchTemplates: ["/?s=%q%", "/page/2/?s=%q%"],
    itemSelector: "div.elementor-widget-container article.elementor-post",
    card: { title: "p.elementor-heading-title a", link: "a[href]", poster: "a img, img", posterAttributes: ["data-src", "data-lazy-src", "src"] },
    requestHeaders: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" },
    streamStrategy: "iframes"
  },
  gaykinkyporn: {
    sourceFamily: "gayvn-binary",
    searchTemplates: ["/?s=%q%", "/page/2/?s=%q%"],
    itemSelector: "article.loop-video.thumb-block, article.loop-video",
    card: { title: "header.entry-header span", link: "a[href]", poster: ".post-thumbnail-container img, img", posterAttributes: ["data-main-thumb", "data-src", "src"] },
    readerCatalogFallback: true,
    streamStrategy: "responsive-iframe"
  },
  gaypornhot: {
    sourceFamily: "blx",
    searchTemplates: ["/?s=%q%", "/page/2/?s=%q%"],
    itemSelector: "div.videopost.col-md-3.col-sm-4.col-xs-6",
    card: { title: "div.deno.video-title a", link: "a.thumb-video[href], a[href]", poster: "a.thumb-video img, img.img-responsive, img", posterAttributes: ["data-src", "src"] },
    streamStrategy: "gaypornhot"
  },
  gaypornvidsxxx: {
    sourceFamily: "gayvn-binary",
    homeUrls: ["https://www.gaypornvidsxxx.com/", "https://www.gaypornvidsxxx.com/home/tag/Chinese"],
    searchTemplates: ["/?s=%q%", "/?s=%q%&page=2"],
    itemSelector: "div.item, div.video-item, article.blog-item",
    card: { title: "h1.blog-title a, h2 a, h3 a", link: "a[href]", poster: "img", posterAttributes: ["data-src", "src"] },
    streamStrategy: "gaypornvidsxxx"
  },
  gaystream: {
    sourceFamily: "gayvn",
    homeUrls: ["https://gaystream.pw/", "https://gaystream.pw/video/category/4k"],
    searchTemplates: ["/?s=%q%&page=1", "/?s=%q%&page=2"],
    itemSelector: "div.grid-item",
    card: { title: "h3.item-title", link: "a.item-wrap[href]", poster: "img.item-img", posterAttributes: ["data-src", "data-lazy-src", "src"] },
    streamStrategy: "tabs-buttons"
  },
  gayxx: {
    sourceFamily: "gayvn-blx",
    baseUrl: "https://asiangaysex.net",
    origin: "https://asiangaysex.net",
    homeUrls: ["https://asiangaysex.net/", "https://boyplus.net/latest-updates"],
    searchTemplates: ["/?s=%q%", "https://boyplus.net/?s=%q%"],
    itemSelector: "article.uim-home-card, div.uim-home-thumb, #list_videos_common_videos_list div.item",
    card: { title: "h3.post-title a, strong.title, a[title]", link: "a[href]", poster: "img.thumb, img", posterAttributes: ["data-original", "data-src", "src"] },
    allowedHosts: ["https://boyplus.net"],
    readerCatalogFallback: true,
    streamStrategy: "iframes"
  },
  geporner: {
    sourceFamily: "gayvn",
    homeUrls: ["https://www.eporner.com/cat/gay/hd-sex/1/", "https://www.eporner.com/cat/gay/4k-porn/1/"],
    searchTemplates: ["/search/%slug%/1", "/search/%slug%/2"],
    itemSelector: "#div-search-results div.mb, div.mb",
    card: { title: "div.mbunder p.mbtit a", link: "div.mbcontent a[href], a[href]", poster: "img", posterAttributes: ["data-src", "src"] },
    readerCatalogFallback: true,
    streamStrategy: "eporner"
  },
  gpornone: {
    sourceFamily: "gayvn",
    homeUrls: ["https://pornone.com/gay/1", "https://pornone.com/gay/1080p/1"],
    searchTemplates: ["https://pornone.com/gay/search?q=%q%&page=1", "https://pornone.com/gay/search?q=%q%&page=2"],
    itemSelector: ".popbop.vidLinkFX",
    card: { title: ".videotitle", linkAttribute: "href", poster: ".imgvideo", posterAttributes: ["data-src", "src"] },
    streamStrategy: "sources"
  },
  gvhot: {
    sourceFamily: "blx",
    homeUrls: ["https://www.gvhot.com/", "https://www.gvhot.com/hot/"],
    searchTemplates: ["/?s=%q%", "/page/2/?s=%q%"],
    itemSelector: "div.video-card",
    card: { title: "h3.video-title a", link: "h3.video-title a[href], a[href]", poster: ".video-thumb img, img", posterAttributes: ["data-src", "data-lazy-src", "src"] },
    streamStrategy: "gvhot"
  },
  gxtapes: {
    sourceFamily: "gayvn",
    baseUrl: "https://gay.xtapes.tw",
    origin: "https://gay.xtapes.tw",
    homeUrls: ["https://gay.xtapes.tw/?filtre=date&cat=0", "https://gay.xtapes.tw/category/porn-movies-214660"],
    searchTemplates: ["/page/1/?s=%q%", "/page/2/?s=%q%"],
    itemSelector: "ul.listing-tube li",
    card: { title: "img[title]", titleAttribute: "title", link: "a[href]", poster: "img", posterAttributes: ["src", "data-src"] },
    allowedHosts: ["https://gayxtapes.tw"],
    readerCatalogFallback: true,
    streamStrategy: "video-code"
  },
  igay69: {
    sourceFamily: "gayvn-binary",
    searchTemplates: ["/?s=%q%", "/page/2/?s=%q%"],
    itemSelector: "article.blog-entry",
    card: { title: "h2.wpex-card-title a", link: "h2.wpex-card-title a[href], a[href]", poster: "div.wpex-card-thumbnail img, img", posterAttributes: ["data-src", "data-lazy-src", "data-srcset", "src"] },
    streamStrategy: "responsive-panels"
  },
  javmoviechudai: {
    sourceFamily: "blx",
    homeUrls: ["https://www.javmoviechudai.com/?cat=1", "https://www.javmoviechudai.com/?tag=asian"],
    searchTemplates: ["/?s=%q%&page=1", "/?s=%q%&page=2"],
    itemSelector: "article.video-card",
    card: { title: "h3.card-title", link: "a[href]", poster: "div.art-poster", posterAttributes: ["style"] },
    requestHeaders: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36" },
    readerCatalogFallback: true,
    streamStrategy: "encoded-servers"
  },
  jayboys: {
    sourceFamily: "gayvn",
    homeUrls: ["https://javboys.tv/2025/", "https://javboys.tv/category/onlyfans/"],
    searchTemplates: ["/page/1/?s=%q%", "/page/2/?s=%q%"],
    itemSelector: "div.list-item div.video.col-2",
    card: { title: "a.denomination span.title", link: "a.thumb-video[href]", poster: "a.thumb-video img", posterAttributes: ["data-src", "src"] },
    requestHeaders: { "User-Agent": FIREFOX_139 },
    readerCatalogFallback: true,
    streamStrategy: "player-data-src"
  },
  justthegays: {
    sourceFamily: "gayvn",
    homeUrls: ["https://justthegays.com/", "https://justthegays.com/popular-82530/"],
    searchTemplates: ["/?s=%q%"],
    itemSelector: "div.col-xl-4",
    card: { title: "h3.post-title a", link: "div.item-img a[href]", poster: "div.item-img img", posterAttributes: ["data-src", "data-lazy-src", "src"] },
    requestHeaders: { "User-Agent": FIREFOX_139, Cookie: "hasVisited=1; accessAgeDisclaimerPH=1" },
    readerCatalogFallback: true,
    streamStrategy: "aiovg"
  },
  krx18: {
    sourceFamily: "blx",
    searchTemplates: ["/search/videos?search_query=%q%"],
    itemSelector: "#archive-content article, div.items.normal article, div.card.border-0",
    card: { title: "h2, h3, .title", link: "a[href]", poster: "img", posterAttributes: ["data-src", "src"] },
    readerCatalogFallback: true,
    streamStrategy: "wordpress-players"
  },
  menxtube: {
    sourceFamily: "blx",
    baseUrl: "https://gayxfans.com",
    origin: "https://gayxfans.com",
    homeUrls: ["https://gayxfans.com/", "https://gayxfans.com/latest-updates/"],
    searchTemplates: ["/search/?q=%q%"],
    itemSelector: "div.thumb-video.item",
    card: { title: "div.title", link: "a[href]", poster: "img", posterAttributes: ["data-webp", "data-original", "data-src", "src"] },
    readerCatalogFallback: true,
    streamStrategy: "flashvars"
  },
  nurgay: {
    sourceFamily: "gayvn",
    searchTemplates: ["/?s=%q%&page=1", "/?s=%q%&page=2"],
    itemSelector: "article.loop-video",
    card: { title: "header.entry-header span", link: "a[href]", poster: "img", posterAttributes: ["data-src", "src"] },
    readerCatalogFallback: true,
    streamStrategy: "mirror-menu"
  },
  pinoymoviepedia: {
    sourceFamily: "blx",
    homeUrls: ["https://pinoymoviepedia.ru/", "https://pinoymoviepedia.ru/genre/lgbt/"],
    searchTemplates: ["/search/%slug%"],
    itemSelector: "div.items.normal article, div#archive-content article, div.items.full article",
    card: { title: "div.data h3 a, h3 > a", link: "div.poster a[href], div.data h3 a[href], a[href]", poster: "div.poster img, img", posterAttributes: ["data-wpfc-original-src", "data-lazy-src", "data-src", "srcset", "src"] },
    readerCatalogFallback: true,
    streamStrategy: "pframe-iframes"
  },
  tophdgayporn: {
    sourceFamily: "gayvn",
    homeUrls: ["https://tophdgayporn.com/", "https://tophdgayporn.com/video-tag/bareback-gay-porn/"],
    searchTemplates: ["/?s=%q%"],
    itemSelector: "div.aiovg-item-video",
    card: { title: ".aiovg-link-title", link: "a[href]", poster: "img", posterAttributes: ["data-src", "data-lazy-src", "src"] },
    requestHeaders: { "User-Agent": FIREFOX_139, Cookie: "hasVisited=1; accessAgeDisclaimerPH=1" },
    streamStrategy: "aiovg"
  },
  traingon: {
    sourceFamily: "blx",
    homeUrls: ["https://traingon.top/latest", "https://traingon.top/popular"],
    searchTemplates: ["/search?q=%q%"],
    itemSelector: "a.card",
    card: { title: ".card-title", linkAttribute: "href", poster: ".card-thumb img, img", posterAttributes: ["data-poster", "data-src", "src"] },
    readerCatalogFallback: true,
    streamStrategy: "traingon"
  },
  videosxgays: {
    sourceFamily: "blx",
    homeUrls: ["https://www.gayxnow.com/videos/", "https://www.gayxnow.com/networks/voyr/"],
    searchTemplates: ["/search/?q=%q%"],
    itemSelector: "ul.grid-temp li, ul.listing-tube li",
    card: { title: "div.title", link: "a[href]", poster: "img.lazy-load, img", posterAttributes: ["data-original", "data-src", "src"] },
    streamStrategy: "videosxgays"
  },
  xhamster: {
    sourceFamily: "gayvn",
    homeUrls: ["https://vi.xhspot.com/gay/"],
    searchTemplates: ["/gay/search/%slug%"],
    itemSelector: "div.mobile-video-thumb",
    card: { title: "a.mobile-video-thumb__name", link: "a.mobile-video-thumb__name[href], a.thumb-image-container[href]", poster: "a.thumb-image-container img", posterAttributes: ["srcset", "src"] },
    readerCatalogFallback: true,
    streamStrategy: "xhamster-initials"
  },
  xvideosgay: {
    sourceFamily: "gayvn-binary",
    homeUrls: ["https://www.xvv1deos.com/best-of-gay/2026-03/", "https://www.xvv1deos.com/?k=gay"],
    searchTemplates: ["/?k=%q%"],
    itemSelector: "div.mozaique div.thumb-block",
    card: { title: "p.title a", link: "p.title a[href], a[href]", poster: "div.thumb a img, img", posterAttributes: ["data-src", "src"] },
    readerCatalogFallback: true,
    streamStrategy: "xvideos"
  }
};
