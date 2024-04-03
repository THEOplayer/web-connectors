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
     * Reports an error to the Conviva session and closes the session.
     * @param errorMessage string explaining what the error is.
     */
    reportPlaybackFailed(errorMessage: string): void {
        this.convivaHandler.reportPlaybackFailed(errorMessage);
    }

    /**
     * Reports a custom event to the current Conviva session.
     * @param eventType the type of the custom event.
     * @param eventDetail an optional object containing event details.
     */
    reportPlaybackEvent(eventType: string, eventDetail?: object): void {
        this.convivaHandler.reportPlaybackEvent(eventType, eventDetail);
    }

    /**
     * Explicitly stop the current session and start a new one.
     *
     * This can be used to manually mark the start of a new session during a live stream,
     * for example when a new program starts.
     * By default, new sessions are only started on play-out of a new source, or for an ad break.
     *
     * @param metadata object of key value pairs.
     */
    stopAndStartNewSession(metadata: ConvivaMetadata): void {
        this.convivaHandler.stopAndStartNewSession(metadata);
    }

    /**
     * Stops video and ad analytics and closes all sessions.
     */
    destroy(): void {
        this.convivaHandler.destroy();
    }
}
