import type { ChromelessPlayer, EndpointLoadedEvent, IntentToFallbackEvent } from 'theoplayer';
import { type VideoAnalytics } from '@convivainc/conviva-js-coresdk';

export class THEOliveReporter {
    private readonly player: ChromelessPlayer;
    private readonly convivaVideoAnalytics: VideoAnalytics;

    constructor(player: ChromelessPlayer, videoAnalytics: VideoAnalytics) {
        this.player = player;
        this.convivaVideoAnalytics = videoAnalytics;
        this.addEventListeners();
    }

    private readonly onEndpointLoaded = (event: EndpointLoadedEvent) => {
        console.debug('onEndpointLoaded', event);
        const { endpoint } = event;
        this.convivaVideoAnalytics?.reportPlaybackEvent('endpointLoaded', endpoint);
    };

    private readonly onIntentToFallback = (event: IntentToFallbackEvent) => {
        console.debug('onIntentToFallback', event);
        const { reason } = event;
        this.convivaVideoAnalytics?.reportPlaybackEvent('intentToFallback', reason);
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
