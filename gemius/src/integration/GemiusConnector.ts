import { ChromelessPlayer } from 'theoplayer';
import { GemiusTHEOIntegration } from './GemiusTHEOIntegration';
import { GemiusConfiguration } from './GemiusConfiguration';

export class GemiusConnector {

    private gemiusIntegration: GemiusTHEOIntegration;

    /**
     * Constructor for the THEOplayer Gemius connector
     * @param player a THEOplayer instance reference
     * @param configuration a configuration object for the Gemius connector
     * @param param2 docs
     * @returns 
     */
    constructor(player: ChromelessPlayer, configuration: GemiusConfiguration, param2: any) {
        this.gemiusIntegration = new GemiusTHEOIntegration(player, configuration)
    }


    /**
     * Destroy 
     */
    destroy(): void {
        this.gemiusIntegration.destroy()
    }
}