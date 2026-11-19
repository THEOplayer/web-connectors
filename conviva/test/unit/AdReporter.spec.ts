import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChromelessPlayer } from 'theoplayer';
import { AdReporter } from '../../src/integration/ads/AdReporter';
import { type AdAnalytics, Constants, type VideoAnalytics } from '../../src/utils/ConvivaSdk';

type Listener = (event: any) => void;

class Dispatcher {
    private listeners: Record<string, Listener[]> = {};

    addEventListener(type: string, fn: Listener) {
        (this.listeners[type] ??= []).push(fn);
    }

    removeEventListener(type: string, fn: Listener) {
        this.listeners[type] = (this.listeners[type] ?? []).filter((l) => l !== fn);
    }

    dispatch(type: string, event: unknown) {
        (this.listeners[type] ?? []).forEach((fn) => fn(event));
    }
}

describe('AdReporter', () => {
    let reporter: AdReporter;
    let player: ChromelessPlayer;
    let videoAnalytics: VideoAnalytics;
    let adAnalytics: AdAnalytics;

    beforeEach(() => {
        player = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            ads: new Dispatcher(),
            theoads: new Dispatcher(),
            currentTime: 0,
            source: { metadata: { title: 'Content' } }
        } as unknown as ChromelessPlayer;
        videoAnalytics = {
            getSessionId: vi.fn(() => 42),
            reportAdBreakStarted: vi.fn(),
            reportAdBreakEnded: vi.fn()
        } as unknown as VideoAnalytics;
        adAnalytics = {
            setCallback: vi.fn(),
            setAdPlayerInfo: vi.fn(),
            setAdInfo: vi.fn(),
            reportAdFailed: vi.fn()
        } as unknown as AdAnalytics;
        reporter = new AdReporter(player, videoAnalytics, adAnalytics, () => ({}));
    });

    afterEach(() => {
        reporter.destroy();
    });

    function interstitialError(startTime: number, duration = 30, type = 'adbreak', message = 'No Ads VAST response') {
        (player.theoads as unknown as Dispatcher).dispatch('interstitialerror', {
            type: 'interstitialerror',
            interstitial: { type, id: 'x', startTime, duration },
            message
        });
    }

    describe('interstitialerror', () => {
        it('reports a failed mid-roll ad break with its ad position', () => {
            interstitialError(865);
            expect(adAnalytics.setAdInfo).toHaveBeenCalledTimes(1);
            expect(adAnalytics.setAdInfo).toHaveBeenCalledWith(
                expect.objectContaining({
                    'c3.ad.position': Constants.AdPosition.MIDROLL,
                    'c3.ad.technology': 'Server Guided',
                    'c3.csid': '42',
                    contentAssetName: 'Content'
                })
            );
            expect(adAnalytics.reportAdFailed).toHaveBeenCalledTimes(1);
            expect(adAnalytics.reportAdFailed).toHaveBeenCalledWith('No Ads VAST response');
            expect(videoAnalytics.reportAdBreakStarted).toHaveBeenCalledTimes(1);
            expect(videoAnalytics.reportAdBreakStarted).toHaveBeenCalledWith(
                'Server Guided',
                Constants.AdPlayer.CONTENT,
                expect.objectContaining({ podPosition: Constants.AdPosition.MIDROLL })
            );
            expect(videoAnalytics.reportAdBreakEnded).toHaveBeenCalledTimes(1);
            const podStart = vi.mocked(videoAnalytics.reportAdBreakStarted).mock.invocationCallOrder[0];
            const setAdInfo = vi.mocked(adAnalytics.setAdInfo).mock.invocationCallOrder[0];
            const adFailed = vi.mocked(adAnalytics.reportAdFailed).mock.invocationCallOrder[0];
            const podEnd = vi.mocked(videoAnalytics.reportAdBreakEnded).mock.invocationCallOrder[0];
            expect(podStart).toBeLessThan(setAdInfo);
            expect(setAdInfo).toBeLessThan(adFailed);
            expect(adFailed).toBeLessThan(podEnd);
        });

        it('reports a failed pre-roll ad break with its ad position', () => {
            interstitialError(0);
            expect(adAnalytics.setAdInfo).toHaveBeenCalledWith(
                expect.objectContaining({ 'c3.ad.position': Constants.AdPosition.PREROLL })
            );
        });

        it('reports a failed post-roll ad break with its ad position', () => {
            interstitialError(-1);
            expect(adAnalytics.setAdInfo).toHaveBeenCalledWith(
                expect.objectContaining({ 'c3.ad.position': Constants.AdPosition.POSTROLL })
            );
        });

        it('reports a failed post-roll ad break with a non-finite start time', () => {
            interstitialError(Infinity);
            expect(adAnalytics.setAdInfo).toHaveBeenCalledWith(
                expect.objectContaining({ 'c3.ad.position': Constants.AdPosition.POSTROLL })
            );
        });

        it('ignores interstitial errors while an ad break is already playing', () => {
            (player.ads as unknown as Dispatcher).dispatch('adbreakbegin', {
                type: 'adbreakbegin',
                adBreak: { integration: 'theoads', timeOffset: 100, maxDuration: 30 }
            });
            expect(videoAnalytics.reportAdBreakStarted).toHaveBeenCalledTimes(1);
            interstitialError(865);
            expect(videoAnalytics.reportAdBreakStarted).toHaveBeenCalledTimes(1);
            expect(videoAnalytics.reportAdBreakEnded).not.toHaveBeenCalled();
            expect(adAnalytics.setAdInfo).not.toHaveBeenCalled();
            expect(adAnalytics.reportAdFailed).not.toHaveBeenCalled();
        });

        it('ignores interstitials which are not ad breaks', () => {
            interstitialError(10, 30, 'overlay');
            expect(videoAnalytics.reportAdBreakStarted).not.toHaveBeenCalled();
            expect(videoAnalytics.reportAdBreakEnded).not.toHaveBeenCalled();
            expect(adAnalytics.setAdInfo).not.toHaveBeenCalled();
            expect(adAnalytics.reportAdFailed).not.toHaveBeenCalled();
        });

        it('ignores interstitials which lie entirely in the past', () => {
            (player as any).currentTime = 120;
            interstitialError(10, 30);
            expect(videoAnalytics.reportAdBreakStarted).not.toHaveBeenCalled();
            expect(videoAnalytics.reportAdBreakEnded).not.toHaveBeenCalled();
            expect(adAnalytics.setAdInfo).not.toHaveBeenCalled();
            expect(adAnalytics.reportAdFailed).not.toHaveBeenCalled();
        });
    });
});
