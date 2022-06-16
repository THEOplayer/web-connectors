import {ChromelessPlayer, SourceDescription} from "theoplayer";
import {YospaceManager} from "./YospaceManager";

export class YospaceIntegration {

    private player: ChromelessPlayer;

    private yospaceManager: YospaceManager;

    constructor(player: ChromelessPlayer) {
        this.player = player;
        this.yospaceManager = new YospaceManager(player);
    }

    async createYospaceSource(sourceDescription: SourceDescription): Promise<void> {
        await this.yospaceManager.createYospaceSource(sourceDescription);
    }

}
