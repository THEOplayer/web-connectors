import type {
    AddTrackEvent,
    ChromelessPlayer,
    CurrentSourceChangeEvent,
    ErrorEvent,
    MediaTrack,
    Quality,
    RemoveTrackEvent,
    SourceDescription,
    TextTrack,
    TimeRanges,
    TypedSource,
    VideoQuality,
    VisibilityObserver
} from 'theoplayer';
import { version } from 'theoplayer';
import type {
    LensPlayerAdapter,
    LensPlayerFact,
    LensPlayerProperties,
    LensPlayerSnapshot,
    LensPlayerSource,
    LensPresentationMode,
    LensRendition,
    LensTimeRange,
    LensTrack
} from '@dolby-optiview/lens-sdk';

/**
 * Returns the content ID to report for a source, or `undefined` to let Lens derive one from the source URL.
 */
export type ContentIdProvider = (source: SourceDescription) => string | undefined;

const HAVE_CURRENT_DATA = 2;
const HAVE_ENOUGH_DATA = 4;

const PRESENTATION_MODES: Record<string, LensPresentationMode | undefined> = {
    inline: 'inline',
    fullscreen: 'fullscreen',
    'picture-in-picture': 'pip',
    'native-picture-in-picture': 'pip'
};

const SUBTITLE_KINDS = ['subtitles', 'captions'];

function typedSources(description: SourceDescription | undefined): TypedSource[] {
    const sources = description?.sources;
    if (!sources) return [];
    return (Array.isArray(sources) ? sources : [sources]).map((source) =>
        typeof source === 'string' ? { src: source } : source
    );
}

function timeRanges(ranges: TimeRanges): LensTimeRange[] {
    const result: LensTimeRange[] = [];
    for (let index = 0; index < ranges.length; index++) {
        result.push({ start: ranges.start(index), end: ranges.end(index) });
    }
    return result;
}

function isHls(source: LensPlayerSource | null): boolean {
    const mimeType = source?.mimeType?.toLowerCase() ?? '';
    if (mimeType) return mimeType.indexOf('mpegurl') !== -1;
    return /\.m3u8$/i.test((source?.url ?? '').split(/[?#]/)[0]);
}

function rendition(quality: Quality, combinedBitrate: boolean): LensRendition {
    const { width, height, frameRate } = quality as Partial<VideoQuality>;
    return {
        id: String(quality.uid),
        bitrate: quality.bandwidth,
        ...(combinedBitrate && { combinedBitrate }),
        ...(quality.averageBandwidth && { averageBitrate: quality.averageBandwidth }),
        ...(quality.codecs && { codecs: quality.codecs }),
        ...(width && { width }),
        ...(height && { height }),
        ...(frameRate && { frameRate })
    };
}

/**
 * Reports a THEOplayer instance to Lens through its public API.
 */
export class THEOplayerAdapter implements LensPlayerAdapter {
    readonly playerName = 'THEOplayer';
    readonly playerVersion = version;

    private readonly player: ChromelessPlayer;
    private readonly contentId: ContentIdProvider | undefined;
    private listeners: Array<(fact: LensPlayerFact) => void> = [];
    private description: SourceDescription | undefined;
    private source: LensPlayerSource | null = null;
    private typedSource: TypedSource | undefined;
    private playRequested = false;
    private live: boolean | undefined;
    private bufferStable: boolean | undefined;
    private hasMediaData: boolean | undefined;
    private inView: boolean | undefined;
    private visibilityObserver: VisibilityObserver | undefined;
    private destroyed = false;

    constructor(player: ChromelessPlayer, contentId?: ContentIdProvider) {
        this.player = player;
        this.contentId = contentId;
    }

    subscribe(listener: (fact: LensPlayerFact) => void): () => void {
        if (this.listeners.length === 0) this.attach();
        this.listeners.push(listener);
        listener({ type: 'initial', source: this.source, properties: this.properties() });
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index === -1) return;
            this.listeners.splice(index, 1);
            if (this.listeners.length === 0) this.detach();
        };
    }

    snapshot(): LensPlayerSnapshot {
        const { player } = this;
        const { metrics } = player;
        const dateTime = player.currentProgramDateTime?.getTime();
        const throughput = metrics.currentBandwidthEstimate;
        return {
            currentTime: player.currentTime,
            paused: player.paused,
            ended: player.ended,
            ...(dateTime !== undefined && { playheadDateTime: dateTime }),
            ...(!isNaN(player.duration) && { duration: player.duration }),
            ...(this.source && { seekable: timeRanges(player.seekable) }),
            ...(this.source && { buffered: [{ ranges: timeRanges(player.buffered) }] }),
            ...(throughput > 0 && isFinite(throughput) && { measuredThroughput: throughput }),
            droppedFrames: metrics.droppedVideoFrames,
            viewWidth: player.element.clientWidth,
            viewHeight: player.element.clientHeight
        };
    }

    private attach(): void {
        const { player } = this;
        this.announce(typedSources(player.source)[0]);
        this.updateLive();
        this.updateReadiness();
        player.addEventListener(['emptied', 'sourcechange'], this.onSourceChange);
        player.addEventListener('currentsourcechange', this.onCurrentSourceChange);
        player.addEventListener('readystatechange', this.onReadyStateChange);
        player.addEventListener('durationchange', this.onDurationChange);
        player.addEventListener(['volumechange', 'ratechange'], this.onChange);
        player.addEventListener('play', this.onPlay);
        player.addEventListener('playing', this.onPlaying);
        player.addEventListener('pause', this.onPause);
        player.addEventListener('waiting', this.onWaiting);
        player.addEventListener('seeking', this.onSeeking);
        player.addEventListener('seeked', this.onSeeked);
        player.addEventListener('ended', this.onEnded);
        player.addEventListener('error', this.onError);
        player.addEventListener('destroy', this.onDestroy);
        player.presentation.addEventListener('presentationmodechange', this.onChange);
        for (const list of [player.videoTracks, player.audioTracks]) {
            list.addEventListener('addtrack', this.onAddTrack);
            list.addEventListener('removetrack', this.onRemoveTrack);
            list.addEventListener('change', this.onChange);
            list.forEach((track) => this.addQualityListeners(track));
        }
        player.textTracks.addEventListener(['addtrack', 'removetrack', 'change'], this.onChange);
        this.visibilityObserver = player.visibility.addObserver(1, this.onVisibility);
    }

    private detach(): void {
        // Nothing fires on a destroyed player, and its track and presentation APIs are already gone.
        if (this.destroyed) return;
        const { player } = this;
        player.removeEventListener(['emptied', 'sourcechange'], this.onSourceChange);
        player.removeEventListener('currentsourcechange', this.onCurrentSourceChange);
        player.removeEventListener('readystatechange', this.onReadyStateChange);
        player.removeEventListener('durationchange', this.onDurationChange);
        player.removeEventListener(['volumechange', 'ratechange'], this.onChange);
        player.removeEventListener('play', this.onPlay);
        player.removeEventListener('playing', this.onPlaying);
        player.removeEventListener('pause', this.onPause);
        player.removeEventListener('waiting', this.onWaiting);
        player.removeEventListener('seeking', this.onSeeking);
        player.removeEventListener('seeked', this.onSeeked);
        player.removeEventListener('ended', this.onEnded);
        player.removeEventListener('error', this.onError);
        player.removeEventListener('destroy', this.onDestroy);
        player.presentation.removeEventListener('presentationmodechange', this.onChange);
        for (const list of [player.videoTracks, player.audioTracks]) {
            list.removeEventListener('addtrack', this.onAddTrack);
            list.removeEventListener('removetrack', this.onRemoveTrack);
            list.removeEventListener('change', this.onChange);
            list.forEach((track) => this.removeQualityListeners(track));
        }
        player.textTracks.removeEventListener(['addtrack', 'removetrack', 'change'], this.onChange);
        if (this.visibilityObserver) player.visibility.removeObserver(this.visibilityObserver);
        this.visibilityObserver = undefined;
        this.inView = undefined;
    }

    private emit(fact: LensPlayerFact): void {
        for (const listener of this.listeners.slice()) listener(fact);
    }

    private announce(typedSource: TypedSource | undefined): void {
        const description = this.player.source;
        this.description = description;
        this.typedSource = typedSource;
        if (!description) {
            this.source = null;
            return;
        }
        const contentId = this.contentId?.(description);
        const { preload } = this.player;
        this.source = {
            ...(typedSource?.src && { url: typedSource.src }),
            ...(contentId && { contentId }),
            ...(typedSource?.type && { mimeType: typedSource.type }),
            autoplay: this.player.autoplay,
            ...(preload && { preload })
        };
    }

    /** Tracks are left out of a source fact: they follow as THEOplayer adds them for the new source. */
    private properties(withTracks = true): LensPlayerProperties {
        const { player, live } = this;
        const tracks = withTracks ? this.tracks() : [];
        const lowLatency = live === false ? false : live && this.typedSource?.lowLatency ? true : undefined;
        return {
            ...(live !== undefined && { live }),
            ...(lowLatency !== undefined && { lowLatency }),
            ...(tracks.length > 0 && { tracks }),
            ...(player.abr.targetBuffer !== undefined && { targetBuffer: player.abr.targetBuffer }),
            ...(this.bufferStable !== undefined && { bufferStable: this.bufferStable }),
            ...(this.hasMediaData !== undefined && { hasMediaData: this.hasMediaData }),
            playbackRate: player.playbackRate,
            muted: player.muted,
            volume: player.volume,
            ...(this.inView !== undefined && { visibility: this.inView ? 'visible' : 'hidden' }),
            presentationMode: PRESENTATION_MODES[player.presentation.currentMode] ?? 'inline'
        };
    }

    private tracks(): LensTrack[] {
        const { player } = this;
        // An HLS variant's BANDWIDTH, which THEOplayer reports as the video quality's, covers all its media.
        const combinedBitrate = isHls(this.source);
        const mediaTrack = (track: MediaTrack, kind: 'video' | 'audio'): LensTrack => {
            // HLS declares no audio bitrates: THEOplayer gives audio qualities the variants' bandwidths.
            const renditions =
                combinedBitrate && kind === 'audio' ? [] : track.qualities.filter((quality) => quality.bandwidth > 0);
            return {
                id: `${kind}-${track.uid}`,
                kind,
                selected: track.enabled,
                ...(track.language && { language: track.language }),
                ...(track.label && { label: track.label }),
                ...(renditions.length > 0 && {
                    renditions: renditions.map((quality) => rendition(quality, combinedBitrate))
                }),
                ...(track.activeQuality && { renderedRenditionId: String(track.activeQuality.uid) })
            };
        };
        const textTrack = (track: TextTrack): LensTrack => ({
            id: `text-${track.uid}`,
            kind: 'text',
            selected: track.mode === 'showing',
            ...(track.language && { language: track.language }),
            ...(track.label && { label: track.label })
        });
        return [
            ...player.videoTracks.map((track) => mediaTrack(track, 'video')),
            ...player.audioTracks.map((track) => mediaTrack(track, 'audio')),
            ...player.textTracks.filter((track) => SUBTITLE_KINDS.indexOf(track.kind) !== -1).map(textTrack)
        ];
    }

    private updateLive(): boolean {
        const duration = this.player.duration;
        const live = this.source && !isNaN(duration) ? duration === Infinity : undefined;
        if (live === this.live) return false;
        this.live = live;
        return true;
    }

    private updateReadiness(): boolean {
        const { readyState } = this.player;
        const bufferStable = this.source ? readyState >= HAVE_ENOUGH_DATA : undefined;
        const hasMediaData = this.source ? readyState >= HAVE_CURRENT_DATA : undefined;
        if (bufferStable === this.bufferStable && hasMediaData === this.hasMediaData) return false;
        this.bufferStable = bufferStable;
        this.hasMediaData = hasMediaData;
        return true;
    }

    /** Pushes a readiness drop before the fact that caused it, so Lens sees the buffer state of the seek or stall. */
    private checkReadiness(): void {
        if (this.updateReadiness()) this.onChange();
    }

    private addQualityListeners(track: MediaTrack): void {
        track.addEventListener(['activequalitychanged', 'update'], this.onChange);
    }

    private removeQualityListeners(track: MediaTrack): void {
        track.removeEventListener(['activequalitychanged', 'update'], this.onChange);
    }

    /** THEOplayer fires `emptied`, `waiting` and `currentsourcechange` for a new source before `sourcechange`. */
    private syncSource(): void {
        if (this.player.source === this.description) return;
        this.announce(typedSources(this.player.source)[0]);
        this.emitSource(false);
    }

    /** THEOplayer fires no `play` for playback requested while a source loads; playback under way implies one. */
    private ensurePlayRequested(): void {
        if (!this.playRequested && !this.player.paused) this.onPlay();
    }

    /** `duration` still holds the previous source's until `durationchange`; `readyState` is already reset. */
    private emitSource(continuation: boolean): void {
        if (!continuation) this.playRequested = false;
        this.live = undefined;
        this.updateReadiness();
        this.emit({
            type: 'source',
            source: this.source,
            properties: this.properties(false),
            ...(continuation && { continuation })
        });
    }

    private readonly onChange = (): void => {
        this.emit({ type: 'change', properties: this.properties() });
    };

    private readonly onSourceChange = (): void => {
        this.syncSource();
    };

    private readonly onCurrentSourceChange = (event: CurrentSourceChangeEvent): void => {
        this.syncSource();
        const typedSource = event.currentSource;
        if (!typedSource || !this.source || typedSource === this.typedSource) return;
        const previous = this.source;
        this.announce(typedSource);
        if (this.source?.url === previous.url && this.source?.mimeType === previous.mimeType) return;
        // Another source of the same description: THEOplayer fell back to it.
        this.emitSource(true);
    };

    private readonly onReadyStateChange = (): void => {
        this.syncSource();
        this.checkReadiness();
    };

    private readonly onDurationChange = (): void => {
        this.syncSource();
        if (this.updateLive()) this.onChange();
    };

    private readonly onAddTrack = (event: AddTrackEvent): void => {
        this.addQualityListeners(event.track as MediaTrack);
        this.onChange();
    };

    private readonly onRemoveTrack = (event: RemoveTrackEvent): void => {
        this.removeQualityListeners(event.track as MediaTrack);
        this.onChange();
    };

    private readonly onVisibility = (ratio: number): void => {
        const inView = ratio > 0;
        if (inView === this.inView) return;
        this.inView = inView;
        this.onChange();
    };

    private readonly onPlay = (): void => {
        this.syncSource();
        this.playRequested = true;
        this.emit({ type: 'play' });
    };

    private readonly onPlaying = (): void => {
        this.syncSource();
        this.ensurePlayRequested();
        this.emit({ type: 'playing' });
    };

    private readonly onPause = (): void => this.emit({ type: 'pause' });
    private readonly onSeeked = (): void => this.emit({ type: 'seeked' });
    private readonly onEnded = (): void => this.emit({ type: 'ended' });

    private readonly onDestroy = (): void => {
        this.destroyed = true;
    };

    private readonly onWaiting = (): void => {
        this.syncSource();
        this.ensurePlayRequested();
        this.checkReadiness();
        this.emit({ type: 'waiting' });
    };

    private readonly onSeeking = (): void => {
        this.checkReadiness();
        this.emit({ type: 'seeking' });
    };

    private readonly onError = (event: ErrorEvent): void => {
        const error = event.errorObject;
        const cause = error.cause?.message;
        const message = (cause ? `${error.message} (${cause})` : error.message).replace(/\s*[\r\n]+\s*/g, ' ');
        this.emit({ type: 'error', fatal: true, code: String(error.code), ...(message && { message }) });
    };
}
