import { ChromelessPlayer } from 'theoplayer';
import { AdScriptTHEOIntegration } from './AdScriptTHEOIntegration';
import { AdScriptConfiguration } from './AdScriptConfiguration';
import { MainVideoContentMetadata } from '../adscript/AdScript';

export class AdScriptConnector {

    private adscriptIntegration: AdScriptTHEOIntegration | undefined;

    /**
     * Constructor for the THEOplayer AdScript connector
     * @param player a THEOplayer instance reference
     * @param configuration a configuration object for the AdScript connector
     * @returns 
     */
    constructor(player: ChromelessPlayer, configuration: AdScriptConfiguration, metadata: MainVideoContentMetadata)  {
        if (!window.JHMTApi || !window.JHMT) {
            console.error('JHMT API not found, make sure you included the script to initialize AdScript Measurement')
            return;
        }
        this.adscriptIntegration = new AdScriptTHEOIntegration(player, configuration, metadata)
    }

    updateMetadata(metadata: any): void {
        this.adscriptIntegration?.updateMetadata(metadata)
    }


    /**
     * Destroy 
     */
    destroy(): void {
        this.adscriptIntegration?.destroy()
    }
}