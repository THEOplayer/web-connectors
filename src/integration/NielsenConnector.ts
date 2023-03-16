import { ChromelessPlayer } from "theoplayer";
import { NielsenOptions } from "../nielsen/Types";
import { NielsenHandler } from "./NielsenHandler";

export class NielsenConnector {

    private nielsenHandler: NielsenHandler

    constructor(player: ChromelessPlayer, appId: string, channelName: string, options: NielsenOptions) {
        this.nielsenHandler = new NielsenHandler(player, appId, channelName, options);
    }

    updateMetadata(metadata: { [ key: string ]: string }): void {
        this.nielsenHandler.updateMetadata(metadata);
    }

    destroy() {
        this.nielsenHandler.destroy();
    }
}
