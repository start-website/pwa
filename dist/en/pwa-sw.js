(function () {
    importScripts("/js/workbox-sw.js");

    workbox.setConfig({
        debug: true,
    });

    const SW_VERSION = "5.0.0";
    const { registerRoute } = workbox.routing;
    const { CacheableResponsePlugin } = workbox.cacheableResponse;
    const { ExpirationPlugin } = workbox.expiration
    const { cacheNames } = workbox.core;
    const navigationPreload = workbox.navigationPreload;
    const { NetworkFirst } = workbox.strategies;
    const { NetworkOnly } = workbox.strategies;
    const { CacheFirst } = workbox.strategies;
    const { StaleWhileRevalidate } = workbox.strategies;
    const { matchPrecache } = workbox.precaching;
    const { precacheAndRoute } = workbox.precaching;
    const { strategy } = workbox.streams;
    const { RangeRequestsPlugin } = workbox.rangeRequests

    const { warmStrategyCache } = workbox.recipes
    const { setCatchHandler } = workbox.routing
    const { setDefaultHandler } = workbox.routing

    // Fallback for use without precache
    // This can be any strategy, CacheFirst used as an example.
    // const strategyFallback = new CacheFirst();
    // const urlsFallback = [
    //     './offline.html',
    // ];

    // warmStrategyCache({urls: urlsFallback, strategy: strategyFallback});





    

    // Enable navigation preload for supporting browsers
    navigationPreload.enable();

    // Precache partials and some static assets
    // using the InjectManifest method.
    precacheAndRoute([
        // The header partial:
        {
            url: "./partial/header.html",
            revision: "1",
        },
        // The footer partial:
        {
            url: "./partial/footer.html",
            revision: "1",
        },
        {
            url: './offline.html',
            revision: 1
        },
    ]);

    // The strategy for retrieving content partials from the network:
    const contentStrategy = new NetworkFirst({
        cacheName: "pwa-page-content-cache",
        plugins: [
            {
                // NOTE: This callback will never be run if navigation
                // preload is not supported, because the navigation
                // request is dispatched while the service worker is
                // booting up. This callback will only run if navigation
                // preload is _not_ supported.
                requestWillFetch: ({ request }) => {
                    const headers = new Headers();

                    // If the browser doesn't support navigation preload, we need to
                    // send a custom `X-Content-Mode` header for the back end to use
                    // instead of the `Service-Worker-Navigation-Preload` header.
                    headers.append("X-Content-Mode", "partial");

                    // Send the request with the new headers.
                    // Note: if you're using a static site generator to generate
                    // both full pages and content partials rather than a back end
                    // (as this example assumes), you'll need to point to a new URL.
                    return new Request(request.url, {
                        method: "GET",
                        headers,
                    });
                },
                // What to do if the request fails.
                handlerDidError: async ({request}) => {
                    return await matchPrecache('./offline.html');
                }
            },
        ],
    });

    // Concatenates precached partials with the content partial
    // obtained from the network (or its fallback response).
    const navigationHandler = strategy([
        //Get the precached header markup.
        //() => matchPrecache("./partial/header.html"),

        // Get the content partial from the network.
        ({ event }) => contentStrategy.handle(event),

        // Get the precached footer markup.
        //() => matchPrecache("./partial/footer.html"),
    ]);

    // Register the streaming route for all navigation requests.
    registerRoute(
        ({ request, url }) => request.mode === "navigate" && !/webasyst/.test(url.pathname),
        navigationHandler
    );






    // const pageFallback = './offline.html';
    // const imageFallback = false;
    // const fontFallback = false;

    // setDefaultHandler(new NetworkOnly());

    // self.addEventListener('install', event => {
    //     const files = [pageFallback];
    //     if (imageFallback) {
    //         files.push(imageFallback);
    //     }
    //     if (fontFallback) {
    //         files.push(fontFallback);
    //     }

    //     event.waitUntil(
    //         self.caches
    //             .open('pwa-offline-fallbacks')
    //             .then(cache => cache.addAll(files))
    //     );
    // });

    // const handler = async options => {
    //     const dest = options.request.destination;
    //     const cache = await self.caches.open('pwa-offline-fallbacks');

    //     if (dest === 'document') {
    //         return (await cache.match(pageFallback)) || Response.error();
    //     }

    //     if (dest === 'image' && imageFallback !== false) {
    //         return (await cache.match(imageFallback)) || Response.error();
    //     }

    //     if (dest === 'font' && fontFallback !== false) {
    //         return (await cache.match(fontFallback)) || Response.error();
    //     }

    //     return Response.error();
    // };

    // setCatchHandler(handler);








    // Image
    registerRoute(
        ({ request }) => request.destination === "image",
        new CacheFirst({
            cacheName: "pwa-images-cache",
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new ExpirationPlugin({
                    // Keep at most 50 entries.
                    maxEntries: 50,
                    // Don't keep any entries for more than 30 days.
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                    // Automatically cleanup if quota is exceeded.
                    purgeOnQuotaError: true,
                }),
            ],
        })
    );

    // Static resources cache (style, script, web-worker)
    registerRoute(
        ({ request }) =>
            // CSS
            request.destination === 'style' ||
            // JavaScript
            request.destination === 'script' ||
            // Web Workers
            request.destination === 'worker',
        new StaleWhileRevalidate({
            cacheName: "pwa-static-resources-cache",
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
            ],
        })
    );

    // Google Fonts cache
    registerRoute(
        ({ url }) => url.origin === 'https://fonts.googleapis.com',
        new StaleWhileRevalidate({
            cacheName: 'pwa-google-fonts-stylesheet-cache',
        })
    );

    registerRoute(
        ({ url }) => url.origin === 'https://fonts.gstatic.com',
        new CacheFirst({
            cacheName: 'pwa-google-fonts-webfonts-cache',
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new ExpirationPlugin({
                    // Keep at most 30 entries.
                    maxEntries: 30,
                    // Don't keep any entries for more than 365 days.
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                }),
            ],
        })
    );

    // In your service worker:
    // It's up to you to either precache, use warmRuntimeCache, or
    // explicitly call cache.add() to populate the cache with media assets.
    // If you choose to cache media assets up front, do so with care,
    // as they can be quite large and exceed storage quotas.
    //
    // This route will go to the network if there isn't a cache match,
    // but it won't populate the cache at runtime because the response for
    // the media asset will be a partial 206 response. If there is a cache
    // match, then it will properly serve partial responses.
    registerRoute(
        ({ request }) => {
            const { destination } = request;

            return destination === 'video' || destination === 'audio'
        },
        new CacheFirst({
            cacheName: 'pwa-media-cache',
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [200]
                }),
                new RangeRequestsPlugin(),
            ],
        }),
    );

    self.addEventListener("message", (event) => {
        if (event.data.type === "GET_VERSION") {
            event.ports[0].postMessage(SW_VERSION);
        }

        // update sw
        if (event.data && event.data.type === 'SKIP_WAITING') {
            self.skipWaiting();
        }
    });
})();
