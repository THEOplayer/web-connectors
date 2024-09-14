import { ChromelessPlayer } from 'theoplayer';
import { ComscoreConfiguration, ComscorePlatformAPIs, ComscoreUserConsent } from './ComscoreConfiguration';
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
            throw new Error('[COMSCORE] ComScore script missing, cannot init ComScoreAnalytics');
        }

        this.configuration = comscoreConfig

        // Set platform API
        if (this.configuration.skeleton) {
            this.analytics.PlatformApi.setPlatformAPI(this.analytics.PlatformAPIs.Skeleton, this.configuration.skeleton)
        } else if (this.configuration.platformApi){
            this.analytics.PlatformApi.setPlatformAPI(mapPlatformAPI(this.configuration.platformApi))
            if (this.configuration.debug) console.log(`[COMSCORE] Set the Platform API to ${this.configuration.platformApi}`)
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
     * Set persistent label on the ComScore PublisherConfiguration
     * @param label
     * @param value
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

function mapPlatformAPI(platformApi: ComscorePlatformAPIs): ns_.analytics.PlatformAPIs {
    switch (platformApi) {
        case ComscorePlatformAPIs.SmartTV:
            return ns_.analytics.PlatformAPIs.SmartTV;
        case ComscorePlatformAPIs.Netcast:
            return ns_.analytics.PlatformAPIs.Netcast;
        case ComscorePlatformAPIs.Cordova:
            return ns_.analytics.PlatformAPIs.Cordova;
        case ComscorePlatformAPIs.Trilithium:
            return ns_.analytics.PlatformAPIs.Trilithium;
        case ComscorePlatformAPIs.AppleTV:
            return ns_.analytics.PlatformAPIs.AppleTV;
        case ComscorePlatformAPIs.Chromecast:
            return ns_.analytics.PlatformAPIs.Chromecast;
        case ComscorePlatformAPIs.Xbox:
            return ns_.analytics.PlatformAPIs.Xbox;
        case ComscorePlatformAPIs.webOS:
            return ns_.analytics.PlatformAPIs.webOS;
        case ComscorePlatformAPIs.tvOS:
            return ns_.analytics.PlatformAPIs.tvOS;
        case ComscorePlatformAPIs.nodejs:
            return ns_.analytics.PlatformAPIs.nodejs;
        case ComscorePlatformAPIs.html5:
            return ns_.analytics.PlatformAPIs.html5;
        case ComscorePlatformAPIs.JSMAF:
            return ns_.analytics.PlatformAPIs.JSMAF;
        case ComscorePlatformAPIs.Skeleton:
            return ns_.analytics.PlatformAPIs.Skeleton;
        case ComscorePlatformAPIs.WebBrowser:
            return ns_.analytics.PlatformAPIs.WebBrowser;
        case ComscorePlatformAPIs.SamsungTizenTV:
            return ns_.analytics.PlatformAPIs.SamsungTizenTV;
        default:
            return ns_.analytics.PlatformAPIs.html5;
    }
}
