import type {
    ChromelessPlayer,
    CurrentSourceChangeEvent,
    ErrorEvent,
    SourceDescription,
    VideoQuality
} from 'theoplayer';
import {
    type AdAnalytics,
    Analytics,
    Constants,
    type ConvivaDeviceMetadata,
    type ConvivaMetadata,
    type VideoAnalytics
} from '../utils/ConvivaSdk';
import type { YospaceConnector } from '@theoplayer/yospace-connector-web';
import { CONVIVA_CALLBACK_FUNCTIONS } from './ConvivaCallbackFunctions';
import {
    calculateBufferLength,
    calculateConvivaOptions,
    calculateEncodingType,
    calculateStreamType,
    collectDefaultDeviceMetadata,
    collectPlaybackConfigMetadata,
    collectPlayerInfo,
    collectAdDescriptionMetadata
} from '../utils/Utils';
import { AdReporter } from './ads/AdReporter';
import { YospaceAdReporter } from './ads/YospaceAdReporter';
import { UplynkAdReporter } from './ads/UplynkAdReporter';
import { ErrorReportBuilder } from '../utils/ErrorReportBuilder';
import { THEOliveReporter } from './theolive/THEOliveReporter';

enum CustomConstants {
    ENCODING_TYPE = 'encoding_type'
}

export interface ConvivaConfiguration {
    customerKey: string;
    debug?: boolean;
    gatewayUrl?: string;
    deviceMetadata?: ConvivaDeviceMetadata;
}

export class ConvivaHandler {
    private readonly player: ChromelessPlayer;
    private readonly convivaMetadata: ConvivaMetadata;
    private readonly convivaConfig: ConvivaConfiguration;
    private customMetadata: ConvivaMetadata = {};

    private convivaVideoAnalytics: VideoAnalytics | undefined;
    private convivaAdAnalytics: AdAnalytics | undefined;

    private adReporter: AdReporter | undefined;
    private THEOliveReporter: THEOliveReporter | undefined;
    private yospaceAdReporter: YospaceAdReporter | undefined;
    private uplynkAdReporter: UplynkAdReporter | undefined;

    private currentSource: SourceDescription | undefined;
    private playbackRequested: boolean = false;

    private yospaceConnector: YospaceConnector | undefined;

    private errorReportBuilder: ErrorReportBuilder | undefined;

    constructor(player: ChromelessPlayer, convivaMetaData: ConvivaMetadata, config: ConvivaConfiguration) {
        this.player = player;
        this.convivaMetadata = convivaMetaData;
        this.convivaConfig = config;
        this.currentSource = player.source;

        Analytics.setDeviceMetadata(this.convivaConfig.deviceMetadata ?? collectDefaultDeviceMetadata());
        Analytics.init(
            this.convivaConfig.customerKey,
            CONVIVA_CALLBACK_FUNCTIONS,
            calculateConvivaOptions(this.convivaConfig)
        );

        this.addEventListeners();
        this.errorReportBuilder = new ErrorReportBuilder(this.player);
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

        if (this.player.uplynk !== undefined) {
            this.uplynkAdReporter = new UplynkAdReporter(
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

        this.THEOliveReporter = new THEOliveReporter(this.player, this.convivaVideoAnalytics);
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
        this.convivaVideoAnalytics!.setContentInfo(this.customMetadata);
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
        // End current session if one had already started
        this.maybeReportPlaybackEnded();

        // If play-out was paused, the session will start once play-out resumes.
        if (!this.player.paused) {
            // Start new session
            this.maybeReportPlaybackRequested();
        }
        // Pass new metadata
        this.setContentInfo(metadata);

        // Notify current playback state
        this.convivaVideoAnalytics?.reportPlaybackMetric(Constants.Playback.PLAYER_STATE, this.getPlaybackState());
    }

    private getPlaybackState() {
        if (this.player.ended) return Constants.PlayerState.STOPPED;
        if (this.player.paused) return Constants.PlayerState.PAUSED;
        if (this.player.readyState >= 3 /*HAVE_FUTURE_DATA*/) return Constants.PlayerState.PLAYING;
        return Constants.PlayerState.BUFFERING;
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
        this.player.addEventListener('currentsourcechange', this.onCurrentSourceChange);
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
        this.player.removeEventListener('currentsourcechange', this.onCurrentSourceChange);
        this.player.removeEventListener('ended', this.onEnded);
        this.player.removeEventListener('durationchange', this.onDurationChange);
        this.player.removeEventListener('destroy', this.onDestroy);

        this.player.network?.removeEventListener('offline', this.onNetworkOffline);

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
            if (activeQuality.averageBandwidth) {
                this.convivaVideoAnalytics!.reportPlaybackMetric(
                    Constants.Playback.AVG_BITRATE,
                    activeQuality.averageBandwidth / 1000
                );
            }
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
            this.convivaVideoAnalytics!.reportPlaybackRequested(this.convivaMetadata);
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
        const assetName =
            this.customMetadata[Constants.ASSET_NAME] ??
            this.convivaMetadata[Constants.ASSET_NAME] ??
            this.currentSource?.metadata?.title ??
            'NA';
        const playerName =
            this.customMetadata[Constants.PLAYER_NAME] ?? this.convivaMetadata[Constants.PLAYER_NAME] ?? 'THEOplayer';

        const metadata: ConvivaMetadata = {
            [Constants.STREAM_URL]: src,
            [Constants.ASSET_NAME]: assetName,
            [Constants.PLAYER_NAME]: playerName,
            ...collectPlaybackConfigMetadata(this.player),
            ...collectAdDescriptionMetadata(this.player)
        };
        // Do not override the `isLive` value if already set by the consumer, as the value
        // is read-only for a given session.
        if (!this.customMetadata[Constants.IS_LIVE] && !this.convivaMetadata[Constants.IS_LIVE]) {
            // Only pass `isLive` property if we have a valid duration
            const streamType = calculateStreamType(this.player);
            if (streamType) {
                metadata[Constants.IS_LIVE] = streamType;
            }
        }
        // Only pass a finite duration value, never NaN or Infinite.
        if (isFinite(this.player.duration)) {
            metadata[Constants.DURATION] = this.player.duration;
        }
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

    private readonly onError = (errorEvent: ErrorEvent) => {
        const metadata: ConvivaMetadata = {};
        if (Number.isNaN(this.player.duration)) {
            metadata[Constants.DURATION] = -1;
        }
        const error = errorEvent.errorObject;

        // Report error details in a separate event, which should be passed a flat <String, String> map.
        const errorDetails = this.errorReportBuilder?.withPlayerBuffer().withErrorDetails(error).build();
        if (errorDetails) {
            this.convivaVideoAnalytics?.reportPlaybackEvent('ErrorDetailsEvent', errorDetails);
        }
        this.convivaVideoAnalytics?.reportPlaybackFailed(error?.message ?? 'Fatal error occurred', metadata);

        this.releaseSession();
    };

    private readonly onSegmentNotFound = () => {
        this.convivaVideoAnalytics?.reportPlaybackError(
            'A Video Playback Failure has occurred: Segment not found',
            Constants.ErrorSeverity.WARNING
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
        this.customMetadata = {};
    };

    private readonly onCurrentSourceChange = (event: CurrentSourceChangeEvent) => {
        // Do not override `encoding_type` value if already set by the customer.
        const configuredEncodingType =
            this.customMetadata[CustomConstants.ENCODING_TYPE] ?? this.convivaMetadata[CustomConstants.ENCODING_TYPE];
        const encodingType = configuredEncodingType ?? calculateEncodingType(event.currentSource);
        if (encodingType) {
            this.setContentInfo({ [CustomConstants.ENCODING_TYPE]: encodingType });
        }
    };

    private readonly onEnded = () => {
        this.convivaVideoAnalytics?.reportPlaybackMetric(
            Constants.Playback.PLAYER_STATE,
            Constants.PlayerState.STOPPED
        );
        this.maybeReportPlaybackEnded();
    };

    private readonly onDurationChange = () => {
        // Report updated metadata now that we know the duration & streamType.
        this.reportMetadata();
    };

    private readonly onDestroy = () => {
        this.destroy();
    };

    private releaseSession(): void {
        this.adReporter?.destroy();
        this.uplynkAdReporter?.destroy();
        this.yospaceAdReporter?.destroy();
        this.THEOliveReporter?.destroy();
        this.adReporter = undefined;
        this.uplynkAdReporter = undefined;
        this.yospaceAdReporter = undefined;
        this.THEOliveReporter = undefined;

        this.convivaAdAnalytics?.release();
        this.convivaVideoAnalytics?.release();
        this.convivaAdAnalytics = undefined;
        this.convivaVideoAnalytics = undefined;
    }

    destroy(): void {
        this.maybeReportPlaybackEnded();
        this.removeEventListeners();
        this.errorReportBuilder?.destroy();
        this.customMetadata = {};
        Analytics.release();
    }
}
