import type { Ad } from 'theoplayer';
import { EmbeddedContentMetadata } from '../adscript/AdScript';

/**
 * The configuration for the AdScript Connector.
 */
export interface AdScriptConfiguration {
    /**
     * Integration ID you received from Nielsen representative.
     */
    implementationId: string;

    /**
     * The initial main content information settings.
     * Metadata of the main video content needs to be set before the first measured event occurs.
     * For more information, see the [main content information settings](https://adscript.admosphere.cz/en_adScript_browser.html) section in the AdScript documentation.
     */
    metadata: MainVideoContentMetadata;

    /**
     * Additional information about logged user (customerID, deviceID, profileID) from client´s database.
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
