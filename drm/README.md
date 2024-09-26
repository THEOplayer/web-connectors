# drm-connector-web

A collection of DRM connectors for the THEOplayer Web SDK:
- Axinom DRM
- Microsoft Azure DRM
- CastLabs DRMtoday
- Comcast DRM
- EZDRM (only for Fairplay, as Widevine and PlayReady can use the default implementation)
- Irdeto Control
- BuyDRM KeyOS
- Nagra DRM
- Vualto VuDRM
- Verimatrix MultiDRM Core DRM
- Arris Titanium DRM

## Installation

Install using your favorite package manager for Node (such as `npm` or `yarn`):

### Install via npm

```bash
npm install @theoplayer/drm-connector-web
```

### Install via yarn

```bash
yarn add @theoplayer/drm-connector-web
```

## Usage
First you need to add the one of the DRM connectors to your app.
This example uses Axinom DRM but this equivalent with all connectors:

* Add as a regular script

```html
<script type="text/javascript" src="path/to/drm-connector.umd.js"></script>
<script type="text/javascript">
    // This registers the Widevine connector for Axinom DRM.
    THEOplayer.registerContentProtectionIntegration(
        'axinom',
        'widevine',
        new THEOplayerDrmConnector.AxinomDrmWidevineContentProtectionIntegrationFactory()
    );
</script>
```

* Add as an ES2015 module

```html
<script type="module">
    import { AxinomDrmWidevineContentProtectionIntegrationFactory } from "path/to/drm-connector.esm.js";
    THEOplayer.registerContentProtectionIntegration(
        'axinom',
        'widevine',
        new AxinomDrmWidevineContentProtectionIntegrationFactory()
    );
</script>
```

To make use of the registered DRM connectors, you need :

```javascript
player.source = {
    sources: [
        {
            src: '<insert-your-stream-here>',
            contentProtection: {
                integration: 'axinom',
                integrationParameters: {
                    // This is specific for Axinom.
                    token: '<insert-your-axinom-token-here>'
                },
                widevine: { ... },
                playready: { ... },
                fairplay: { ... }
            }
        }
    ]
};
```
