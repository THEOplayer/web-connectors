import { beforeEach, describe, expect, it } from 'vitest';
import type { LensPlayerFact, LensPlayerProperties } from '@dolby-optiview/lens-sdk';
import { THEOplayerAdapter } from '../../src/THEOplayerAdapter';
import { FakeMediaTrack, FakePlayer, FakeTimeRanges } from './FakePlayer';

const HLS = { src: 'https://cdn.example.com/stream/index.m3u8', type: 'application/x-mpegurl' };
const DASH = { src: 'https://cdn.example.com/stream/manifest.mpd', type: 'application/dash+xml' };

describe('THEOplayerAdapter', () => {
    let player: FakePlayer;
    let adapter: THEOplayerAdapter;
    let facts: LensPlayerFact[];
    let unsubscribe: () => void;

    const subscribe = () => {
        unsubscribe = adapter.subscribe((fact) => facts.push(fact));
    };
    const last = () => facts[facts.length - 1];
    const lastProperties = () => (last() as { properties?: LensPlayerProperties }).properties;

    beforeEach(() => {
        player = new FakePlayer();
        adapter = new THEOplayerAdapter(player.asPlayer);
        facts = [];
    });

    it('names the player', () => {
        expect(adapter.playerName).toBe('THEOplayer');
        expect(adapter.playerVersion).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('delivers the current state first', () => {
        player.source = { sources: [HLS] };
        player.autoplay = true;
        player.readyState = 4;
        player.duration = 60;
        subscribe();
        expect(facts).toEqual([
            {
                type: 'initial',
                source: { url: HLS.src, mimeType: HLS.type, autoplay: true, preload: 'metadata' },
                properties: {
                    live: false,
                    lowLatency: false,
                    targetBuffer: 20,
                    bufferStable: true,
                    hasMediaData: true,
                    playbackRate: 1,
                    muted: false,
                    volume: 1,
                    presentationMode: 'inline'
                }
            }
        ]);
    });

    it('delivers no source while the player has none', () => {
        subscribe();
        expect(facts[0]).toMatchObject({ type: 'initial', source: null });
        expect(lastProperties()).not.toHaveProperty('hasMediaData');
    });

    it('reports a new source once, with the state of the new source', () => {
        player.source = { sources: [DASH] };
        player.readyState = 4;
        player.duration = 60;
        subscribe();
        player.videoTracks.add(new FakeMediaTrack(1, true, [{ uid: 11, bandwidth: 800_000, codecs: 'avc1' }]));
        facts = [];
        player.preload = '';
        player.setSource({ sources: 'https://cdn.example.com/other.m3u8' });
        expect(facts).toEqual([
            {
                type: 'source',
                source: { url: 'https://cdn.example.com/other.m3u8', autoplay: false },
                properties: {
                    targetBuffer: 20,
                    bufferStable: false,
                    hasMediaData: false,
                    playbackRate: 1,
                    muted: false,
                    volume: 1,
                    presentationMode: 'inline'
                }
            }
        ]);
    });

    it('reports a new source before the stall THEOplayer fires while loading it', () => {
        player.source = { sources: [DASH] };
        player.paused = false;
        player.readyState = 4;
        subscribe();
        player.dispatch('play');
        facts = [];
        player.source = { sources: [HLS] };
        player.readyState = 0;
        player.dispatch('waiting');
        player.dispatch('sourcechange');
        expect(facts.map((fact) => fact.type)).toEqual(['source', 'play', 'waiting']);
        expect(facts[0]).toMatchObject({ source: { url: HLS.src } });
    });

    it('reports a play request when playback starts without one', () => {
        subscribe();
        player.setSource({ sources: [HLS] });
        player.paused = false;
        facts = [];
        player.dispatch('playing');
        player.dispatch('waiting');
        expect(facts.map((fact) => fact.type)).toEqual(['play', 'playing', 'waiting']);
    });

    it('reports the content ID the integrator provides', () => {
        adapter = new THEOplayerAdapter(player.asPlayer, (source) => source.metadata?.title);
        subscribe();
        player.setSource({ sources: { ssai: { integration: 'google-dai' } } as never, metadata: { title: 'movie-1' } });
        expect(last()).toMatchObject({ type: 'source', source: { contentId: 'movie-1' } });
        expect((last() as { source: object }).source).not.toHaveProperty('url');
    });

    it('reports the removal of the source', () => {
        player.source = { sources: [HLS] };
        subscribe();
        facts = [];
        player.setSource(undefined);
        expect(facts).toEqual([expect.objectContaining({ type: 'source', source: null })]);
    });

    it('reports a fallback to another source of the same description as a continuation', () => {
        subscribe();
        player.setSource({ sources: [DASH, HLS] });
        const count = facts.length;
        player.dispatch('currentsourcechange', { currentSource: { ...DASH } });
        expect(facts.length).toBe(count);
        player.dispatch('currentsourcechange', { currentSource: HLS });
        expect(last()).toMatchObject({
            type: 'source',
            source: { url: HLS.src, mimeType: HLS.type },
            continuation: true
        });
    });

    it('pushes held media and buffer stability when they flip', () => {
        player.source = { sources: [HLS] };
        subscribe();
        expect(lastProperties()).toMatchObject({ hasMediaData: false, bufferStable: false });
        player.readyState = 2;
        player.dispatch('readystatechange');
        expect(last()).toMatchObject({ type: 'change', properties: { hasMediaData: true, bufferStable: false } });
        const count = facts.length;
        player.readyState = 3;
        player.dispatch('readystatechange');
        expect(facts.length).toBe(count);
        player.readyState = 4;
        player.dispatch('readystatechange');
        expect(last()).toMatchObject({ type: 'change', properties: { hasMediaData: true, bufferStable: true } });
    });

    it('pushes a buffer drop before the seek or stall that caused it', () => {
        player.source = { sources: [HLS] };
        player.readyState = 4;
        subscribe();
        for (const type of ['seeking', 'waiting'] as const) {
            facts = [];
            player.readyState = 1;
            player.dispatch(type);
            player.readyState = 4;
            player.dispatch('readystatechange');
            expect(facts.map((fact) => fact.type)).toEqual(['change', type, 'change']);
            expect(facts[0]).toMatchObject({ properties: { bufferStable: false } });
        }
    });

    it('reports a live stream, and low latency when the source asks for it', () => {
        player.source = { sources: [{ ...HLS, lowLatency: true }] };
        subscribe();
        expect(lastProperties()).not.toHaveProperty('live');
        player.duration = Infinity;
        player.dispatch('durationchange');
        expect(last()).toMatchObject({ type: 'change', properties: { live: true, lowLatency: true } });
    });

    it('leaves low latency unknown for a live source that does not ask for it', () => {
        player.source = { sources: [HLS] };
        player.duration = Infinity;
        subscribe();
        expect(lastProperties()).toMatchObject({ live: true });
        expect(lastProperties()).not.toHaveProperty('lowLatency');
    });

    it('reports the tracks and the rendered quality', () => {
        player.source = { sources: [HLS] };
        subscribe();
        const low = { uid: 11, bandwidth: 800_000, codecs: 'avc1.4d401e', width: 640, height: 360, frameRate: 25 };
        const high = { uid: 12, bandwidth: 3_000_000, averageBandwidth: 2_500_000, codecs: 'avc1.640028' };
        const video = new FakeMediaTrack(1, true, [low, high]);
        player.videoTracks.add(video);
        const audioQuality = { uid: 21, bandwidth: 800_000, codecs: 'mp4a.40.2' };
        player.audioTracks.add(new FakeMediaTrack(2, true, [audioQuality], 'en', 'English'));
        player.textTracks.add({ uid: 3, kind: 'subtitles', mode: 'showing', language: 'nl', label: '' });
        player.textTracks.add({ uid: 4, kind: 'metadata', mode: 'hidden', language: '', label: '' });
        video.activeQuality = high;
        video.dispatch('activequalitychanged', { quality: high });
        expect(lastProperties()?.tracks).toEqual([
            {
                id: 'video-1',
                kind: 'video',
                selected: true,
                renditions: [
                    {
                        id: '11',
                        bitrate: 800_000,
                        combinedBitrate: true,
                        codecs: 'avc1.4d401e',
                        width: 640,
                        height: 360,
                        frameRate: 25
                    },
                    {
                        id: '12',
                        bitrate: 3_000_000,
                        combinedBitrate: true,
                        averageBitrate: 2_500_000,
                        codecs: 'avc1.640028'
                    }
                ],
                renderedRenditionId: '12'
            },
            { id: 'audio-2', kind: 'audio', selected: true, language: 'en', label: 'English' },
            { id: 'text-3', kind: 'text', selected: true, language: 'nl' }
        ]);
    });

    it('reports separate bitrates outside HLS', () => {
        player.source = { sources: [DASH] };
        subscribe();
        player.videoTracks.add(new FakeMediaTrack(1, true, [{ uid: 11, bandwidth: 800_000, codecs: 'avc1' }]));
        player.audioTracks.add(new FakeMediaTrack(2, true, [{ uid: 21, bandwidth: 0, codecs: 'mp4a' }]));
        player.audioTracks.add(new FakeMediaTrack(3, false, [{ uid: 31, bandwidth: 128_000, codecs: 'mp4a' }]));
        expect(lastProperties()?.tracks).toEqual([
            {
                id: 'video-1',
                kind: 'video',
                selected: true,
                renditions: [{ id: '11', bitrate: 800_000, codecs: 'avc1' }]
            },
            { id: 'audio-2', kind: 'audio', selected: true },
            {
                id: 'audio-3',
                kind: 'audio',
                selected: false,
                renditions: [{ id: '31', bitrate: 128_000, codecs: 'mp4a' }]
            }
        ]);
    });

    it('stops observing a removed track', () => {
        subscribe();
        const video = new FakeMediaTrack(1, true);
        player.videoTracks.add(video);
        player.videoTracks.remove(video);
        expect(video.listenerCount()).toBe(0);
    });

    it('pushes rate, volume, presentation mode and the player view', () => {
        subscribe();
        player.playbackRate = 2;
        player.dispatch('ratechange');
        expect(lastProperties()).toMatchObject({ playbackRate: 2 });
        player.muted = true;
        player.dispatch('volumechange');
        expect(lastProperties()).toMatchObject({ muted: true });
        player.presentation.currentMode = 'native-picture-in-picture';
        player.presentation.dispatch('presentationmodechange');
        expect(lastProperties()).toMatchObject({ presentationMode: 'pip' });
        player.visibility.observers[0](0);
        expect(lastProperties()).toMatchObject({ visibility: 'hidden' });
        player.visibility.observers[0](0.5);
        expect(lastProperties()).toMatchObject({ visibility: 'visible' });
    });

    it('reports playback facts', () => {
        subscribe();
        facts = [];
        for (const type of ['play', 'playing', 'pause', 'seeked', 'ended']) player.dispatch(type);
        expect(facts).toEqual([
            { type: 'play' },
            { type: 'playing' },
            { type: 'pause' },
            { type: 'seeked' },
            { type: 'ended' }
        ]);
    });

    it('reports a player error as fatal, on one line', () => {
        subscribe();
        const errorObject = { code: 4000, message: 'Failed to load\nsegment', cause: new Error('HTTP 404') };
        player.dispatch('error', { errorObject });
        expect(last()).toEqual({
            type: 'error',
            fatal: true,
            code: '4000',
            message: 'Failed to load segment (HTTP 404)'
        });
    });

    it('samples the playhead, buffer and metrics', () => {
        player.source = { sources: [HLS] };
        player.currentTime = 12;
        player.duration = 60;
        player.currentProgramDateTime = new Date(1_700_000_000_000);
        player.seekable = new FakeTimeRanges([[0, 60]]);
        player.buffered = new FakeTimeRanges([[10, 30]]);
        player.metrics.currentBandwidthEstimate = 5_000_000;
        player.metrics.droppedVideoFrames = 3;
        subscribe();
        expect(adapter.snapshot()).toEqual({
            currentTime: 12,
            paused: true,
            ended: false,
            playheadDateTime: 1_700_000_000_000,
            duration: 60,
            seekable: [{ start: 0, end: 60 }],
            buffered: [{ ranges: [{ start: 10, end: 30 }] }],
            measuredThroughput: 5_000_000,
            droppedFrames: 3,
            viewWidth: 640,
            viewHeight: 360
        });
    });

    it('leaves out what is unknown from a sample', () => {
        expect(adapter.snapshot()).toEqual({
            currentTime: 0,
            paused: true,
            ended: false,
            droppedFrames: 0,
            viewWidth: 640,
            viewHeight: 360
        });
    });

    it('stops observing the player once unsubscribed', () => {
        player.videoTracks.add(new FakeMediaTrack(1, true));
        subscribe();
        expect(player.totalListenerCount()).toBeGreaterThan(0);
        unsubscribe();
        expect(player.totalListenerCount()).toBe(0);
        player.dispatch('play');
        expect(last().type).toBe('initial');
    });
});
