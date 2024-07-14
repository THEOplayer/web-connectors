import { Ad } from "theoplayer";
import { EmbeddedContentMetadata } from "../adscript/AdScript";

export interface AdScriptConfiguration {
    implementationId: string;
    debug?: boolean;
    adProcessor?: (ad: Ad) => EmbeddedContentMetadata
}