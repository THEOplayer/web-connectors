import { ChromelessPlayer } from 'theoplayer';
import { ConvivaMetadata } from '@convivainc/conviva-js-coresdk';
import { YospaceConnector } from '@theoplayer/yospace-connector-web';
import { ConvivaConfiguration, ConvivaHandler } from './ConvivaHandler';

export class ConvivaConnector {

    private convivaHandler: ConvivaHandler;

    constructor(player: ChromelessPlayer, convivaMetadata: ConvivaMetadata, convivaConfig: ConvivaConfiguration) {
        this.convivaHandler = new ConvivaHandler(player, convivaMetadata, convivaConfig);
    }

    /**
     * Optionally connects the ConvivaConnector to the YospaceConnector to report SSAI.
     * @param connector the YospaceConnector
     */
    connect(connector: YospaceConnector): void {
        this.convivaHandler.connect(connector);
    }

    /**
     * Sets Conviva metadata on the Conviva video analytics.
     * @param metadata object of key value pairs
     */
    setContentInfo(metadata: ConvivaMetadata): void {
        this.convivaHandler.setContentInfo(metadata);
    }

    /**
     * Sets Conviva metadata on the Conviva ad analytics.
     * @param metadata object of key value pairs
     */
    setAdInfo(metadata: ConvivaMetadata): void {
        this.convivaHandler.setAdInfo(metadata);
    }

    /**
     * Sets an error to the conviva session and closes the session.
     * @param errorMessage string explaining what the error is.
     */
    reportPlaybackFailed(errorMessage: string): void {
        this.convivaHandler.reportPlaybackFailed(errorMessage);
    }

    /**
     * Stops video and ad analytics and closes all sessions.
     */
    destroy(): void {
        this.convivaHandler.destroy();
    }
}
