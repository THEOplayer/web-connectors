import { ChromelessPlayer } from 'theoplayer';
import { AdScriptTHEOIntegration } from './AdScriptTHEOIntegration';
import { AdScriptConfiguration } from './AdScriptConfiguration';
import { MainVideoContentMetadata } from '../adscript/AdScript';
import { Logger } from '../utils/Logger';

export class AdScriptConnector {
    private adscriptIntegration: AdScriptTHEOIntegration | undefined;

    /**
     * Constructor for the THEOplayer AdScript connector.
     * @param player a THEOplayer instance reference
     * @param configuration a configuration object for the AdScript connector
     * @param metadata the MainVideoContentMetadata
     * @returns
     */
    constructor(player: ChromelessPlayer, configuration: AdScriptConfiguration, metadata: MainVideoContentMetadata) {
        const interval = window.setInterval(() => {
            if (typeof window.JHMTApi === 'object') {
                window.clearInterval(interval);
                const { i12n } = configuration;
                for (const id in i12n) {
                    window.JHMTApi.setI12n(id, i12n[id]);
                    Logger.logsetI12n(id, i12n[id]);
                }
                this.adscriptIntegration = new AdScriptTHEOIntegration(player, configuration, metadata);
            }
        }, 20);
        window.setTimeout(() => {
            if (!window.JHMTApi) {
                window.clearInterval(interval);
                console.error(
                    'JHMT API not found, make sure you included the script to initialize AdScript Measurement'
                );
                return;
            }
        }, 5000);
    }

    /**
     * Update the medata.
     * @param metadata The MainVideoContentMetadata.
     */
    updateMetadata(metadata: MainVideoContentMetadata): void {
        this.adscriptIntegration?.updateMetadata(metadata);
    }

    /**
     * Destroy
     */
    destroy(): void {
        this.adscriptIntegration?.destroy();
    }
}
