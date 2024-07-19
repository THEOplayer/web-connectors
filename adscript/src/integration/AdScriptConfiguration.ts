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
