import { ChromelessPlayer } from 'theoplayer';
import type { ComscoreConfiguration } from './ComscoreConfiguration';
import type { ComscoreMetadata } from './ComscoreMetadata';
import { ComscoreTHEOIntegration } from '../integration/ComscoreTHEOIntegration';

export class ComscoreConnector {

    private integration: ComscoreTHEOIntegration

    constructor(player: ChromelessPlayer, comscoreConfig: ComscoreConfiguration, comscoreMetadata: ComscoreMetadata) {
        this.integration = new ComscoreTHEOIntegration(player, comscoreConfig, comscoreMetadata);
    }

    /**
     * Sets/updates Comscore metadata on the Comscore video analytics.
     * @param metadata object of key value pairs
     */
    update(metadata: ComscoreMetadata): void {
        this.integration.update(metadata);
    }

    /**
     * Set a persistent label on the ComScore PublisherConfiguration
     */
    setPersistentLabel(label: string, value: string): void {
        // this.integration.setPersistentLabel(label, value);
    }

    /**
     * Set persistent labels on the ComScore PublisherConfiguration
     * @param labels object of key value pairs
     */
    setPersistentLabels(labels: { [key: string]: string }): void {
        // this.integration.setPersistentLabels(labels);
    }

    /**
     * Destroy ComScoreStreamingAnalytics and unregister it from player
     */
    destroy(): void {
        this.integration.destroy();
    }
}