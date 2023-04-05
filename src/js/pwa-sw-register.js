import { Workbox } from "workbox-window/Workbox.mjs";

if ("serviceWorker" in navigator) {
    const wb = new Workbox("/pwa-sw.js");

    const getToastUpdate = () => {
        const style = `
        <style>
            .pwa-toast, .pwa-toast *, ::after, ::before {
                box-sizing: border-box;
            }

            .pwa-toast {
                visibility: hidden;
                color: #fff;
                background-color: blue;
                width: auto;
                max-width: 100%;
                font-size: 16px;
                pointer-events: auto;
                background-clip: padding-box;
                box-shadow: rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px;
                border-radius: 4px;
                padding: 5px 25px;
                display: inline-block;
                position: fixed;
                z-index: 9999;
            }

            .pwa-toast__position_bottom-right {
                bottom: 30px;
                right: 50px;
            }

            .pwa-toast__position_bottom-center {
                bottom: 30px;
                transform: translateX(-50%);
                left: 50%;
            }

            .pwa-toast__position_bottom-left {
                bottom: 30px;
                left: 50px;
            }

            .pwa-toast__position_center {
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            .pwa-toast.pwa-toast__show {
                visibility: visible;
            }

            .pwa-toast__show.pwa-toast__show_bottom-right, .pwa-toast__show.pwa-toast__show_bottom-left, .pwa-toast__show.pwa-toast__show_bottom-center {
                -webkit-animation: pwaToastfadeInBottom 0.5s;
                animation: pwaToastfadeInBottom 0.5s;
            }

            .pwa-toast__show.pwa-toast__show_center {
                -webkit-animation: pwaToastfadeInCenter 0.5s;
                animation: pwaToastfadeInCenter 0.5s;
            }
            
            .pwa-toast__content {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .pwa-toast__block {
                margin-right: 30px;
            }

            .pwa-toast__block:last-child {
                margin-right: 0;
            }

            .pwa-toast__link {
                all: unset;
                text-transform: uppercase;
                cursor: pointer;
                color: #999;
                font-weight: bold;
                transition: color 100ms ease-in-out;
            }

            .pwa-toast__link:hover {
                color: #fff;
            }

            .pwa-toast__button-close {
                all: unset;
                background: none;
                cursor: pointer;
            }

            .pwa-toast__button-close:hover {
                background: none !important;
            }

            .pwa-toast__icon-close {
                font-size: 40px;
                color: #fff;
                line-height: 1;
                position: relative;
                bottom: 1px;
            }

            @-webkit-keyframes pwaToastfadeInBottom {
                from {
                    bottom: 0;
                    opacity: 0;
                }
                to {
                    bottom: 30px;
                    opacity: 1;
                }
            }

            @keyframes pwaToastfadeInBottom {
                from {
                    bottom: 0;
                    opacity: 0;
                }
                to {
                    bottom: 30px;
                    opacity: 1;
                }
            }

            @-webkit-keyframes pwaToastfadeInCenter {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes pwaToastfadeInCenter {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        </style>
        `
        const html = `
        <div id="toast-update-sw" class="pwa-toast pwa-toast__show pwa-toast__show_bottom-right pwa-toast__position_bottom-right" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="pwa-toast__content">
                <div class="pwa-toast__block">
                    A new version of this app is available.
                </div>
                <div class="pwa-toast__block">
                    <a id="pwa-sw-reload-true" class="pwa-toast__link" href="javascript:void(0);">Reload?</a>
                </div>
                <div class="pwa-toast__block">
                    <button id="pwa-sw-reload-false" class="pwa-toast__button-close" type="button" aria-label="Close">
                        <span class="pwa-toast__icon-close" aria-hidden="true">&times;</span>
                    </button>
                </div>
            </div>
        </div>`

        return style + html
    }

    const promptForUpdate = async () => {
        const toast = getToastUpdate()

        $('body').append(toast)

        const result = new Promise(function (resolve, reject) {
            $('#pwa-sw-reload-true').on('click', function(e) {
                e.preventDefault()
                resolve()
            });

            $('#pwa-sw-reload-false').on('click', function (e) {
                e.preventDefault()
                $('#toast-update-sw').removeClass('pwa-toast__show');
                reject()
            });
        })
        .then(() => true)
        .catch(() => false)

        return await result;
    }

    const showSkipWaitingPrompt = async (event) => {
        // Assuming the user accepted the update, set up a listener
        // that will reload the page as soon as the previously waiting
        // service worker has taken control.
        wb.addEventListener('controlling', () => {
            // At this point, reloading will ensure that the current
            // tab is loaded under the control of the new service worker.
            // Depending on your web app, you may want to auto-save or
            // persist transient state before triggering the reload.
            window.location.reload();
        });

        // When `event.wasWaitingBeforeRegister` is true, a previously
        // updated service worker is still waiting.
        // You may want to customize the UI prompt accordingly.

        // This code assumes your app has a promptForUpdate() method,
        // which returns true if the user wants to update.
        // Implementing this is app-specific; some examples are:
        // https://open-ui.org/components/alert.research or
        // https://open-ui.org/components/toast.research
        const updateAccepted = await promptForUpdate();

        if (updateAccepted) {
            wb.messageSkipWaiting();
        }
    };

    wb.addEventListener("installed", (event) => {
        if (!event.isUpdate) {
            // First-installed code goes here...
            console.log("sw установлен");
        }
    });

    wb.addEventListener("activated", (event) => {
        // `event.isUpdate` will be true if another version of the service
        // worker was controlling the page when this version was registered.
        if (!event.isUpdate) {
            console.log("Service worker activated for the first time!");

            // If your service worker is configured to precache assets, those
            // assets should all be available now.
        }
    });

    wb.addEventListener("waiting", (event) => {
        console.log(
            `A new service worker has installed, but it can't activate` +
            `until all tabs running the current version have fully unloaded.`
        );
    });

    wb.addEventListener("message", (event) => {
        if (event.data.type === "CACHE_UPDATED") {
            const { updatedURL } = event.data.payload;

            console.log(`A newer version of ${updatedURL} is available!`);
        }
    });

    wb.addEventListener("activated", (event) => {
        // Get the current page URL + all resources the page loaded.
        const urlsToCache = [
            location.href,
            ...performance.getEntriesByType("resource").map((r) => r.name),
        ];
        // Send that list of URLs to your router in the service worker.
        wb.messageSW({
            type: "CACHE_URLS",
            payload: { urlsToCache },
        });
    });

    // Add an event listener to detect when the registered
    // service worker has installed but is waiting to activate.
    wb.addEventListener("waiting", (event) => {
        showSkipWaitingPrompt(event);
    });

    wb.register();

    const swVersion = await wb.messageSW({ type: "GET_VERSION" });
    console.log("Service Worker version:", swVersion);

    const handleInstallPWA = () => {
        const showInstallPromotion = (deferred_prompt) => {
            const elems = document.querySelectorAll('.install-pwa')

            for (let i = 0; i < elems.length; i++) {
                const elem = elems[i];
                elem.style.opacity = '1'
                
                elem.addEventListener('click', async (e) => {
                    deferred_prompt.prompt()
                    
                    for (let j = 0; j < elems.length; j++) {
                        const el = elems[j];
                        el.style.opacity = '0'
                    }
                })
            }
        }

        // Initialize deferredPrompt for use later to show browser install prompt.
        let deferred_prompt;
        let is_show_install_promotion

        window.addEventListener('beforeinstallprompt', (e) => {
            if (!is_show_install_promotion) {
                // Prevent the mini-infobar from appearing on mobile
                e.preventDefault();
                // Stash the event so it can be triggered later.
                deferred_prompt = e;
                // Update UI notify the user they can install the PWA
                showInstallPromotion(deferred_prompt);
                is_show_install_promotion = true;
            }
            
            
        });
    }

    handleInstallPWA();
}
