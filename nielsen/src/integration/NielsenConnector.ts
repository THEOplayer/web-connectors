import type { ChromelessPlayer } from 'theoplayer';
import type { NielsenConfiguration, NielsenDCRContentMetadata, NielsenOptions } from '../nielsen/Types';
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
    constructor(
        player: ChromelessPlayer,
        appId: string,
        instanceName: string,
        options?: NielsenOptions,
        configuration?: NielsenConfiguration
    ) {
        this.nielsenHandler = new NielsenHandler(player, appId, instanceName, options, configuration);
    }

    updateMetadata(metadata: { [key: string]: string }): void {
        this.nielsenHandler.updateMetadata(metadata);
    }

    updateDCRContentMetadata(metadata: NielsenDCRContentMetadata): void {
        this.nielsenHandler.updateDCRContentMetadata(metadata);
    }

    destroy() {
        this.nielsenHandler.destroy();
    }
}
