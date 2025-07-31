import type { ChromelessPlayer, EndpointLoadedEvent, IntentToFallbackEvent } from 'theoplayer';
import { Constants, type VideoAnalytics } from '@convivainc/conviva-js-coresdk';
import { flattenErrorObject } from '../../utils/ErrorReportBuilder';

export class THEOliveReporter {
    private readonly player: ChromelessPlayer;
    private readonly convivaVideoAnalytics: VideoAnalytics;

    constructor(player: ChromelessPlayer, videoAnalytics: VideoAnalytics) {
        this.player = player;
        this.convivaVideoAnalytics = videoAnalytics;
        this.addEventListeners();
    }

    private readonly onEndpointLoaded = (event: EndpointLoadedEvent) => {
        const { endpoint } = event;
        this.convivaVideoAnalytics?.reportPlaybackEvent('endpointLoaded', endpoint);

        if (endpoint.cdn) {
            this.convivaVideoAnalytics?.setContentInfo({ [Constants.DEFAULT_RESOURCE]: endpoint.cdn });
        }
    };

    private readonly onIntentToFallback = (event: IntentToFallbackEvent) => {
        const { reason } = event;
        this.convivaVideoAnalytics?.reportPlaybackEvent('intentToFallback', flattenErrorObject(reason));
    };

    private addEventListeners(): void {
        this.player.theoLive?.addEventListener('endpointloaded', this.onEndpointLoaded);
        this.player.theoLive?.addEventListener('intenttofallback', this.onIntentToFallback);
    }

    private removeEventListeners(): void {
        this.player.theoLive?.removeEventListener('endpointloaded', this.onEndpointLoaded);
        this.player.theoLive?.removeEventListener('intenttofallback', this.onIntentToFallback);
    }

    destroy(): void {
        this.removeEventListeners();
    }
}
