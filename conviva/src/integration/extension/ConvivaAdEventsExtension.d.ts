import type { AdsEventMap, EventDispatcher } from 'theoplayer';

declare module 'theoplayer' {
    interface Ads extends EventDispatcher<AdsEventMap> {
        convivaAdEventsExtension?: EventDispatcher<AdsEventMap>;
    }
    class ChromelessPlayer {
        ads?: Ads;
    }
}
