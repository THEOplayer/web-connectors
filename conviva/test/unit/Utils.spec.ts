import { describe, expect, it } from 'vitest';
import type { Interstitial } from 'theoplayer';
import { isPastInterstitial } from '../../src/utils/Utils';

function interstitial(startTime: number, duration: number | undefined): Interstitial {
    return { startTime, duration } as Interstitial;
}

describe('isPastInterstitial', () => {
    it('is false for a break which has not been reached yet', () => {
        expect(isPastInterstitial(interstitial(60, 30), 10)).toBe(false);
    });

    it('is false for the break currently being entered', () => {
        expect(isPastInterstitial(interstitial(60, 30), 60)).toBe(false);
    });

    it('is true for a break which lies entirely behind the current time', () => {
        expect(isPastInterstitial(interstitial(60, 30), 120)).toBe(true);
    });

    it('is false for a post-roll', () => {
        expect(isPastInterstitial(interstitial(-1, 30), 120)).toBe(false);
        expect(isPastInterstitial(interstitial(Infinity, 30), 120)).toBe(false);
    });
});
