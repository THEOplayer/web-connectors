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

export enum ComscorePlatformAPIs {
    SmartTV = 0,
    Netcast = 1,
    Cordova = 2,
    Trilithium = 3,
    AppleTV = 4,
    Chromecast = 5,
    Xbox = 6,
    webOS = 7,
    tvOS = 8,
    nodejs = 9,
    html5 = 10,
    JSMAF = 11,
    Skeleton = 12,
    WebBrowser = 13,
    SamsungTizenTV = 14
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
    platformApi?: ComscorePlatformAPIs;
    adIdProcessor?: (ad: Ad) => string;
    debug?: boolean;
}


