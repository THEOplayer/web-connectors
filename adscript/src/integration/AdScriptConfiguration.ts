import type { Ad } from 'theoplayer';
import { EmbeddedContentMetadata } from '../adscript/AdScript';

export interface AdScriptConfiguration {
    implementationId: string;
    i12n: { [key: string]: string };
    debug?: boolean;
    adProcessor?: (ad: Ad) => EmbeddedContentMetadata;
}
