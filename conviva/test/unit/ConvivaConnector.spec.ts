import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type ConvivaConfiguration, ConvivaConnector } from '../../src';
import { Analytics } from '../../src/utils/ConvivaSdk';

vi.mock('../../src/integration/ads/AdReporter', () => ({
    AdReporter: class {
        destroy(): void {}
    }
}));

vi.mock('../../src/integration/ads/YospaceAdReporter', () => ({
    YospaceAdReporter: class {
        destroy(): void {}
    }
}));

vi.mock('../../src/integration/ads/UplynkAdReporter', () => ({
    UplynkAdReporter: class {
        destroy(): void {}
    }
}));

vi.mock('../../src/integration/theolive/THEOliveReporter', () => ({
    THEOliveReporter: class {
        destroy(): void {}
    }
}));

vi.mock('../../src/utils/ErrorReportBuilder', () => ({
    ErrorReportBuilder: class {
        destroy(): void {}

        withPlayerBuffer() {
            return this;
        }

        withErrorDetails() {
            return this;
        }

        build() {
            return undefined;
        }
    }
}));

type EventListener = (event?: unknown) => void;

class FakeEventDispatcher {
    private readonly listeners = new Map<string, Set<EventListener>>();

    addEventListener(type: string, listener: EventListener): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set<EventListener>());
        }
        this.listeners.get(type)!.add(listener);
    }

    removeEventListener(type: string, listener: EventListener): void {
        this.listeners.get(type)?.delete(listener);
    }

    emit(type: string, event?: unknown): void {
        this.listeners.get(type)?.forEach((listener) => listener(event));
    }
}

class FakePlayer extends FakeEventDispatcher {
    public source: any;
    public src: string | undefined;
    public paused: boolean = true;
    public ended: boolean = false;
    public readyState: number = 3;
    public duration: number = 120;
    public currentTime: number = 0;
    public videoWidth: number = 1920;
    public videoHeight: number = 1080;
    public videoTracks: Array<any> = [{ activeQuality: undefined }];
    public abr = {
        targetBuffer: undefined,
        bufferLookbackWindow: undefined,
        strategy: undefined
    };
    public ads: Array<any> = [];
    public uplynk: undefined = undefined;
    public network = new FakeEventDispatcher();

    setSource(src: string, title = 'Asset'): void {
        this.source = {
            sources: {
                src,
                type: 'application/vnd.apple.mpegurl'
            },
            metadata: { title }
        };
        this.src = src;
    }
}

function emitPlayerEvent(player: FakePlayer, type: string): void {
    if (type === 'play') player.paused = false;
    if (type === 'pause') player.paused = true;
    if (type === 'ended') player.ended = true;
    player.emit(type);
}

function createVideoAnalyticsMock() {
    return {
        setPlayerInfo: vi.fn(),
        setCallback: vi.fn(),
        reportPlaybackRequested: vi.fn(),
        reportPlaybackEnded: vi.fn(),
        reportPlaybackMetric: vi.fn(),
        setContentInfo: vi.fn(),
        reportPlaybackFailed: vi.fn(),
        reportPlaybackEvent: vi.fn(),
        reportPlaybackError: vi.fn(),
        release: vi.fn()
    };
}

function createAdAnalyticsMock() {
    return {
        setAdInfo: vi.fn(),
        release: vi.fn()
    };
}

describe('ConvivaConnector', () => {
    let player: FakePlayer;
    let videoAnalytics: ReturnType<typeof createVideoAnalyticsMock>;
    let adAnalytics: ReturnType<typeof createAdAnalyticsMock>;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
        player = new FakePlayer();
        videoAnalytics = createVideoAnalyticsMock();
        adAnalytics = createAdAnalyticsMock();

        vi.spyOn(Analytics, 'setDeviceMetadata').mockImplementation(() => {});
        vi.spyOn(Analytics, 'init').mockImplementation(() => {});
        vi.spyOn(Analytics, 'buildVideoAnalytics').mockReturnValue(videoAnalytics as any);
        vi.spyOn(Analytics, 'buildAdAnalytics').mockReturnValue(adAnalytics as any);
        vi.spyOn(Analytics, 'reportAppForegrounded').mockImplementation(() => {});
        vi.spyOn(Analytics, 'reportAppBackgrounded').mockImplementation(() => {});
        vi.spyOn(Analytics, 'release').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('can be constructed', () => {
        const convivaConfig: ConvivaConfiguration = { customerKey: 'test' };
        const connector = new ConvivaConnector(player as any, {}, convivaConfig);
        expect(connector).toBeDefined();
        connector.destroy();
    });

    it('preserves startup session on early sourcechange when enabled', () => {
        const connector = new ConvivaConnector(player as any, {}, {
            customerKey: 'test',
            preserveSessionOnStartupSourceChange: true
        });
        player.setSource('https://cdn.theoplayer.com/video/elephants-dream/playlist.m3u8');
        emitPlayerEvent(player, 'play');
        const contentInfoCallsAfterPlay = videoAnalytics.setContentInfo.mock.calls.length;

        player.setSource('https://cdn.theoplayer.com/video/big-buck-bunny/playlist.m3u8');
        emitPlayerEvent(player, 'sourcechange');

        expect(videoAnalytics.reportPlaybackRequested).toHaveBeenCalledTimes(1);
        expect(videoAnalytics.reportPlaybackEnded).not.toHaveBeenCalled();
        expect(videoAnalytics.setContentInfo).toHaveBeenCalledTimes(contentInfoCallsAfterPlay + 1);
        connector.destroy();
    });

    it('ends startup session on early sourcechange when grace window elapsed', () => {
        const connector = new ConvivaConnector(player as any, {}, {
            customerKey: 'test',
            preserveSessionOnStartupSourceChange: true,
            startupGraceMs: 10
        });
        player.setSource('https://cdn.theoplayer.com/video/elephants-dream/playlist.m3u8');
        emitPlayerEvent(player, 'play');
        vi.advanceTimersByTime(11);

        player.setSource('https://cdn.theoplayer.com/video/big-buck-bunny/playlist.m3u8');
        emitPlayerEvent(player, 'sourcechange');

        expect(videoAnalytics.reportPlaybackEnded).toHaveBeenCalledTimes(1);
        connector.destroy();
    });

    it('keeps backward-compatible behavior when preserve flag is omitted', () => {
        const connector = new ConvivaConnector(player as any, {}, { customerKey: 'test' });
        player.setSource('https://cdn.theoplayer.com/video/elephants-dream/playlist.m3u8');
        emitPlayerEvent(player, 'play');
        player.setSource('https://cdn.theoplayer.com/video/big-buck-bunny/playlist.m3u8');
        emitPlayerEvent(player, 'sourcechange');

        expect(videoAnalytics.reportPlaybackEnded).toHaveBeenCalledTimes(1);
        connector.destroy();
    });

    it('ends session on sourcechange after playing even when preserve flag is enabled', () => {
        const connector = new ConvivaConnector(player as any, {}, {
            customerKey: 'test',
            preserveSessionOnStartupSourceChange: true
        });
        player.setSource('https://cdn.theoplayer.com/video/elephants-dream/playlist.m3u8');
        emitPlayerEvent(player, 'play');
        emitPlayerEvent(player, 'playing');
        player.setSource('https://cdn.theoplayer.com/video/big-buck-bunny/playlist.m3u8');
        emitPlayerEvent(player, 'sourcechange');

        expect(videoAnalytics.reportPlaybackEnded).toHaveBeenCalledTimes(1);
        connector.destroy();
    });
});
