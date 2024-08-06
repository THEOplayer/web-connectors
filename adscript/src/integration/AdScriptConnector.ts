import type { ChromelessPlayer } from 'theoplayer';
import { AdScriptTHEOIntegration } from './AdScriptTHEOIntegration';
import { AdScriptConfiguration, MainVideoContentMetadata } from './AdScriptConfiguration';
import { loadAdScriptSDK } from './LoadAdScriptSDK';

export class AdScriptConnector {
    private readonly player: ChromelessPlayer;
    private readonly initialLoadTime: number;
    private readonly configuration: AdScriptConfiguration;

    private metadata: MainVideoContentMetadata;
    private i12n: { [key: string]: string } | undefined;

    private adScriptIntegration: AdScriptTHEOIntegration | undefined;
    private destroyed = false;

    /**
     * Constructor for the THEOplayer AdScript connector.
     * @param player a THEOplayer instance reference
     * @param configuration a configuration object for the AdScript connector
     * @returns
     */
    constructor(player: ChromelessPlayer, configuration: AdScriptConfiguration) {
        this.player = player;
        this.configuration = configuration;
        this.metadata = configuration.metadata;
        this.i12n = configuration.i12n;

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
            this.adScriptIntegration = new AdScriptTHEOIntegration(this.player, this.configuration);
            if (this.i12n) {
                this.adScriptIntegration.updateUser(this.i12n);
            }
            this.adScriptIntegration.updateMetadata(this.metadata);
            this.adScriptIntegration.start();
            return;
        }
        setTimeout(this.createAdScriptIntegrationWhenApiIsAvailable, 20);
    };

    /**
     * Update the main content information settings.
     * This method must be called every time the main video content on the currently displayed page changes.
     * For more information, see the [main content information settings](https://adscript.admosphere.cz/en_adScript_browser.html) section in the AdScript documentation.
     * @param metadata The MainVideoContentMetadata.
     */
    updateMetadata(metadata: MainVideoContentMetadata): void {
        this.metadata = metadata;
        this.adScriptIntegration?.updateMetadata(metadata);
    }

    /**
     * Updates the additional information about the logged-in user (customerID, deviceID, profileID, ...) from the client´s database.
     * For more information, see the [Additional Information Settings](https://adscript.admosphere.cz/en_adScript_browser.html) section.
     * @param i12n The Additional Information
     */
    updateUser(i12n: { [key: string]: string }): void {
        this.i12n = i12n;
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
