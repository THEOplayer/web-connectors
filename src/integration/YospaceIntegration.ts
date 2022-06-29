import {ChromelessPlayer, SourceDescription} from "theoplayer";
import {YospaceManager} from "./YospaceManager";
import {SessionProperties} from "../yospace/SessionProperties";

export class YospaceIntegration {

    private player: ChromelessPlayer;

    private yospaceManager: YospaceManager;

    constructor(player: ChromelessPlayer) {
        this.player = player;
        this.yospaceManager = new YospaceManager(player);
    }

    /**
     * Creates a yospace session and set the source of the player with the yospace source.
     *
     * @param sourceDescription
     * @param sessionProperties
     */
    async createYospaceSource(sourceDescription: SourceDescription, sessionProperties?: SessionProperties): Promise<void> {
        await this.yospaceManager.createYospaceSource(sourceDescription, sessionProperties);
    }

}
