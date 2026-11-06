import type { ChromelessPlayer } from 'theoplayer';
import { Lens, type LensHandle, type LensJoinOptions, type LensPlayerAdapter } from '@dolby-optiview/lens-sdk';
import { type ContentIdProvider, THEOplayerAdapter } from './THEOplayerAdapter';

const NAMESPACE = 'theoplayer';

/**
 * The configuration of a {@link LensConnector}: the options of `Lens.join`, without the `namespace` and the `player`,
 * which the connector provides.
 */
export interface LensConfiguration extends Omit<LensJoinOptions, 'namespace' | 'player'> {
    /**
     * Returns the content ID (1-128 printable ASCII) to report for a source. Without it, or when it returns
     * `undefined`, a Google DAI stream is named by its asset key or `contentSourceID/videoID`, and other sources by
     * the content ID Lens derives from their URL.
     */
    contentId?: ContentIdProvider;
}

/**
 * The connector between a THEOplayer instance and Dolby OptiView Lens.
 *
 * The connector joins Lens with a player adapter for the given player, so Lens reports playback on its own: sessions,
 * playback states, errors and the player's CMCD keys.
 */
export class LensConnector {
    /**
     * The Lens handle the connector joined with, in the `theoplayer` namespace. Use it to set consent or flush. To
     * report events of your own, join Lens in your own namespace with {@link LensConnector.adapter}.
     */
    readonly handle: LensHandle;

    /**
     * The Lens player adapter for the player. Another SDK reporting to Lens joins with this same adapter to share the
     * player's session.
     */
    readonly adapter: LensPlayerAdapter;

    private readonly player: ChromelessPlayer;

    /**
     * Creates a connector for the given player and joins Lens.
     *
     * @param player The THEOplayer instance to report.
     * @param configuration The options to join Lens with.
     */
    constructor(player: ChromelessPlayer, configuration: LensConfiguration = {}) {
        const { contentId, ...joinOptions } = configuration;
        this.player = player;
        this.adapter = new THEOplayerAdapter(player, contentId);
        this.handle = Lens.join({ ...joinOptions, namespace: NAMESPACE, player: this.adapter });
        player.addEventListener('destroy', this.onDestroy);
    }

    /**
     * Ends the session and stops reporting the player. The connector is destroyed with its player.
     */
    destroy(): void {
        this.player.removeEventListener('destroy', this.onDestroy);
        this.handle.dispose();
    }

    private readonly onDestroy = (): void => {
        this.destroy();
    };
}
