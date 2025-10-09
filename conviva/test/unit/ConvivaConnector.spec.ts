import { beforeEach, describe, expect, it } from 'vitest';
import { type ConvivaConfiguration, ConvivaConnector } from '@theoplayer/conviva-connector-web';
import { ConvivaMetadata } from '@convivainc/conviva-js-coresdk';
import { ChromelessPlayer } from 'theoplayer';
import { afterEach } from 'node:test';

describe('ConvivaConnector', () => {
    let player: ChromelessPlayer;
    beforeEach(() => {
        player = new ChromelessPlayer(document.createElement('div'));
    });
    afterEach(() => {
        player?.destroy();
    });

    it('can be constructed', () => {
        const convivaMetadata: ConvivaMetadata = {};
        const convivaConfig: ConvivaConfiguration = {
            customerKey: 'test'
        };
        const connector = new ConvivaConnector(player, convivaMetadata, convivaConfig);
        expect(connector).toBeDefined();
    });
});
