import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Lens } from '@dolby-optiview/lens-sdk';
import { LensConnector } from '../../src/LensConnector';
import { FakeMediaTrack, FakePlayer } from './FakePlayer';

const DESTINATION = 'https://collector.example.com/lens';

type Report = Record<string, unknown>;

describe('LensConnector', () => {
    let reports: Report[];
    let player: FakePlayer;

    const connect = () =>
        new LensConnector(player.asPlayer, {
            heartbeatMs: 0,
            destinations: [{ url: DESTINATION, format: 'json' }]
        });
    const states = () => reports.filter((report) => report.e === 'ps').map((report) => report.sta);

    beforeAll(() => {
        Lens.configure({ backend: 'disabled' });
    });

    beforeEach(() => {
        reports = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (_url: string, init: RequestInit) => {
                reports.push(...JSON.parse(init.body as string).reports);
                return new Response(null, { status: 204 });
            })
        );
        player = new FakePlayer();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('reports a playback session of the player', async () => {
        const connector = connect();
        player.setSource({ sources: [{ src: 'https://cdn.example.com/movie.m3u8' }] });
        player.paused = false;
        player.dispatch('play');
        player.readyState = 4;
        player.dispatch('readystatechange');
        player.dispatch('playing');
        await vi.waitFor(() => expect(states()).toEqual(['s', 'p']));
        expect(reports[0]).toMatchObject({ ns: 'lens', cid: 'https://cdn.example.com/movie.m3u8', sf: 'h' });
        expect(connector.handle.session).not.toBeNull();
        connector.destroy();
        await vi.waitFor(() => expect(states()).toEqual(['s', 'p', 'q']));
    });

    for (const keyFirst of [true, false]) {
        it(`shares its session with a handle joined on the player, ${keyFirst ? 'before' : 'after'} it`, async () => {
            const warn = vi.spyOn(console, 'warn');
            const joinKey = () => Lens.join({ namespace: 'ads', player: player.asPlayer });
            const ads = keyFirst ? joinKey() : undefined;
            const connector = connect();
            const handle = ads ?? joinKey();
            player.setSource({ sources: [{ src: 'https://cdn.example.com/movie.m3u8' }] });
            player.dispatch('play');
            await vi.waitFor(() => expect(connector.handle.session).not.toBeNull());
            expect(handle.session?.sessionId).toBe(connector.handle.session?.sessionId);
            expect(warn).not.toHaveBeenCalled();
            handle.dispose();
            connector.destroy();
        });
    }

    it('reports its heartbeats in the theoplayer namespace', async () => {
        const connector = new LensConnector(player.asPlayer, {
            destinations: [{ url: DESTINATION, format: 'json', heartbeat: true }]
        });
        player.setSource({ sources: [{ src: 'https://cdn.example.com/movie.m3u8' }] });
        player.dispatch('play');
        await vi.waitFor(() => expect(reports).toContainEqual(expect.objectContaining({ e: 't', ns: 'theoplayer' })));
        connector.destroy();
    });

    it('starts no session for a play request made before the source', async () => {
        const connector = connect();
        // THEOplayer fires `play` without a source, then stays paused once one is set.
        player.dispatch('play');
        player.setSource({ sources: [{ src: 'https://cdn.example.com/movie.m3u8' }] });
        player.readyState = 4;
        player.dispatch('readystatechange');
        expect(connector.handle.session).toBeNull();
        player.paused = false;
        player.dispatch('play');
        // Had the first request started the session, the media held before this one would not show as preloaded.
        await vi.waitFor(() => expect(states()).toEqual(['d', 's']));
        connector.destroy();
    });

    it('reports a fatal player error and ends the session', async () => {
        const connector = connect();
        player.setSource({ sources: [{ src: 'https://cdn.example.com/movie.m3u8' }] });
        player.dispatch('play');
        player.dispatch('error', { errorObject: { code: 4000, message: 'Bad segment' } });
        await vi.waitFor(() => expect(states()).toEqual(['s', 'f']));
        expect(reports).toContainEqual(expect.objectContaining({ e: 'e', ec: ['4000'] }));
        expect(connector.handle.session).toBeNull();
        connector.destroy();
    });

    it('stops reporting when the player is destroyed', async () => {
        const warn = vi.spyOn(console, 'warn');
        const connector = connect();
        player.setSource({ sources: [{ src: 'https://cdn.example.com/movie.m3u8' }] });
        player.videoTracks.add(new FakeMediaTrack(1, true));
        player.dispatch('play');
        await vi.waitFor(() => expect(states()).toEqual(['s']));
        player.destroy();
        await vi.waitFor(() => expect(states()).toEqual(['s', 'q']));
        expect(connector.handle.session).toBeNull();
        expect(warn).not.toHaveBeenCalled();
    });

    it('stops observing the player when destroyed', () => {
        const connector = connect();
        connector.destroy();
        expect(player.totalListenerCount()).toBe(0);
    });
});
