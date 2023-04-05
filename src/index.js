import './pwa-sw.js'
import './js/pwa-parser.js'
import './js/pwa-sw-register.js'
import './libs/workbox/workbox-v6.5.4/workbox-sw.js'
import './js/jquery-1.11.1.min.js'

import './css/style.css'

import './manifest.json'

import './partial/header.html'
import './partial/footer.html'

import './offline.html'

function importAll(r) {
    return r.keys().map(r);
  }
  
  const images = importAll(require.context('./images/manifest/', false, /\.(png|jpe?g|svg)$/));