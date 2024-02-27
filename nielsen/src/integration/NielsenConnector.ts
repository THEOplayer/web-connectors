import { ChromelessPlayer } from 'theoplayer';
import { NielsenOptions } from '../nielsen/Types';
import { NielsenHandler } from './NielsenHandler';

export class NielsenConnector {
    private nielsenHandler: NielsenHandler;

    /**
     * Create NielsenConnector
     *
     * @param player        THEOplayer instance.
     * @param appId         UniqueID assigned to player/site.
     * @param instanceName  User-defined string value for describing the player/site.
     * @param options       Additional options.
     */
    constructor(player: ChromelessPlayer, appId: string, instanceName: string, options?: NielsenOptions) {
        this.nielsenHandler = new NielsenHandler(player, appId, instanceName, options);
    }

    updateMetadata(metadata: { [key: string]: string }): void {
        this.nielsenHandler.updateMetadata(metadata);
    }

    destroy() {
        this.nielsenHandler.destroy();
    }
}
