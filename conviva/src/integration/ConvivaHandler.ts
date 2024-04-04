import type { ChromelessPlayer, SourceDescription, VideoQuality } from 'theoplayer';
import {
    type AdAnalytics,
    Analytics,
    Constants,
    type ConvivaMetadata,
    type VideoAnalytics
} from '@convivainc/conviva-js-coresdk';
import type { YospaceConnector } from '@theoplayer/yospace-connector-web';
import { CONVIVA_CALLBACK_FUNCTIONS } from './ConvivaCallbackFunctions';
import {
    calculateBufferLength,
    calculateConvivaOptions,
    collectContentMetadata,
    collectDeviceMetadata,
    collectPlayerInfo,
    flattenAndStringifyObject
} from '../utils/Utils';
import { AdReporter } from './ads/AdReporter';
import { YospaceAdReporter } from './ads/YospaceAdReporter';
import { VerizonAdReporter } from './ads/VerizonAdReporter';

export interface ConvivaConfiguration {
    customerKey: string;
    debug?: boolean;
    gatewayUrl?: string;
}

export class ConvivaHandler {
    private readonly player: ChromelessPlayer;
    private readonly convivaMetadata: ConvivaMetadata;
    private readonly convivaConfig: ConvivaConfiguration;
    private customMetadata: ConvivaMetadata = {};

    private convivaVideoAnalytics: VideoAnalytics | undefined;
    private convivaAdAnalytics: AdAnalytics | undefined;

    private adReporter: AdReporter | undefined;
    private yospaceAdReporter: YospaceAdReporter | undefined;
    private verizonAdReporter: VerizonAdReporter | undefined;

    private currentSource: SourceDescription | undefined;
    private playbackRequested: boolean = false;

    private yospaceConnector: YospaceConnector | undefined;

    constructor(player: ChromelessPlayer, convivaMetaData: ConvivaMetadata, config: ConvivaConfiguration) {
        this.player = player;
        this.convivaMetadata = convivaMetaData;
        this.customMetadata = convivaMetaData;
        this.convivaConfig = config;
        this.currentSource = player.source;

        Analytics.setDeviceMetadata(collectDeviceMetadata());
        Analytics.init(
            this.convivaConfig.customerKey,
            CONVIVA_CALLBACK_FUNCTIONS,
            calculateConvivaOptions(this.convivaConfig)
        );

        this.addEventListeners();
    }

    private initializeSession(): void {
        this.convivaVideoAnalytics = Analytics.buildVideoAnalytics();
        this.convivaVideoAnalytics.setPlayerInfo(collectPlayerInfo());
        this.convivaVideoAnalytics.setCallback(this.convivaCallback);

        this.convivaAdAnalytics = Analytics.buildAdAnalytics(this.convivaVideoAnalytics);

        this.adReporter = new AdReporter(
            this.player,
            this.convivaVideoAnalytics,
            this.convivaAdAnalytics,
            () => this.customMetadata
        );

        if (this.player.verizonMedia !== undefined) {
            this.verizonAdReporter = new VerizonAdReporter(
                this.player,
                this.convivaVideoAnalytics,
                this.convivaAdAnalytics
            );
        }

        if (this.yospaceConnector !== undefined) {
            this.yospaceAdReporter = new YospaceAdReporter(
                this.player,
                this.convivaVideoAnalytics!,
                this.convivaAdAnalytics!,
                this.yospaceConnector
            );
        }
    }

    connect(connector: YospaceConnector): void {
        if (!this.convivaVideoAnalytics) {
            this.initializeSession();
        }
        this.yospaceAdReporter?.destroy();
        this.yospaceAdReporter = new YospaceAdReporter(
            this.player,
            this.convivaVideoAnalytics!,
            this.convivaAdAnalytics!,
            connector
        );
        this.yospaceConnector = connector;
    }

    setContentInfo(metadata: ConvivaMetadata): void {
        if (!this.convivaVideoAnalytics) {
            this.initializeSession();
        }
        this.customMetadata = { ...this.customMetadata, ...metadata };
        this.convivaVideoAnalytics!.setContentInfo(metadata);
    }

    setAdInfo(metadata: ConvivaMetadata): void {
        if (!this.convivaVideoAnalytics) {
            this.initializeSession();
        }
        this.convivaAdAnalytics!.setAdInfo(metadata);
    }

    reportPlaybackFailed(errorMessage: string): void {
        this.convivaVideoAnalytics?.reportPlaybackFailed(errorMessage);
        this.releaseSession();
    }

    reportPlaybackEvent(eventType: string, eventDetail?: object): void {
        this.convivaVideoAnalytics?.reportPlaybackEvent(eventType, eventDetail);
    }

    stopAndStartNewSession(metadata: ConvivaMetadata): void {
        this.maybeReportPlaybackEnded();
        this.maybeReportPlaybackRequested();
        this.setContentInfo(metadata);
        if (this.player.paused) {
            this.onPause();
        } else {
            this.onPlaying();
        }
    }

    private addEventListeners(): void {
        this.player.addEventListener('play', this.onPlay);
        this.player.addEventListener('playing', this.onPlaying);
        this.player.addEventListener('pause', this.onPause);
        this.player.addEventListener('waiting', this.onWaiting);
        this.player.addEventListener('seeking', this.onSeeking);
        this.player.addEventListener('seeked', this.onSeeked);
        this.player.addEventListener('error', this.onError);
        this.player.addEventListener('segmentnotfound', this.onSegmentNotFound);
        this.player.addEventListener('sourcechange', this.onSourceChange);
        this.player.addEventListener('ended', this.onEnded);
        this.player.addEventListener('durationchange', this.onDurationChange);
        this.player.addEventListener('destroy', this.onDestroy);

        this.player.network.addEventListener('offline', this.onNetworkOffline);

        document.addEventListener('visibilitychange', this.onVisibilityChange);
        window.addEventListener('beforeunload', this.onBeforeUnload);
    }

    private removeEventListeners(): void {
        this.player.removeEventListener('play', this.onPlay);
        this.player.removeEventListener('playing', this.onPlaying);
        this.player.removeEventListener('pause', this.onPause);
        this.player.removeEventListener('waiting', this.onWaiting);
        this.player.removeEventListener('seeking', this.onSeeking);
        this.player.removeEventListener('seeked', this.onSeeked);
        this.player.removeEventListener('error', this.onError);
        this.player.removeEventListener('segmentnotfound', this.onSegmentNotFound);
        this.player.removeEventListener('sourcechange', this.onSourceChange);
        this.player.removeEventListener('ended', this.onEnded);
        this.player.removeEventListener('durationchange', this.onDurationChange);
        this.player.removeEventListener('destroy', this.onDestroy);

        this.player.network.removeEventListener('offline', this.onNetworkOffline);

        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        window.removeEventListener('beforeunload', this.onBeforeUnload);
    }

    private convivaCallback = () => {
        const currentTime = this.player.currentTime * 1000;
        this.convivaVideoAnalytics!.reportPlaybackMetric(Constants.Playback.PLAY_HEAD_TIME, currentTime);
        this.convivaVideoAnalytics!.reportPlaybackMetric(
            Constants.Playback.BUFFER_LENGTH,
            calculateBufferLength(this.player)
        );
        this.convivaVideoAnalytics!.reportPlaybackMetric(
            Constants.Playback.RESOLUTION,
            this.player.videoWidth,
            this.player.videoHeight
        );
        const activeVideoTrack = this.player.videoTracks[0];
        const activeQuality = activeVideoTrack?.activeQuality;
        if (activeQuality) {
            const frameRate = (activeQuality as VideoQuality).frameRate;
            this.convivaVideoAnalytics!.reportPlaybackMetric(
                Constants.Playback.BITRATE,
                activeQuality.bandwidth / 1000
            );
            if (frameRate) {
                this.convivaVideoAnalytics!.reportPlaybackMetric(Constants.Playback.RENDERED_FRAMERATE, frameRate);
            }
        }
    };

    private readonly onPlay = () => {
        this.maybeReportPlaybackRequested();
    };

    private maybeReportPlaybackRequested() {
        if (!this.playbackRequested && this.player.source !== undefined) {
            this.playbackRequested = true;
            if (!this.convivaVideoAnalytics) {
                this.initializeSession();
            }
            this.convivaVideoAnalytics!.reportPlaybackRequested(
                collectContentMetadata(this.player, this.convivaMetadata)
            );
            this.reportMetadata();
        }
    }

    private maybeReportPlaybackEnded() {
        if (this.playbackRequested) {
            this.convivaVideoAnalytics?.reportPlaybackEnded();
            this.releaseSession();
            this.playbackRequested = false;
        }
    }

    private reportMetadata() {
        const src = this.player.src ?? '';
        const streamType = this.player.duration === Infinity ? Constants.StreamType.LIVE : Constants.StreamType.VOD;
        const assetName = this.customMetadata[Constants.ASSET_NAME] ?? this.currentSource?.metadata?.title ?? 'NA';
        const playerName = this.customMetadata[Constants.PLAYER_NAME] ?? 'THEOplayer';
        const metadata = {
            [Constants.STREAM_URL]: src,
            [Constants.IS_LIVE]: streamType,
            [Constants.ASSET_NAME]: assetName,
            [Constants.PLAYER_NAME]: playerName
        };
        this.setContentInfo(metadata);
    }

    private readonly onPlaying = () => {
        this.convivaVideoAnalytics?.reportPlaybackMetric(
            Constants.Playback.PLAYER_STATE,
            Constants.PlayerState.PLAYING
        );
    };

    private readonly onPause = () => {
        this.convivaVideoAnalytics?.reportPlaybackMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.PAUSED);
    };

    private readonly onWaiting = () => {
        this.convivaVideoAnalytics?.reportPlaybackMetric(
            Constants.Playback.PLAYER_STATE,
            Constants.PlayerState.BUFFERING
        );
    };

    private readonly onSeeking = () => {
        this.convivaVideoAnalytics?.reportPlaybackMetric(Constants.Playback.SEEK_STARTED);
    };

    private readonly onSeeked = () => {
        this.convivaVideoAnalytics?.reportPlaybackMetric(Constants.Playback.SEEK_ENDED);
    };

    private readonly onError = () => {
        const metadata: ConvivaMetadata = {};
        if (Number.isNaN(this.player.duration)) {
            metadata[Constants.DURATION] = -1;
        }
        const error = this.player.errorObject;

        // Optionally report error details, which should be a flat {[key: string]: string} object.
        if (error?.cause) {
            try {
                const errorDetails = flattenAndStringifyObject(error?.cause);
                if (Object.keys(errorDetails).length > 0) {
                    this.convivaVideoAnalytics?.reportPlaybackEvent('ErrorDetailsEvent', errorDetails);
                }
            } catch (ignore) {
                // Failed to stringify body
            }
        }

        this.convivaVideoAnalytics?.reportPlaybackFailed(error?.message ?? 'Fatal error occurred', metadata);

        this.releaseSession();
    };

    private readonly onSegmentNotFound = () => {
        this.convivaVideoAnalytics?.reportPlaybackError(
            'A Video Playback Failure has occurred: Segment not found',
            Constants.ErrorSeverity.FATAL
        );
    };

    private readonly onNetworkOffline = () => {
        this.convivaVideoAnalytics?.reportPlaybackError(
            'A Video Playback Failure has occurred: Waiting for the manifest to come back online',
            Constants.ErrorSeverity.FATAL
        );
    };

    // eslint-disable-next-line class-methods-use-this
    private readonly onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            Analytics.reportAppForegrounded();
        } else {
            Analytics.reportAppBackgrounded();
        }
    };

    private readonly onBeforeUnload = () => {
        this.maybeReportPlaybackEnded();
    };

    private readonly onSourceChange = () => {
        this.maybeReportPlaybackEnded();
        this.currentSource = this.player.source;
    };

    private readonly onEnded = () => {
        this.convivaVideoAnalytics?.reportPlaybackMetric(
            Constants.Playback.PLAYER_STATE,
            Constants.PlayerState.STOPPED
        );
        this.maybeReportPlaybackEnded();
    };

    private readonly onDurationChange = () => {
        const contentInfo: ConvivaMetadata = {};
        const duration = this.player.duration;
        if (duration === Infinity) {
            contentInfo[Constants.IS_LIVE] = Constants.StreamType.LIVE;
        } else {
            contentInfo[Constants.IS_LIVE] = Constants.StreamType.VOD;
            contentInfo[Constants.DURATION] = duration;
        }
        this.convivaVideoAnalytics?.setContentInfo(contentInfo);
    };

    private readonly onDestroy = () => {
        this.destroy();
    };

    private releaseSession(): void {
        this.adReporter?.destroy();
        this.verizonAdReporter?.destroy();
        this.yospaceAdReporter?.destroy();
        this.adReporter = undefined;
        this.verizonAdReporter = undefined;
        this.yospaceAdReporter = undefined;

        this.convivaAdAnalytics?.release();
        this.convivaVideoAnalytics?.release();
        this.convivaAdAnalytics = undefined;
        this.convivaVideoAnalytics = undefined;

        this.customMetadata = {};
    }

    destroy(): void {
        this.maybeReportPlaybackEnded();
        this.removeEventListeners();
        Analytics.release();
    }
}
