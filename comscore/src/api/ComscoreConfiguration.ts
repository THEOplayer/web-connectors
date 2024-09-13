import { Ad } from "theoplayer";

export enum ComscoreUserConsent {
    denied = "0",
    granted = "1",
    unknown = ""
}

export enum ComscoreUsagePropertiesAutoUpdateMode {
    foregroundOnly = "foregroundOnly",
    foregroundAndBackground = "foregroundAndBackground",
    disabled = "disabled"
}

export interface ComscoreConfiguration {
    /**
     * Also known as the c2 value
     */
    publisherId: string;
    applicationName: string;
    userConsent: ComscoreUserConsent;
    /**
     * Defaults to foregroundOnly if none is specified. If your app has some background experience, use foregroundAndBackground.
     */
    usagePropertiesAutoUpdateMode?: ComscoreUsagePropertiesAutoUpdateMode;
    skeleton?: any;
    /**
     * Defaults to ns_.analytics.PlatformAPIs.html5 if no skeleton is provided or ns_.analytics.PlatformAPIs.Skeleton if a skeleton is provided.
     */
    platformApi?: number;
    adIdProcessor?: (ad: Ad) => string;
    debug?: boolean;
}


