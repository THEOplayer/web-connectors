# yospace-connector-web

The Yospace connector provides a Yospace integration for THEOplayer.

## Prerequisites

In order to use this connector, a [THEOplayer](https://www.npmjs.com/package/theoplayer) build with a valid license is required. You can use your existing THEOplayer HTML5 SDK license or request yours via [THEOportal](https://portal.theoplayer.com/).

For setting up a valid Yospace session, the Yospace Ad Management SDK is required. For more information on how to install the Ad Management SDK, please refer to the documentation of [Yospace](https://developer.yospace.com/).

**Remark:** This version of the Yospace Connector is compatible with Yospace Ad Management SDK version 3.5.2 or higher. If you still want to use an older Ad Management SDK, please use the connector version 1.4.0.

## Installation

Install using your favorite package manager for Node (such as `npm` or `yarn`).

You'll also need to add the `@yospace/admanagement-sdk` package as a dependency of your app.
Refer to [the Yospace documentation](https://developer.yospace.com/sdk-documentation/javascript/api/yosdk/latest/index.html) on how to connect to the Yospace npm registry.

-   npm

    ```bash
    npm install @theoplayer/yospace-connector-web @yospace/admanagement-sdk
    ```

-   yarn

    ```bash
    yarn add @theoplayer/yospace-connector-web @yospace/admanagement-sdk
    ```

## Usage

First you need to add the Yospace connector to your app:

-   Add as a regular script

    ```html
    <script src="path/to/admanagement-sdk.min.js"></script>
    <script src="path/to/yospace-connector.umd.js"></script>
    <script>
        const player = new THEOplayer.Player(element, configuration);
        const yospaceConnector = new THEOplayerYospaceConnector.YospaceConnector(player);
    </script>
    ```

-   Add as an ES2015 module

    ```javascript
    import { YospaceConnector } from 'path/to/yospace-connector.esm.js';
    const player = new THEOplayer.Player(element, configuration);
    const yospaceConnector = new YospaceConnector(player);
    ```

    The connector will load the Yospace library by importing from `@yospace/admanagement-sdk`.
    You may need to configure your app's bundler in order to point `@yospace/admanagement-sdk`
    to the correct location (`admanagement-sdk.min.js`).

To make use of the Yospace integration, you need to set up a session for your Yospace source :

```javascript
const source = {
    sources: [
        {
            src: 'YOUR_YOSPACE_SRC',
            ssai: {
                integration: 'yospace'
                // If necessary, you can define your streamType.
                // streamType: 'vod' | 'live' | 'livepause'
            }
        }
    ]
};

await yospaceConnector.setupYospaceSession(source);
```

If you want to customize your session, you can also pass your customized `SessionProperties` from the Yospace Ad Management SDK :

```javascript
// create a new SessionProperties object using the Ad Management SDK.
const sessionProperties = new YospaceAdManagement.SessionProperties();
const source = {
    sources: [
        {
            src: 'YOUR_YOSPACE_SRC',
            ssai: {
                integration: 'yospace'
                // If necessary, you can define your streamType.
                // streamType: 'vod' | 'live' | 'livepause'
            }
        }
    ]
};

await yospaceConnector.setupYospaceSession(source, sessionProperties);
```

Once the setup of the Yospace session is done, you can continue to use the player and the connector will handle everything related to Yospace.
