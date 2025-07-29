import type { ChromelessPlayer, EndpointLoadedEvent } from 'theoplayer';
import { type ConvivaMetadata, type VideoAnalytics } from '@convivainc/conviva-js-coresdk';

export class THEOliveReporter {
    private readonly player: ChromelessPlayer;
    private readonly convivaVideoAnalytics: VideoAnalytics;
    private readonly stopandStartNewSession: (metadata: ConvivaMetadata) => void;

    constructor(
        player: ChromelessPlayer,
        videoAnalytics: VideoAnalytics,
        stopandStartNewSession: (metadata: ConvivaMetadata) => void
    ) {
        this.player = player;
        this.convivaVideoAnalytics = videoAnalytics;
        this.stopandStartNewSession = stopandStartNewSession;
        this.addEventListeners();
    }

    private readonly onEndpointLoaded = (event: EndpointLoadedEvent) => {
        console.debug('onEndpointLoaded', event);
        this.convivaVideoAnalytics?.reportPlaybackEvent('endpointLoaded', { cdn: '' });
    };

    private readonly onIntentToFallback = (event: any) => {
        console.debug('onIntentToFallback', event);
        //this.stopandStartNewSession({});
        this.convivaVideoAnalytics?.reportPlaybackEvent('intentToFallback', {});
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
