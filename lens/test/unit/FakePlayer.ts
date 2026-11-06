import type { ChromelessPlayer, SourceDescription } from 'theoplayer';

type Listener = (event: any) => void;

class Dispatcher {
    private listeners: Record<string, Listener[]> = {};

    addEventListener(types: string | readonly string[], listener: Listener): void {
        for (const type of typeof types === 'string' ? [types] : types) {
            (this.listeners[type] ??= []).push(listener);
        }
    }

    removeEventListener(types: string | readonly string[], listener: Listener): void {
        for (const type of typeof types === 'string' ? [types] : types) {
            this.listeners[type] = (this.listeners[type] ?? []).filter((l) => l !== listener);
        }
    }

    dispatch(type: string, event: object = {}): void {
        for (const listener of (this.listeners[type] ?? []).slice()) listener({ type, ...event });
    }

    listenerCount(): number {
        return Object.keys(this.listeners).reduce((count, type) => count + this.listeners[type].length, 0);
    }
}

export class FakeTimeRanges {
    constructor(private readonly ranges: Array<[number, number]> = []) {}
    get length(): number {
        return this.ranges.length;
    }
    start(index: number): number {
        return this.ranges[index][0];
    }
    end(index: number): number {
        return this.ranges[index][1];
    }
}

export interface FakeQuality {
    uid: number;
    bandwidth: number;
    averageBandwidth?: number;
    codecs: string;
    width?: number;
    height?: number;
    frameRate?: number;
}

export class FakeMediaTrack extends Dispatcher {
    activeQuality: FakeQuality | undefined;
    constructor(
        readonly uid: number,
        public enabled: boolean,
        readonly qualities: FakeQuality[] = [],
        readonly language = '',
        readonly label = ''
    ) {
        super();
    }
}

export interface FakeTextTrack {
    uid: number;
    kind: string;
    mode: string;
    language: string;
    label: string;
}

export class FakeTrackList<T> extends Dispatcher {
    readonly tracks: T[] = [];
    map<U>(fn: (track: T) => U): U[] {
        return this.tracks.map(fn);
    }
    filter(fn: (track: T) => boolean): T[] {
        return this.tracks.filter(fn);
    }
    forEach(fn: (track: T) => void): void {
        this.tracks.forEach(fn);
    }
    add(track: T): void {
        this.tracks.push(track);
        this.dispatch('addtrack', { track });
    }
    remove(track: T): void {
        this.tracks.splice(this.tracks.indexOf(track), 1);
        this.dispatch('removetrack', { track });
    }
}

/** The subset of the THEOplayer API the adapter reads, driven by hand. */
export class FakePlayer extends Dispatcher {
    source: SourceDescription | undefined;
    autoplay = false;
    preload = 'metadata';
    currentTime = 0;
    paused = true;
    ended = false;
    duration = NaN;
    readyState = 0;
    seekable = new FakeTimeRanges();
    buffered = new FakeTimeRanges();
    playbackRate = 1;
    muted = false;
    volume = 1;
    currentProgramDateTime: Date | null = null;
    readonly metrics = { currentBandwidthEstimate: 0, droppedVideoFrames: 0 };
    readonly element = { clientWidth: 640, clientHeight: 360 };
    readonly abr: { targetBuffer?: number } = { targetBuffer: 20 };
    readonly presentation = Object.assign(new Dispatcher(), { currentMode: 'inline' });
    readonly videoTracks = new FakeTrackList<FakeMediaTrack>();
    readonly audioTracks = new FakeTrackList<FakeMediaTrack>();
    readonly textTracks = new FakeTrackList<FakeTextTrack>();
    readonly visibility = {
        observers: [] as Array<(ratio: number) => void>,
        addObserver(_step: number, callback: (ratio: number) => void) {
            this.observers.push(callback);
            return callback;
        },
        removeObserver(observer: (ratio: number) => void) {
            this.observers = this.observers.filter((o) => o !== observer);
        }
    };

    get asPlayer(): ChromelessPlayer {
        return this as unknown as ChromelessPlayer;
    }

    /**
     * Loads a source the way THEOplayer does: `emptied` with the new source set but the previous duration,
     * `sourcechange` last.
     */
    setSource(source: SourceDescription | undefined): void {
        this.source = source;
        this.readyState = 0;
        this.dispatch('emptied');
        this.duration = NaN;
        this.dispatch('sourcechange', { source });
    }

    /** Destroys the player the way THEOplayer does: its APIs are gone by the time `destroy` fires. */
    destroy(): void {
        for (const api of ['videoTracks', 'audioTracks', 'textTracks', 'presentation', 'visibility']) {
            Object.defineProperty(this, api, {
                get() {
                    throw new TypeError(`${api} of a destroyed player`);
                }
            });
        }
        this.dispatch('destroy');
    }

    /** Every listener registered anywhere on the player, its tracks included. */
    totalListenerCount(): number {
        const tracks = [...this.videoTracks.tracks, ...this.audioTracks.tracks];
        return (
            this.listenerCount() +
            this.presentation.listenerCount() +
            this.videoTracks.listenerCount() +
            this.audioTracks.listenerCount() +
            this.textTracks.listenerCount() +
            tracks.reduce((count, track) => count + track.listenerCount(), 0) +
            this.visibility.observers.length
        );
    }
}
