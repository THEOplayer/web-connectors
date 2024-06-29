# gemius-connector-web

The Gemius connector provides a Gemius integration for THEOplayer.

## Installation

```sh
npm install @theoplayer/gemius-connector-web
```

Load the gplayer.js library from Gemius. There are two options to to this: either you do it synchronously:

```html
<script type="text/javascript" src="https://PREFIX.hit.gemius.pl/gplayer.js"></script>
```

... or asynchronously

```html
<script type="text/javascript">
<!--//--><![CDATA[//><!--
function gemius_pending(i) { window[i] = window[i] || function() {var x = window[i+'_pdata']
= window[i+'_pdata'] || []; x[x.length]=arguments;};};
gemius_pending('gemius_init');
function gemius_player_pending(obj,fun) {obj[fun] = obj[fun] || function() {var x =
window['gemius_player_data'] = window['gemius_player_data'] || [];
x[x.length]=[this,fun,arguments];};};
gemius_player_pending(window,"GemiusPlayer");
gemius_player_pending(GemiusPlayer.prototype,"newProgram");
gemius_player_pending(GemiusPlayer.prototype,"newAd");
gemius_player_pending(GemiusPlayer.prototype,"adEvent");
gemius_player_pending(GemiusPlayer.prototype,"programEvent");
gemius_player_pending(GemiusPlayer.prototype,"setVideoObject");
(function(d,t) {try {var gt=d.createElement(t),s=d.getElementsByTagName(t)[0],
l='http'+((location.protocol=='https:')?'s':''); gt.setAttribute('async','async');
gt.setAttribute('defer','defer'); gt.src=l+'://PREFIX.hit.gemius.pl/gplayer.js';
s.parentNode.insertBefore(gt,s);} catch (e) {}})(document,'script');
//--><!]]>
```

Make sure you replace `PREFIX` with the short string of letters specifying the
Gemius collecting server. It can be acquired as a part of the tracking code from gemiusPrism
interface ( in Settings / Scripts / Streaming Players) or from your local Gemius Tech Support
Department.

## Usage

### Configuring the connector

```js
import { GemiusConnector } from '../../dist/gemius-connector.esm.js';
// TODO
```

## Documentation

Documentation can be acquired through Gemius Prism.
