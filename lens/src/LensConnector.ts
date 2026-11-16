import type { ChromelessPlayer } from 'theoplayer';
import {
    Lens,
    type LensHandle,
    type LensJoinOptions,
    type LensPlayerAdapter,
    type LensSession,
    type LensSessionChangeEvent
} from '@dolby-optiview/lens-sdk';
import { type ContentIdProvider, THEOplayerAdapter } from './THEOplayerAdapter';

const NAMESPACE = 'theoplayer';

/** `player.cmcd`, from THEOplayer 11.16.0 on, and only in builds with CMCD. */
interface PlayerCmcd {
    readonly cmcd?: { linkedSessionId: string | undefined };
}

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
 * playback states, errors and the player's CMCD keys. Where the player has `player.cmcd`, the connector keeps its
 * `linkedSessionId` equal to the Lens session, so the player's own CMCD data links to it.
 */
export class LensConnector {
    /**
     * The Lens handle the connector joined with, in the `theoplayer` namespace. Use it to set consent or flush. To
     * report events of your own, join Lens in your own namespace with the player.
     */
    readonly handle: LensHandle;

    /**
     * The Lens player adapter the connector joined with. Lens keys the player's session on the player, so another SDK
     * reporting to Lens joins with the player itself to share it.
     */
    readonly adapter: LensPlayerAdapter;

    private readonly player: ChromelessPlayer;
    private readonly removeSessionListener: () => void;
    private playerDestroyed = false;

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
        this.removeSessionListener = this.handle.addEventListener('sessionchange', this.onSessionChange);
        // Registering does not replay the session Lens may already have decided.
        this.linkSession(this.handle.session);
        player.addEventListener('destroy', this.onDestroy);
    }

    /**
     * Ends the session and stops reporting the player. The connector is destroyed with its player.
     */
    destroy(): void {
        this.player.removeEventListener('destroy', this.onDestroy);
        this.removeSessionListener();
        this.handle.dispose();
        // A destroyed player's getters throw, and it has nothing left to link.
        if (!this.playerDestroyed) this.linkSession(null);
    }

    private linkSession(session: LensSession | null): void {
        const { cmcd } = this.player as PlayerCmcd;
        if (cmcd) cmcd.linkedSessionId = session?.sessionId;
    }

    private readonly onSessionChange = (event: LensSessionChangeEvent): void => {
        this.linkSession(event.session);
    };

    private readonly onDestroy = (): void => {
        this.playerDestroyed = true;
        this.destroy();
    };
}
