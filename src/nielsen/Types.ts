export type NielsenOptions = {
    containerId?: string,
    nol_sdkDebug?: string,
    optout?: boolean
}

export type ContentMetadata = {
    type: 'content',
    adModel: '1' | '2'
} & { [key: string]: string }

export type AdMetadata = {
    type: 'preroll' | 'midroll' | 'postroll' | 'ad',
    assetid: any // TODO string? or can be anything?
} & { [key: string]: string }
