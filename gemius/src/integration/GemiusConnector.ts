import type { ChromelessPlayer } from 'theoplayer';
import { GemiusTHEOIntegration } from './GemiusTHEOIntegration';
import type { GemiusConfiguration } from './GemiusConfiguration';
import type { GemiusProgramParameters } from './GemiusParameters';

export class GemiusConnector {
    private gemiusIntegration: GemiusTHEOIntegration;

    /**
     * Constructor for the THEOplayer Gemius connector
     * @param player a THEOplayer instance reference
     * @param configuration a configuration object for the Gemius connector
     * @param programParameters the parameters associated with the first source that will be set to the player
     * @returns
     */
    constructor(
        player: ChromelessPlayer,
        configuration: GemiusConfiguration,
        programParameters: GemiusProgramParameters
    ) {
        this.gemiusIntegration = new GemiusTHEOIntegration(player, configuration, programParameters);
    }

    update(programParameters: GemiusProgramParameters) {
        this.gemiusIntegration.update(programParameters);
    }

    /**
     * Destroy
     */
    destroy(): void {
        this.gemiusIntegration.destroy();
    }
}
