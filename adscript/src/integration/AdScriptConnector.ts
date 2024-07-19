import type { ChromelessPlayer } from 'theoplayer';
import { AdScriptTHEOIntegration } from './AdScriptTHEOIntegration';
import { AdScriptConfiguration } from './AdScriptConfiguration';
import { MainVideoContentMetadata } from '../adscript/AdScript';

export class AdScriptConnector {
    private readonly player: ChromelessPlayer;
    private readonly initialLoadTime: number;
    private readonly configuration: AdScriptConfiguration;
    private readonly metadata: MainVideoContentMetadata;

    private adScriptIntegration: AdScriptTHEOIntegration | undefined;
    private destroyed = false;

    /**
     * Constructor for the THEOplayer AdScript connector.
     * @param player a THEOplayer instance reference
     * @param configuration a configuration object for the AdScript connector
     * @param metadata the MainVideoContentMetadata
     * @returns
     */
    constructor(player: ChromelessPlayer, configuration: AdScriptConfiguration, metadata: MainVideoContentMetadata) {
        this.player = player;
        this.configuration = configuration;
        this.metadata = metadata;
        this.initialLoadTime = new Date().getTime();

        this.createAdScriptIntegrationWhenApiIsAvailable();
    }

    private readonly createAdScriptIntegrationWhenApiIsAvailable = () => {
        if (this.destroyed) {
            // The connector was destroyed before the API became available.
            // Don't bother creating the integration.
            return;
        }
        if (new Date().getTime() > this.initialLoadTime + 5_000) {
            console.error('JHMT API not found, make sure you included the script to initialize AdScript Measurement.');
            return;
        }
        if (typeof window.JHMTApi === 'object') {
            this.adScriptIntegration = new AdScriptTHEOIntegration(this.player, this.configuration, this.metadata);
            return;
        }
        setTimeout(this.createAdScriptIntegrationWhenApiIsAvailable, 20);
    };

    /**
     * Update the medata.
     * @param metadata The MainVideoContentMetadata.
     */
    updateMetadata(metadata: MainVideoContentMetadata): void {
        this.adScriptIntegration?.updateMetadata(metadata);
    }

    /**
     * Destroy
     */
    destroy(): void {
        this.destroyed = true;
        this.adScriptIntegration?.destroy();
    }
}
