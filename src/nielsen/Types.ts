export type AdType = 'preroll' | 'midroll' | 'postroll' | 'ad';

export type NielsenOptions = {
    containerId?: string,
    nol_sdkDebug?: string,
    optout?: boolean
}

/**
 * adModel: 1) - Linear – matches TV ad load * 2) Dynamic – Dynamic Ad Insertion (DAI)
 */
export type ContentMetadata = {
    type: 'content',
    adModel: '1' | '2'
} & { [ key: string ]: string }

export type AdMetadata = {
    type: AdType,
    assetid: any // TODO string? or can be anything?
} & { [ key: string ]: string }
