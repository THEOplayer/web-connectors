import type { Ad } from 'theoplayer';

/**
 * The main content information settings.
 * For more information, see the [main content information settings](https://adscript.admosphere.cz/en_adScript_browser.html) section in the AdScript documentation.
 */
export interface MainVideoContentMetadata {
    assetid: string;
    type: 'content';
    program: string;
    title: string;
    length: string;
    crossId: string;
    livestream: string;
    channelId: string;
    attributes: string;
}

/**
 * The embedded content metadata, about the currently playing ad.
 */
export interface EmbeddedContentMetadata {
    assetid: string;
    type: 'preroll' | 'midroll' | 'postroll';
    length: string;
    title: string;
    asmea: string;
    attributes: string;
}

/**
 * The configuration for the AdScript Connector.
 */
export interface AdScriptConfiguration {
    /**
     * Integration ID you received from your Nielsen representative.
     */
    implementationId: string;

    /**
     * The initial main content information settings.
     * Metadata of the main video content needs to be set before the first measured event occurs.
     * For more information, see the [main content information settings](https://adscript.admosphere.cz/en_adScript_browser.html) section in the AdScript documentation.
     */
    metadata: MainVideoContentMetadata;

    /**
     * Additional information about the logged-in user (customerID, deviceID, profileID) from the client´s database.
     * For more information, see the [Additional Information Settings](https://adscript.admosphere.cz/en_adScript_browser.html) section.
     */
    i12n?: { [key: string]: string };

    /**
     * An optional advertisement processor to receive metadata about the Ad.
     */
    adProcessor?: (ad: Ad) => EmbeddedContentMetadata;

    /**
     * Whether the connector should log all actions.
     */
    debug?: boolean;
}
