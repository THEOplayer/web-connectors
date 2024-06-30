import { ChromelessPlayer } from 'theoplayer';
import { GemiusTHEOIntegration } from '../integration/GemiusTHEOIntegration';



export class GemiusConnector {

    private gemiusIntegration: GemiusTHEOIntegration;


    /**
     * Constructor for the THEOplayer Gemius connector
     * @param player a THEOplayer instance reference
     * @param param1 docs
     * @param param2 docs
     * @returns 
     */
    constructor(player: ChromelessPlayer, param1: any, param2: any) {
        this.gemiusIntegration = new GemiusTHEOIntegration(player)
    }



    /**
     * Destroy 
     */
    destroy(): void {
        // TODO
    }
}