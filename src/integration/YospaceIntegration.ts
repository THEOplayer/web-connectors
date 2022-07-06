import { ChromelessPlayer, SourceDescription } from "theoplayer";
import { YospaceManager } from "./YospaceManager";
import { SessionProperties } from "../yospace/SessionProperties";

export class YospaceIntegration {
    private player: ChromelessPlayer;

    private yospaceManager: YospaceManager;

    constructor(player: ChromelessPlayer) {
        this.player = player;
        this.yospaceManager = new YospaceManager(player);
    }

    /**
     * Creates the Yospace session and sets the Yospace source from the session to the player.
     *
     * @param sourceDescription the source that will be used to create the Yospace session.
     * @param sessionProperties the properties that will be used set to customize the Yospace session.
     */
    async setupYospaceSession(
        sourceDescription: SourceDescription,
        sessionProperties?: SessionProperties
    ): Promise<void> {
        await this.yospaceManager.createYospaceSource(sourceDescription, sessionProperties);
    }
}
