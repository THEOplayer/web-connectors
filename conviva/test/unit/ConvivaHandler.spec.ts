import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChromelessPlayer } from 'theoplayer';
import { ConvivaHandler } from '../../src/integration/ConvivaHandler';
import { Analytics, Constants, type AdAnalytics, type VideoAnalytics } from '../../src/utils/ConvivaSdk';
import { Dispatcher } from './util/Dispatcher';

vi.mock('../../src/utils/ConvivaSdk', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/utils/ConvivaSdk')>();
    return {
        ...actual,
        Analytics: {
            setDeviceMetadata: vi.fn(),
            init: vi.fn(),
            buildVideoAnalytics: vi.fn(),
            buildAdAnalytics: vi.fn(),
            reportAppForegrounded: vi.fn(),
            reportAppBackgrounded: vi.fn(),
            release: vi.fn()
        }
    };
});

class MockAds extends Dispatcher {
    playing = false;
    currentAdBreak: unknown = null;
}

const CONTENT_DURATION = 600;
const AD_DURATION = 15;

describe('ConvivaHandler', () => {
    let player: ChromelessPlayer;
    let playerDispatcher: Dispatcher;
    let ads: MockAds;
    let videoAnalytics: VideoAnalytics;
    let handler: ConvivaHandler | undefined;

    function contentInfoCalls(): Record<string, unknown>[] {
        return vi.mocked(videoAnalytics.setContentInfo).mock.calls.map((call) => call[0] as Record<string, unknown>);
    }

    function callsWithDuration(): Record<string, unknown>[] {
        return contentInfoCalls().filter((info) => Constants.DURATION in info);
    }

    function createHandler(convivaMetadata: Record<string, unknown> = {}) {
        handler = new ConvivaHandler(player, convivaMetadata, { customerKey: 'test' });
    }

    function play(duration = NaN) {
        (player as any).duration = duration;
        playerDispatcher.dispatch('play');
    }

    function durationchange(duration: number) {
        (player as any).duration = duration;
        playerDispatcher.dispatch('durationchange');
    }

    function timeupdate() {
        playerDispatcher.dispatch('timeupdate');
    }

    beforeEach(() => {
        playerDispatcher = new Dispatcher();
        ads = new MockAds();
        const network = new Dispatcher();
        (network as any).addResponseInterceptor = vi.fn();
        (network as any).removeResponseInterceptor = vi.fn();
        player = {
            addEventListener: playerDispatcher.addEventListener.bind(playerDispatcher),
            removeEventListener: playerDispatcher.removeEventListener.bind(playerDispatcher),
            ads,
            network,
            abr: {},
            buffered: { length: 0, start: () => 0, end: () => 0 },
            source: { sources: { src: 'content.m3u8' }, metadata: { title: 'Content' } },
            src: 'content.m3u8',
            duration: NaN,
            paused: false,
            ended: false,
            readyState: 4,
            currentTime: 0,
            videoWidth: 1920,
            videoHeight: 1080,
            videoTracks: []
        } as unknown as ChromelessPlayer;
        videoAnalytics = {
            setPlayerInfo: vi.fn(),
            setCallback: vi.fn(),
            setContentInfo: vi.fn(),
            reportPlaybackRequested: vi.fn(),
            reportPlaybackMetric: vi.fn(),
            reportPlaybackEvent: vi.fn(),
            reportPlaybackFailed: vi.fn(),
            reportPlaybackEnded: vi.fn(),
            reportAdBreakStarted: vi.fn(),
            reportAdBreakEnded: vi.fn(),
            release: vi.fn()
        } as unknown as VideoAnalytics;
        const adAnalytics = {
            setCallback: vi.fn(),
            setAdPlayerInfo: vi.fn(),
            setAdInfo: vi.fn(),
            release: vi.fn()
        } as unknown as AdAnalytics;
        vi.mocked(Analytics.buildVideoAnalytics).mockReturnValue(videoAnalytics);
        vi.mocked(Analytics.buildAdAnalytics).mockReturnValue(adAnalytics);
    });

    afterEach(() => {
        handler?.destroy();
        handler = undefined;
    });

    describe('content duration reporting with a preroll', () => {
        it('sends startup metadata at play while the ad is already routed, and reports the content duration later', () => {
            createHandler();
            // The ad player is already routed when the first `play` arrives.
            ads.playing = true;
            play(NaN);
            expect(videoAnalytics.reportPlaybackRequested).toHaveBeenCalledTimes(1);
            expect(videoAnalytics.setContentInfo).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    [Constants.STREAM_URL]: expect.anything(),
                    [Constants.ASSET_NAME]: expect.anything(),
                    [Constants.PLAYER_NAME]: expect.anything()
                })
            );
            expect(callsWithDuration()).toHaveLength(0);

            durationchange(AD_DURATION);
            const callsAfterAdDurationChange = vi.mocked(videoAnalytics.setContentInfo).mock.calls.length;
            // Ad players fire timeupdate too; it must not trigger the deferred report.
            timeupdate();
            expect(vi.mocked(videoAnalytics.setContentInfo).mock.calls.length).toBe(callsAfterAdDurationChange);
            expect(callsWithDuration()).toHaveLength(0);

            // The content durationchange on switch-back can arrive while the ad is still routed.
            durationchange(CONTENT_DURATION);
            expect(callsWithDuration()).toHaveLength(0);

            ads.playing = false;
            timeupdate();
            expect(videoAnalytics.setContentInfo).toHaveBeenLastCalledWith(
                expect.objectContaining({ [Constants.DURATION]: CONTENT_DURATION })
            );
            expect(contentInfoCalls()).not.toContainEqual(
                expect.objectContaining({ [Constants.DURATION]: AD_DURATION })
            );
            timeupdate();
            expect(callsWithDuration()).toHaveLength(1);
        });

        it('reports the content duration only once after the break', () => {
            createHandler();
            play(NaN);

            // The ad player is routed before the ad's durationchange arrives.
            ads.playing = true;
            ads.currentAdBreak = { integration: 'google-ima', timeOffset: 0 };
            durationchange(AD_DURATION);
            expect(callsWithDuration()).toHaveLength(0);

            // The content durationchange on switch-back can arrive while the ad is still routed.
            durationchange(CONTENT_DURATION);
            expect(callsWithDuration()).toHaveLength(0);

            ads.playing = false;
            ads.currentAdBreak = null;
            timeupdate();
            expect(videoAnalytics.setContentInfo).toHaveBeenLastCalledWith(
                expect.objectContaining({ [Constants.DURATION]: CONTENT_DURATION })
            );

            timeupdate();
            expect(callsWithDuration()).toHaveLength(1);
        });

        it('forgets the pending content duration on a source change', () => {
            createHandler();
            // A durationchange can arrive before `play`; the ad-routed report arms the
            // pending flag even though no session exists yet.
            ads.playing = true;
            durationchange(AD_DURATION);

            // The source change must drop the stale pending flag: it must not fire on
            // the next session's first timeupdate.
            playerDispatcher.dispatch('sourcechange');
            ads.playing = false;
            play(NaN);
            (player as any).duration = CONTENT_DURATION;
            const callsBeforeTimeupdate = vi.mocked(videoAnalytics.setContentInfo).mock.calls.length;

            timeupdate();
            expect(vi.mocked(videoAnalytics.setContentInfo).mock.calls.length).toBe(callsBeforeTimeupdate);
            expect(callsWithDuration()).toHaveLength(0);
        });

        it('reports the content duration on a later durationchange when it is only known after the break', () => {
            createHandler();
            play(NaN);
            ads.playing = true;
            ads.currentAdBreak = { integration: 'google-ima', timeOffset: 0 };
            durationchange(AD_DURATION);
            ads.playing = false;
            ads.currentAdBreak = null;

            // The content duration is not known yet when playback resumes.
            (player as any).duration = NaN;
            timeupdate();
            expect(callsWithDuration()).toHaveLength(0);

            durationchange(CONTENT_DURATION);
            expect(videoAnalytics.setContentInfo).toHaveBeenLastCalledWith(
                expect.objectContaining({ [Constants.DURATION]: CONTENT_DURATION })
            );
            expect(contentInfoCalls()).not.toContainEqual(
                expect.objectContaining({ [Constants.DURATION]: AD_DURATION })
            );
            timeupdate();
            expect(callsWithDuration()).toHaveLength(1);
        });

        it('still reports the content duration when the preroll fails and no ad break ever starts', () => {
            createHandler();
            play(NaN);

            // An empty or failed preroll still routes the ad player without an ad break.
            ads.playing = true;
            durationchange(CONTENT_DURATION);
            expect(callsWithDuration()).toHaveLength(0);

            ads.playing = false;
            timeupdate();
            expect(videoAnalytics.setContentInfo).toHaveBeenLastCalledWith(
                expect.objectContaining({ [Constants.DURATION]: CONTENT_DURATION })
            );
        });

        it('reports the duration immediately during a server-side ad break', () => {
            createHandler();
            play(NaN);
            ads.playing = true;
            ads.currentAdBreak = { integration: 'google-dai', timeOffset: 0 };
            durationchange(CONTENT_DURATION);
            expect(videoAnalytics.setContentInfo).toHaveBeenLastCalledWith(
                expect.objectContaining({ [Constants.DURATION]: CONTENT_DURATION })
            );
        });
    });

    describe('isLive reporting with a preroll', () => {
        it('never derives isLive from the ad duration and reports live content as LIVE', () => {
            createHandler();
            play(NaN);
            ads.playing = true;
            ads.currentAdBreak = { integration: 'google-ima', timeOffset: 0 };
            durationchange(AD_DURATION);
            expect(contentInfoCalls()).not.toContainEqual(
                expect.objectContaining({ [Constants.IS_LIVE]: expect.anything() })
            );

            ads.playing = false;
            ads.currentAdBreak = null;
            durationchange(Infinity);
            timeupdate();
            expect(videoAnalytics.setContentInfo).toHaveBeenLastCalledWith(
                expect.objectContaining({ [Constants.IS_LIVE]: Constants.StreamType.LIVE })
            );
        });

        it('leaves a consumer-configured isLive untouched', () => {
            createHandler({ [Constants.IS_LIVE]: Constants.StreamType.VOD });
            play(NaN);
            ads.playing = true;
            ads.currentAdBreak = { integration: 'google-ima', timeOffset: 0 };
            durationchange(AD_DURATION);
            ads.playing = false;
            ads.currentAdBreak = null;
            durationchange(Infinity);
            timeupdate();
            expect(contentInfoCalls()).not.toContainEqual(
                expect.objectContaining({ [Constants.IS_LIVE]: expect.anything() })
            );
        });
    });

    describe('without ads', () => {
        it('reports the content duration on durationchange', () => {
            createHandler();
            play(NaN);
            durationchange(CONTENT_DURATION);
            expect(videoAnalytics.setContentInfo).toHaveBeenLastCalledWith(
                expect.objectContaining({ [Constants.DURATION]: CONTENT_DURATION })
            );
        });
    });

    describe('onError', () => {
        function dispatchError() {
            playerDispatcher.dispatch('error', { type: 'error', errorObject: { message: 'Playback failed' } });
        }

        it('reports -1 as the duration when playback fails during a preroll', () => {
            createHandler();
            play(NaN);
            ads.playing = true;
            ads.currentAdBreak = { integration: 'google-ima', timeOffset: 0 };
            durationchange(AD_DURATION);
            dispatchError();
            expect(videoAnalytics.reportPlaybackFailed).toHaveBeenCalledWith('Playback failed', {
                [Constants.DURATION]: -1
            });
        });

        it('reports no duration override when playback fails during a midroll', () => {
            createHandler();
            play(CONTENT_DURATION);
            ads.playing = true;
            ads.currentAdBreak = { integration: 'google-ima', timeOffset: 300 };
            durationchange(AD_DURATION);
            dispatchError();
            expect(videoAnalytics.reportPlaybackFailed).toHaveBeenCalledWith('Playback failed', {});
        });

        it('reports -1 as the duration when playback fails without a known duration', () => {
            createHandler();
            play(NaN);
            dispatchError();
            expect(videoAnalytics.reportPlaybackFailed).toHaveBeenCalledWith('Playback failed', {
                [Constants.DURATION]: -1
            });
        });

        it('reports no duration override when playback fails during content', () => {
            createHandler();
            play(CONTENT_DURATION);
            dispatchError();
            expect(videoAnalytics.reportPlaybackFailed).toHaveBeenCalledWith('Playback failed', {});
        });
    });

    it('does not report metadata on a timeupdate after the session was released', () => {
        createHandler();
        play(NaN);
        ads.playing = true;
        durationchange(AD_DURATION);

        // An error releases the session directly, leaving `playbackRequested` set.
        playerDispatcher.dispatch('error', { type: 'error', errorObject: { message: 'Playback failed' } });
        ads.playing = false;
        const callsAfterError = vi.mocked(videoAnalytics.setContentInfo).mock.calls.length;
        timeupdate();
        expect(vi.mocked(videoAnalytics.setContentInfo).mock.calls.length).toBe(callsAfterError);
    });
});
