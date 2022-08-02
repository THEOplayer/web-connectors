# conviva-connector-web

The Conviva connector provides a Conviva integration for THEOplayer.

## Prerequisites
In order to use this connector, a [THEOplayer](https://www.npmjs.com/package/theoplayer) build with a valid license is required. You can use your existing THEOplayer HTML5 SDK license or request yours via [THEOportal](https://portal.theoplayer.com/).

For setting up a valid Conviva session, you must have access to a [Conviva developer account](https://pulse.conviva.com/) with access to a debug or production key.

## Installation

Install using your favorite package manager for Node (such as `npm` or `yarn`):

### Install via npm

```bash
npm install @theoplayer/conviva-connector-web
```

### Install via yarn

```bash
yarn add @theoplayer/conviva-connector-web
```

## Usage

First you need to define the Conviva metadata and configuration:

```javascript
    const convivaMetadata = {
        ['Conviva.assetName']: 'ASSET_NAME_GOES_HERE',
        ['Conviva.streamUrl']: 'CUSTOMER_STREAM_URL_GOES_HERE',
        ['Conviva.streamType']: 'STREAM_TYPE_GOES_HERE', // VOD or LIVE
        ['Conviva.applicationName']: 'APPLICATION_NAME_GOES_HERE',
        ['Conviva.viewerId']: 'VIEWER_ID_GOES_HERE'
    };

    const convivaConfig = {
        debug: false,
        gatewayUrl: 'CUSTOMER_GATEWAY_GOES_HERE',
        customerKey: 'CUSTOMER_KEY_GOES_HERE' // Can be a test or production key.
    };
```

Using these configs you can create the Conviva connector with THEOplayer.

* Add as a regular script:

```html
<script type="text/javascript" src="path/to/conviva-connector.umd.js"></script>
<script type="text/javascript">
    const player = new THEOplayer.Player(element, configuration);
    const convivaIntegration = new THEOplayerConvivaConnector.ConvivaConnector(
            player,
            convivaMetadata,
            convivaConfig
    );
</script>
```

* Add as an ES2015 module:

```html
<script type="module">
    import { ConvivaConnector } from "path/to/conviva-connector.esm.js";
    const player = new THEOplayer.Player(element, configuration);
    const convivaIntegration = new ConvivaConnector(player, convivaMetadata, convivaConfig);
</script>
```

The Conviva connector is now ready to start a session once THEOplayer starts playing a source.

## Usage with Yospace connector

If you have a Yospace SSAI stream and want to also report ad related events to Conviva, you can use this connector in combination with the Yospace connector: [@theoplayer/yospace-connector-web](https://www.npmjs.com/package/@theoplayer/yospace-connector-web)

After configuring the Yospace connector, can pass it to the Conviva connector:

```javascript
async function setupYospaceConnector(player) {
        const yospaceConnector = new THEOplayerYospaceConnector.YospaceConnector(player);
        const source = {
            sources: [
                {
                    src: "https://csm-e-sdk-validation.bln1.yospace.com/csm/extlive/yospace02,hlssample42.m3u8?yo.br=true&yo.av=4",
                    ssai: {
                        integration: "yospace"
                    }
                }
            ]
        };
        const convivaConnector = new THEOplayerConvivaConnector.ConvivaConnector(
            player,
            convivaMetadata,
            convivaConfig,
            yospaceConnector
        );
        await yospaceConnector.setupYospaceSession(source);
    }
```
