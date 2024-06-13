import {
    AdBreakEvent,
    AdEvent,
    ChromelessPlayer,
    EndedEvent,
    LoadedMetadataEvent,
    PauseEvent,
    PlayEvent,
    PlayingEvent,
    RateChangeEvent,
    SeekedEvent,
    SeekingEvent,
    SourceChangeEvent,
    WaitingEvent,
    ErrorEvent,
    version
} from 'theoplayer';
import { ComscoreConfiguration } from '../api/ComscoreConfiguration';
import { ComscoreMetadata } from '../api/ComscoreMetadata';
import { buildContentMetadata } from './ComscoreContentMetadata';
import { toMilliSeconds } from './Utils';

const LOG_STATE_CHANGES = true;
const LOG_THEOPLAYER_EVENTS = true;
const LOG_STREAMINGANALYTICS = true;

enum ComscoreState {
    INITIALIZED = 'INITIALIZED',
    ADVERTISEMENT = 'ADVERTISEMENT',
    ADVERTISEMENT_PAUSED = 'ADVERTISEMENT_PAUSED',
    VIDEO = 'VIDEO',
    VIDEO_PAUSED = 'VIDEO_PAUSED',
    STOPPED = 'STOPPED'
}

enum AdBreakType {
    PRE_ROLL,
    MID_ROLL,
    POST_ROLL
}

export class ComscoreStreamingAnalyticsTHEOIntegration {
    // References for constructor arguments
    private player: ChromelessPlayer;
    private configuration: ComscoreConfiguration;
    private metadata: ComscoreMetadata;

    // Playback state managed by the integration
    private state: ComscoreState = ComscoreState.INITIALIZED;
    private buffering: boolean = false;
    private ended: boolean = false;

    // Comscore library handles
    private analytics = ns_.analytics;
    private streamingAnalytics = new this.analytics.StreamingAnalytics();

    // Copy of main content's ContentMetadata
    private contentMetadata: ns_.analytics.StreamingAnalytics.ContentMetadata | null = null;

    // Main content related fields for use outside of event handlers
    private dvrWindowLengthMs: number | undefined = undefined 
    private dvrWindowOffsetMs: number | undefined = undefined

    // Advertisement related fields for use outside of ad event handlers
    private inAd: boolean = false;
    private lastAdId: string | undefined = undefined;
    private lastAdDuration: number | undefined = undefined;
    private lastAdBreakType: AdBreakType | undefined = undefined;

    constructor(player: ChromelessPlayer, configuration: ComscoreConfiguration, metadata: ComscoreMetadata) {
        this.player = player;
        this.configuration = configuration;
        this.metadata = metadata;

        this.streamingAnalytics.setMediaPlayerName('THEOplayer');
        this.streamingAnalytics.setMediaPlayerVersion(version);

        this.addListeners();
    }

    // PUBLIC methods
    public update(metadata: ComscoreMetadata) {
        this.metadata = metadata;
        this.contentMetadata = null;
    }

    public destroy() {
        this.removeListeners();
    }

    private addListeners(): void {
        this.player.addEventListener('sourcechange', this.onSourceChange);
        this.player.addEventListener('play', this.onPlay);
        this.player.addEventListener('ended', this.onEnded);
        this.player.addEventListener('error', this.onError);
        this.player.addEventListener('loadedmetadata', this.onLoadedMetadata);
        this.player.addEventListener('playing', this.onPlaying);
        this.player.addEventListener('seeking', this.onSeeking);
        this.player.addEventListener('seeked', this.onSeeked);
        this.player.addEventListener('pause', this.onPause);
        this.player.addEventListener('ratechange', this.onRateChange);
        this.player.addEventListener('waiting', this.onWaiting);

        if (this.player.ads) {
            this.player.ads.addEventListener('adbegin', this.onAdBegin);
            this.player.ads.addEventListener('adend', this.onAdEnd);
            this.player.ads.addEventListener('adbreakend', this.onAdBreakEnd);
        }
    }

    private removeListeners(): void {
        this.player.removeEventListener('sourcechange', this.onSourceChange);
        this.player.removeEventListener('play', this.onPlay);
        this.player.removeEventListener('ended', this.onEnded);
        this.player.removeEventListener('error', this.onError);
        this.player.removeEventListener('loadedmetadata', this.onLoadedMetadata);
        this.player.removeEventListener('playing', this.onPlaying);
        this.player.removeEventListener('seeking', this.onSeeking);
        this.player.removeEventListener('seeked', this.onSeeked);
        this.player.removeEventListener('pause', this.onPause);
        this.player.removeEventListener('ratechange', this.onRateChange);
        this.player.removeEventListener('waiting', this.onWaiting);

        if (this.player.ads) {
            this.player.ads.removeEventListener('adbegin', this.onAdBegin);
            this.player.ads.removeEventListener('adend', this.onAdEnd);
            this.player.ads.removeEventListener('adbreakend', this.onAdBreakEnd);
        }
    }

    private setContentMetadata(): void {
        const contentMetadata = buildContentMetadata(this.metadata);
        this.contentMetadata = contentMetadata;
        if (this.configuration.debug && LOG_STREAMINGANALYTICS) {
            console.log(`[COMSCORE - StreamingAnalytics] setMetadata (content)`, contentMetadata.getMetadataLabels());
        }
        this.streamingAnalytics.setMetadata(contentMetadata);
    }

    private setAdMetadata(adDuration: number, adBreakType: AdBreakType, adId: string): void {
        const adMetadata = new this.analytics.StreamingAnalytics.AdvertisementMetadata();
        if (this.player.duration === Infinity) {
            adMetadata.setMediaType(this.analytics.StreamingAnalytics.AdvertisementMetadata.AdvertisementType.LIVE);
        } else if (adBreakType === AdBreakType.PRE_ROLL) {
            adMetadata.setMediaType(
                this.analytics.StreamingAnalytics.AdvertisementMetadata.AdvertisementType.ON_DEMAND_PRE_ROLL
            );
        } else if (adBreakType === AdBreakType.POST_ROLL) {
            adMetadata.setMediaType(
                this.analytics.StreamingAnalytics.AdvertisementMetadata.AdvertisementType.ON_DEMAND_POST_ROLL
            );
        } else {
            adMetadata.setMediaType(
                this.analytics.StreamingAnalytics.AdvertisementMetadata.AdvertisementType.ON_DEMAND_MID_ROLL
            );
        }
        adMetadata.setUniqueId(adId);
        adMetadata.setLength(adDuration);

        if (!this.contentMetadata) {
            this.contentMetadata = buildContentMetadata(this.metadata);
        }
        adMetadata.setRelatedContentMetadata(this.contentMetadata);
        if (this.configuration.debug && LOG_STREAMINGANALYTICS) {
            console.log(`[COMSCORE - StreamingAnalytics] setMetadata (advertisement)`, adMetadata.getMetadataLabels());
        }
        this.streamingAnalytics.setMetadata(adMetadata);
    }

    // STATE TRANSITIONS
    private transitionToVideo(): void {
        if (this.configuration.debug && LOG_STATE_CHANGES)
            console.log(`[COMSCORE - STATE] Trying to transition to VIDEO while in ${this.state}`);
        switch (this.state) {
            case ComscoreState.INITIALIZED:
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] State change ${this.state} -> VIDEO`);
                this.state = ComscoreState.VIDEO;
                this.setContentMetadata();
                break;
            case ComscoreState.ADVERTISEMENT:
            case ComscoreState.ADVERTISEMENT_PAUSED:
            case ComscoreState.STOPPED:
                this.transitionToStopped();
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] State change ${this.state} -> VIDEO`);
                this.state = ComscoreState.VIDEO;
                this.setContentMetadata();
                break;
            case ComscoreState.VIDEO_PAUSED:
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] State change ${this.state} -> VIDEO`);
                this.state = ComscoreState.VIDEO;
                break;
            case ComscoreState.VIDEO:
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] Ignoring transition from ${this.state} -> VIDEO`);
                break;
            default:
                break;
        }
    }

    private transitionToAdvertisement(): void {
        if (this.configuration.debug && LOG_STATE_CHANGES)
            console.log(`[COMSCORE - STATE] Trying to transition to ADVERTISEMENT while in ${this.state}`);
        switch (this.state) {
            case ComscoreState.INITIALIZED:
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] State change ${this.state} -> ADVERTISEMENT`);
                this.state = ComscoreState.ADVERTISEMENT;
                this.setAdMetadata(
                    this.lastAdDuration ?? 0,
                    this.lastAdBreakType ?? AdBreakType.PRE_ROLL,
                    this.lastAdId ?? ''
                );
                break;
            case ComscoreState.VIDEO:
            case ComscoreState.VIDEO_PAUSED:
            case ComscoreState.STOPPED:
                this.transitionToStopped();
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] State change ${this.state} -> ADVERTISEMENT`);
                this.state = ComscoreState.ADVERTISEMENT;
                this.setAdMetadata(
                    this.lastAdDuration ?? 0,
                    this.lastAdBreakType ?? AdBreakType.PRE_ROLL,
                    this.lastAdId ?? ''
                );
                break;
            case ComscoreState.ADVERTISEMENT_PAUSED:
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] State change ${this.state} -> ADVERTISEMENT`);
                this.state = ComscoreState.ADVERTISEMENT;
                break;
            case ComscoreState.ADVERTISEMENT:
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] Ignoring transition from ${this.state} -> ADVERTISEMENT`);
                break;
            default:
                break;
        }
    }

    private transitionToPaused(): void {
        if (this.configuration.debug && LOG_STATE_CHANGES)
            console.log(`[COMSCORE - STATE] Trying to transition to XXXXX_PAUSED while in ${this.state}`);
        switch (this.state) {
            case ComscoreState.VIDEO:
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] State change ${this.state} -> VIDEO_PAUSED`);
                this.state = ComscoreState.VIDEO_PAUSED;
                this.streamingAnalytics.notifyPause();
                if (this.configuration.debug && LOG_STREAMINGANALYTICS)
                    console.log(`[COMSCORE - StreamingAnalytics] notifyPause`);
                break;
            case ComscoreState.ADVERTISEMENT:
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] State change ${this.state} -> ADVERTISEMENT_PAUSED`);
                this.state = ComscoreState.ADVERTISEMENT_PAUSED;
                this.streamingAnalytics.notifyPause();
                if (this.configuration.debug && LOG_STREAMINGANALYTICS)
                    console.log(`[COMSCORE - StreamingAnalytics] notifyPause`);
                break;
            default:
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] Ignoring transition from ${this.state} -> XXXXX_PAUSED`);
        }
    }

    private transitionToStopped(): void {
        if (this.configuration.debug && LOG_STATE_CHANGES)
            console.log(`[COMSCORE - STATE] Trying to transition to STOPPED while in ${this.state}`);
        switch (this.state) {
            case ComscoreState.STOPPED:
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] Ignoring transition from ${this.state} -> STOPPED`);
                break;
            default:
                if (this.configuration.debug && LOG_STATE_CHANGES)
                    console.log(`[COMSCORE - STATE] State change ${this.state} -> STOPPED`);
                this.state = ComscoreState.STOPPED;
                this.streamingAnalytics.notifyEnd();
                if (this.configuration.debug && LOG_STREAMINGANALYTICS)
                    console.log(`[COMSCORE - StreamingAnalytics] notifyEnd`);
        }
    }

    // EVENT HANDLERS
    private onSourceChange = (event: SourceChangeEvent) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        this.state = ComscoreState.INITIALIZED;
        this.contentMetadata = null;
        this.dvrWindowLengthMs = undefined;
        this.dvrWindowOffsetMs = undefined;
        this.streamingAnalytics.createPlaybackSession();
        if (this.configuration.debug && LOG_STREAMINGANALYTICS)
            console.log(`[COMSCORE - StreamingAnalytics] createPlaybackSession`);
    };

    private onPlay = (event: PlayEvent) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        if (this.ended) {
            this.ended = false;
            if (this.configuration.debug) console.log(`[COMSCORE] play event after the stream ended`);
            this.streamingAnalytics.createPlaybackSession();
            if (this.configuration.debug && LOG_STREAMINGANALYTICS)
                console.log(`[COMSCORE - StreamingAnalytics] createPlaybackSession`);
        }
    };

    private onPlaying = (event: PlayingEvent) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        if (this.buffering) {
            this.buffering = false;
            this.streamingAnalytics.notifyBufferStop();
            if (this.configuration.debug && LOG_STREAMINGANALYTICS)
                console.log(`[COMSCORE - StreamingAnalytics] notifyBufferStop`);
        }

        const { currentTime } = event;

        if (this.inAd) {
            this.transitionToAdvertisement();
        } else if (this.isAfterPostRoll()) {
            if (this.configuration.debug)
                console.log(`[COMSCORE] Ignore playing event after post-roll (currentTime ${currentTime})`);
            return;
        } else if (this.isBeforePreRoll()) {
            if (this.configuration.debug)
                console.log(`[COMSCORE] Ignore playing event before pre-roll (currentTime ${currentTime})`);
            return;
        } else if (currentTime < 1 && this.ended === true) {
            this.ended = false;
            if (this.configuration.debug) console.log(`[COMSCORE] playing event after the stream ended`);
            this.streamingAnalytics.createPlaybackSession();
            if (this.configuration.debug && LOG_STREAMINGANALYTICS)
                console.log(`[COMSCORE - StreamingAnalytics] createPlaybackSession`);
            this.transitionToVideo();
        } else {
            this.transitionToVideo();
        }
        this.streamingAnalytics.notifyPlay();
        if (this.configuration.debug && LOG_STREAMINGANALYTICS)
            console.log(`[COMSCORE - StreamingAnalytics] notifyPlay`);
    };

    private onEnded = (event: EndedEvent) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        this.transitionToStopped();
        this.ended = true;
    };

    private onError = (event: ErrorEvent) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        this.transitionToStopped();
    };

    private onLoadedMetadata = (event: LoadedMetadataEvent) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        if (!this.inAd && this.state === ComscoreState.ADVERTISEMENT && !this.isAfterPostRoll()) {
            this.transitionToVideo();
        }
        if (this.metadata.length === 0 && !this.inAd) {
            if (this.configuration.debug) console.log(`[COMSCORE] LIVE stream detected`);
            try {
                const { seekable } = this.player;
                if (seekable.length) {
                    const dvrWindowEnd = seekable.end(seekable.length - 1);
                    const dvrWindowStart = seekable.start(0);
                    const dvrWindowLengthInSeconds = dvrWindowEnd - dvrWindowStart;
                    if (dvrWindowLengthInSeconds) {
                        this.dvrWindowLengthMs = toMilliSeconds(dvrWindowLengthInSeconds)
                    if (this.state === ComscoreState.VIDEO || this.state === ComscoreState.VIDEO_PAUSED) this.streamingAnalytics.setDvrWindowLength(this.dvrWindowLengthMs)
                    } else if (this.configuration.debug) console.log(`[COMSCORE] DVR window length was not > 0`);
                }
            } catch (error) {
                if (this.configuration.debug)
                    console.log(
                        `[COMSCORE] There was a problem inspecting the seekable ranges on the loadedmetadata event`
                    );
            }
        }
    };

    private onSeeking = (event: SeekingEvent) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        this.streamingAnalytics.notifySeekStart();
        if (this.configuration.debug && LOG_STREAMINGANALYTICS)
            console.log(`[COMSCORE - StreamingAnalytics] notifySeekStart`);
    };

    private onSeeked = (event: SeekedEvent) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        if (!this.inAd && this.state === ComscoreState.ADVERTISEMENT) {
            this.transitionToVideo();
        }
        const { currentTime } = event;

        if (this.player.duration === Infinity) {
            if (this.configuration.debug) console.log(`[COMSCORE] seeked in a LIVE stream`);
            const { seekable } = this.player;
            if (!seekable.length) {
                if (this.configuration.debug)
                    console.log(`[COMSCORE] no seekable ranges found when determining DVR window offset`);
                return;
            }
            const dvrWindowEnd = seekable.end(seekable.length - 1);
            const dvrWindowOffsetInSeconds = dvrWindowEnd - currentTime;
            this.dvrWindowOffsetMs = toMilliSeconds(dvrWindowOffsetInSeconds)
            if (this.state === ComscoreState.VIDEO || this.state === ComscoreState.VIDEO_PAUSED) {
                this.streamingAnalytics.startFromDvrWindowOffset(this.dvrWindowOffsetMs);
                if (this.configuration.debug && LOG_STREAMINGANALYTICS)
                    console.log(
                        `[COMSCORE - StreamingAnalytics] startFromDvrWindowOffset ${this.dvrWindowOffsetMs}`
                    );
            }
        } else {
            if (this.configuration.debug) console.log(`[COMSCORE] seeked in a VOD stream`);
            const currentTimeInMilliSeconds = toMilliSeconds(currentTime)
            this.streamingAnalytics.startFromPosition(currentTimeInMilliSeconds);
            if (this.configuration.debug && LOG_STREAMINGANALYTICS)
                console.log(`[COMSCORE - StreamingAnalytics] startFromPosition ${currentTimeInMilliSeconds}`);
        }
    };

    private onPause = (event: PauseEvent) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        this.transitionToPaused();
    };

    private onAdBegin = (event: AdEvent<'adbegin'>) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        const { ad } = event;
        const { adIdProcessor } = this.configuration;

        this.inAd = true;
        this.lastAdBreakType = this.findAdBreakType(
            ad.adBreak.timeOffset,
            ad.adBreak.maxDuration ?? 0,
            ad.adBreak.integration ?? ''
        );
        this.lastAdId = adIdProcessor ? adIdProcessor(ad) : ad.id;
        this.lastAdDuration = toMilliSeconds(ad.duration ?? 0);
        if (!this.lastAdDuration && this.configuration.debug) {
            console.log('[COMSCORE] AD_BEGIN event with an ad duration of 0 found. Please check the ad configuration');
        }
        if (!this.lastAdId && this.configuration.debug) {
            console.log('[COMSCORE] AD_BEGIN event with an empty ad id found. Please check the ad configuration');
        }
        if (this.isPlayingGoogleDAISource()) {
            this.transitionToAdvertisement();
            this.streamingAnalytics.notifyPlay();
            if (this.configuration.debug && LOG_STREAMINGANALYTICS)
                console.log(`[COMSCORE - StreamingAnalytics] notifyPlay`);
        }
    };

    private onAdEnd = (event: AdEvent<'adend'>) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        this.transitionToStopped();
    }

    private onAdBreakEnd = (event: AdBreakEvent<'adbreakend'>) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        this.inAd = false;
    };

    private onRateChange = (event: RateChangeEvent) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        this.streamingAnalytics.notifyChangePlaybackRate(event.playbackRate);
        if (this.configuration.debug && LOG_STREAMINGANALYTICS)
            console.log(`[COMSCORE - StreamingAnalytics] notifyChangePlaybackRate ${event.playbackRate}`);
    };

    private onWaiting = (event: WaitingEvent) => {
        if (this.configuration.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        if (
            (this.state === ComscoreState.ADVERTISEMENT && this.inAd) ||
            (this.state === ComscoreState.VIDEO && !this.inAd)
        ) {
            this.buffering = true;
            this.streamingAnalytics.notifyBufferStart();
            if (this.configuration.debug && LOG_STREAMINGANALYTICS)
                console.log(`[COMSCORE - StreamingAnalytics] notifyBufferStart`);
        }
    };

    private findAdBreakType = (offset: number, maxDuration: number, integration: string): AdBreakType => {
        if (offset === 0) {
            if (this.configuration.debug) console.log('[COMSCORE] Mark as PRE_ROLL');
            return AdBreakType.PRE_ROLL;
        }

        switch (integration) {
            case 'google-ima':
            case 'theo':
                if (offset === -1) {
                    if (this.configuration.debug) console.log('[COMSCORE] Mark as POST_ROLL');
                    return AdBreakType.POST_ROLL;
                }
                if (this.configuration.debug) console.log('[COMSCORE] Mark as MID_ROLL');
                return AdBreakType.MID_ROLL;
            case 'google-dai':
                if (this.player.duration - (offset + maxDuration) <= 0) {
                    if (this.configuration.debug) console.log('[COMSCORE] Mark as POST_ROLL');
                    return AdBreakType.POST_ROLL;
                }
                if (this.configuration.debug) console.log('[COMSCORE] Mark as MID_ROLL');
                return AdBreakType.MID_ROLL;

            default:
                if (this.configuration.debug)
                    console.log('[COMSCORE] Untested ad integration used, please contact THEOplayer');
                return AdBreakType.MID_ROLL;
        }
    };

    private isBeforePreRoll = (): boolean =>
        this.player.ads?.scheduledAdBreaks.length ? this.player.ads?.scheduledAdBreaks[0].timeOffset === 0 : false;
    // private isAfterPostRoll = () => this.lastAdBreakOffset && this.lastAdBreakOffset < 0 && this.player.duration - this.player.currentTime < 1
    private isAfterPostRoll = (): boolean =>
        this.lastAdBreakType ? this.lastAdBreakType === AdBreakType.POST_ROLL : false;
    private isPlayingGoogleDAISource = (): boolean => this.player.ads?.currentAdBreak?.integration === 'google-dai';
}
