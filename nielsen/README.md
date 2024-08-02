# Nielsen Web Connector

A connector implementing Nielsen with THEOplayer.

## Installation

```sh
npm install @theoplayer/nielsen-connector-web
```

## Usage

### Configuring the connector

Create the connector by providing the `THEOplayer` instance, the Nielsen App ID, the channelName for the asset 
and optionally some Nielsen configuration.

```js
import {NielsenConnector} from "../../dist/THEOplayerNielsenConnector";

const appId = '<your app ID>';
const channelName = '<your channel name>';
// Optional
const options: NielsenOptions = {
    containerId: 'THEOplayer', 
    optout: false
}
const nielsenConnector = new NielsenConnector(player, appId, channelName, options);
```

The `NielsenOptions` can have the following fields:

| Key             | Value                                                           |
|-----------------|-----------------------------------------------------------------|
| ` containerId ` | HTML DOM element id of the player container.                    |
| ` nol_sdkDebug` | Enables Debug Mode which allows output to be viewed in console. |
| ` optout `      | Whether to opt-out of Nielsen Measurement.                      |

### Passing metadata dynamically

The connector allows updating the current asset's metadata at any time:

```js
const metadata = {
    ['channelName']: 'newChannelName',
    ['customTag1']: 'customValue1',
    ['customTag2']: 'customValue2'    
}
nielsenConnector.updateMetadata(metadata);
```
