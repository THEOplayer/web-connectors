import type { ChromelessPlayer } from 'theoplayer';
import {
    AdLoadType,
    HasAds,
    NielsenConfiguration,
    NielsenCountry,
    NielsenDCRContentMetadata,
    NielsenDCRContentMetadataCZ,
    NielsenHandler,
    NielsenOptions
} from '../nielsen/Types';
import { NielsenHandlerDCR } from './NielsenHandlerDCR';
import { NielsenHandlerDTVR } from './NielsenHandlerDTVR';

export class NielsenConnector {
    private nielsenHandler: NielsenHandler;

    /**
     * Create NielsenConnector
     *
     * @param player        THEOplayer instance.
     * @param appId         UniqueID assigned to player/site.
     * @param instanceName  User-defined string value for describing the player/site.
     * @param options       Additional options.
     * @param configuration Specifies nielsen configuration, e.g. handler type.
     */
    constructor(
        player: ChromelessPlayer,
        appId: string,
        instanceName: string,
        options?: NielsenOptions,
        configuration?: NielsenConfiguration
    ) {
        if (configuration?.country === NielsenCountry.US) {
            this.nielsenHandler = new NielsenHandlerDTVR(player, appId, instanceName, options, configuration);
        } else {
            this.nielsenHandler = new NielsenHandlerDCR(player, appId, instanceName, options, configuration);
        }
    }

    updateMetadata(metadata: { [key: string]: string }): void {
        this.nielsenHandler.updateMetadata(metadata);
    }

    destroy() {
        this.nielsenHandler.destroy();
    }
}
