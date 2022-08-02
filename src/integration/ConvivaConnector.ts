import { ChromelessPlayer } from 'theoplayer';
import { ConvivaMetadata } from '@convivainc/conviva-js-coresdk';
import { YospaceConnector } from '@theoplayer/yospace-connector-web';
import { ConvivaConfiguration, ConvivaHandler } from './ConvivaHandler';

export class ConvivaConnector {
    private player: ChromelessPlayer;

    private convivaHandler: ConvivaHandler;

    constructor(player: ChromelessPlayer, convivaMetadata: ConvivaMetadata, convivaConfig: ConvivaConfiguration) {
        this.player = player;
        this.convivaHandler = new ConvivaHandler(player, convivaMetadata, convivaConfig);
    }

    /**
     * Optionally connects the ConvivaConnector to the YospaceConnector to report SSAI.
     * @param connector the YospaceConnector
     */
    connect(connector: YospaceConnector) {
        this.convivaHandler.connect(connector);
    }

    /**
     * Stops video and ad analytics and closes all sessions.
     */
    destroy(): void {
        this.convivaHandler.destroy();
    }
}
