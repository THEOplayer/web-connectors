import { ChromelessPlayer } from 'theoplayer';
import type { ComscoreConfiguration, ComscoreUserConsent } from './ComscoreConfiguration';
import type { ComscoreMetadata } from './ComscoreMetadata';
import { ComscoreStreamingAnalyticsTHEOIntegration } from '../integration/ComscoreStreamingAnalyticsTHEOIntegration';

const USER_CONSENT_LABEL = "cs_ucfr"

export class ComscoreConnector {

    private analytics = ns_.analytics
    private configuration: ComscoreConfiguration
    private streamingAnalyticsIntegration: ComscoreStreamingAnalyticsTHEOIntegration

    /**
     * Constructor for the THEOplayer Comscore connector
     * @param player a THEOplayer instance reference
     * @param comscoreConfig configuration object that should at least hold the publisher id, application name and an initial user consent value
     * @param comscoreMetadata metadata associated with the SourceDescription that is or will be passed to the THEOplayer instance
     * @returns 
     */
    constructor(player: ChromelessPlayer, comscoreConfig: ComscoreConfiguration, comscoreMetadata: ComscoreMetadata) {
        if (typeof ns_ === 'undefined' || typeof this.analytics === 'undefined') {
            console.error('[COMSCORE] ComScore script missing, cannot init ComScoreAnalytics');
            return;
        }

        this.configuration = comscoreConfig

        // Set platform API
        if (this.configuration.skeleton) {
            this.analytics.PlatformApi.setPlatformAPI(this.analytics.PlatformAPIs.Skeleton, this.configuration.skeleton)
        } else {
            this.analytics.PlatformApi.setPlatformAPI(this.analytics.PlatformAPIs.html5)
        }

        // Configure publisher
        const publisherConfiguration = new this.analytics.configuration.PublisherConfiguration({
            publisherId: comscoreConfig.publisherId,
            persistentLabels: {
                [USER_CONSENT_LABEL]: comscoreConfig.userConsent || ""
            }
        })
        this.analytics.configuration.addClient(publisherConfiguration)
        this.analytics.configuration.setApplicationName(comscoreConfig.applicationName)
        

        // Start application tracking
        this.analytics.start()

        // Set Streaming Analytics integration
        this.streamingAnalyticsIntegration = new ComscoreStreamingAnalyticsTHEOIntegration(player, comscoreConfig, comscoreMetadata);
    }

    /**
     * Sets/updates Comscore metadata on the Comscore video analytics.
     * @param metadata object of key value pairs
     */
    update(metadata: ComscoreMetadata): void {
        this.streamingAnalyticsIntegration.update(metadata);
    }

    /**
     *  Update the user consent 
     * @param consentValue `"1"` indicates consent was granted, `"0"` not granted and `""` unknown.
     */
    updateUserConsent(consentValue: ComscoreUserConsent): void {
        this.analytics.configuration
            .getPublisherConfiguration(this.configuration.publisherId)
            .setPersistentLabel(USER_CONSENT_LABEL, consentValue);
        this.analytics.notifyHiddenEvent()
    }

    /**
     * Set persistent labels on the ComScore PublisherConfiguration
     * @param labels object of key value pairs
     */
    setPersistentLabel(label: string, value: string): void {
        this.analytics.configuration
            .getPublisherConfiguration(this.configuration.publisherId)
            .setPersistentLabel(label,value);
        }

    /**
     * Set persistent labels on the ComScore PublisherConfiguration
     * @param labels object of key value pairs
     */
    setPersistentLabels(labels: { [key: string]: string }): void {
        this.analytics.configuration
            .getPublisherConfiguration(this.configuration.publisherId)
            .setPersistentLabels(labels);
    }

    /**
     * Destroy ComScoreStreamingAnalytics and unregister it from player
     */
    destroy(): void {
        this.streamingAnalyticsIntegration.destroy();
    }
}