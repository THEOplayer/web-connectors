import type { ChromelessPlayer } from 'theoplayer';
import { AdScriptTHEOIntegration } from './AdScriptTHEOIntegration';
import { AdScriptConfiguration } from './AdScriptConfiguration';
import { MainVideoContentMetadata } from '../adscript/AdScript';
import { Logger } from '../utils/Logger';

export class AdScriptConnector {
    private readonly player: ChromelessPlayer;
    private readonly initialLoadTime: number;
    private readonly configuration: AdScriptConfiguration;
    private readonly metadata: MainVideoContentMetadata;

    private adScriptIntegration: AdScriptTHEOIntegration | undefined;

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

        setTimeout(this.createAdScriptIntegrationWhenApiIsAvailable, 20);
    }

    private readonly createAdScriptIntegrationWhenApiIsAvailable = () => {
        if (new Date().getTime() > this.initialLoadTime + 5_000) {
            console.error('JHMT API not found, make sure you included the script to initialize AdScript Measurement.');
        }
        if (typeof window.JHMTApi === 'object') {
            const { i12n } = this.configuration;
            for (const id in i12n) {
                window.JHMTApi.setI12n(id, i12n[id]);
                Logger.logsetI12n(id, i12n[id]);
            }
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
        this.adScriptIntegration?.destroy();
    }
}
