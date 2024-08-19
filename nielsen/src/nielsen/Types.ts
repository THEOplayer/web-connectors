export type AdType = 'preroll' | 'midroll' | 'postroll' | 'ad';

export type NielsenOptions = {
    // HTML DOM element id of the player container
    containerId?: string;

    // Enables Debug Mode which allows output to be viewed in console.
    nol_sdkDebug?: string;

    // Set the ability to optout on initialization of the SDK
    optout?: boolean;
};

/**
 * adModel: 1) - Linear – matches TV ad load * 2) Dynamic – Dynamic Ad Insertion (DAI)
 */
export type ContentMetadata = {
    type: 'content';
    adModel: '1' | '2';
} & { [key: string]: string };

export type AdMetadata = {
    type: AdType;
    assetid: any; // TODO string? or can be anything?
} & { [key: string]: string };

/*
 * Countries for which (1) Nielsen provides DCR Browser SDKs and (2) the corresponding SDK was tested with this integration.
 */
export enum NielsenCountry {
    US = 'US',
    CZ = 'CZ'
}
