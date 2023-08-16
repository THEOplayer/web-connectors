# Common Media Client Data (CMCD) Connector for the THEOplayer HTML5/Tizen/webOS SDK

A connector between a THEOplayer instance and a Common Media Client Data (CMCD) server for the THEOplayer
HTML5/Tizen/webOS SDK. This implementation supports CMCD data as defined in CTA-5004, published in September 2020.

Note that when native playback is being used, either through THEOplayer's configuration, or due to absence of MSE/EME
APIs (such as on iOS Safari), the JSON Object transmission mode should be used.

All standardized reserved keys are reported, with the exception of:

- Object duration (`d`)
- Next object request (`nor`)
- Next range request (`nrr`)

An extension of these keys are planned.

Beyond these keys, the following keys are also sent out:

- Request ID (`org.svalabs-rid`). A GUID identifying the current request. Every request will automatically receive a new
  GUID automatically.
- Current Manifest Index (`org.svalabs-cmi`). The 1-based index of the CMAF Track, of which the currently loading object
  is a part, in the sorted list of all tracks in the associated Aligned CMAF Switching Set. This list is sorted as
  follows:
    - In ascending order of the protocol's perceptual quality score (if available),
    - In ascending order of the Track's bandwidth,
    - In ascending order of the order as present in the stream Manifests.
- Playable Manifest Index (`org.svalabs-pmi`). The number of CMAF Tracks, of which the currently loading object is a
  part, in the sorted list of all tracks in the associated Aligned CMAF Switching Set.
- Track Identifier (`org.svalabs-tid`). The identifier of the Aligned CMAF Switching Set to which the currently loading
  object belongs. Its value must be unique across the current viewer session for all different Aligned CMAF Switching
  Sets and should (if available) be the identifier in the CMAF Manifest.

## Installation

Simply install using npm.

```
npm install
```

## Building

The project is built through Webpack. A shorthand is available as:

```
npm run build
```

When running, a distributable file will be generated in the `dist` folder.

## Testing

Tests run through Jasmin to validate the correctness of the CMCD format. A shorthand is available as:

```
npm run test
```

## Usage

To use the library, simply import and create a new `Connector` with the right `Configuration` and a THEOplayer instance:

```javascript
    const connector = new THEOplayerCMCDConnector.createCMCDConnector(player, configuration);
```

For the `Configuration` definition and other APIs, please see the TSDoc in the respective classes. The connector will be
automatically destroyed upon destruction of the provided player. When changing the player source and a content ID is
being passed in, this is to be reset through `reconfigure()` as it will not be cleared automatically.
