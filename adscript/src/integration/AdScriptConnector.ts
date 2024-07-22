import type { ChromelessPlayer } from 'theoplayer';
import { AdScriptTHEOIntegration } from './AdScriptTHEOIntegration';
import { AdScriptConfiguration } from './AdScriptConfiguration';
import { MainVideoContentMetadata } from '../adscript/AdScript';
import { loadAdScriptSDK } from './LoadAdScriptSDK';

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
     * @param initialMetadata the MainVideoContentMetadata
     * @returns
     */
    constructor(
        player: ChromelessPlayer,
        configuration: AdScriptConfiguration,
        initialMetadata: MainVideoContentMetadata
    ) {
        this.player = player;
        this.configuration = configuration;
        this.metadata = initialMetadata;

        // This loads the external AdScript SDK script. This is not immediately available, so we start a timer.
        this.initialLoadTime = new Date().getTime();
        loadAdScriptSDK(configuration.implementationId);

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
     * For more information, see the [main content information settings](https://adscript.admosphere.cz/en_adScript_browser.html) section.
     * @param metadata The MainVideoContentMetadata.
     */
    updateMetadata(metadata: MainVideoContentMetadata): void {
        this.adScriptIntegration?.updateMetadata(metadata);
    }

    /**
     * Updates the additional information about logged user (customerID, deviceID, profileID, ...) from client´s database.
     * For more information, see the [Additional Information Settings](https://adscript.admosphere.cz/en_adScript_browser.html) section.
     * @param i12n The Additional Information
     */
    updateUser(i12n: { [key: string]: string }): void {
        this.adScriptIntegration?.updateUser(i12n);
    }

    /**
     * Destroy the connector.
     */
    destroy(): void {
        this.destroyed = true;
        this.adScriptIntegration?.destroy();
    }
}