export type JHMTApiProtocol = 'https:' | 'http:' | 'file:';
interface I12n {
    i1: string;
    i2: string;
    i3: string;
    i4: string;
    i5: string;
}

export type MainVideoContentType = 'content';
export type EmbeddedContentType = 'preroll' | 'midroll' | 'postroll';
export type StaticContentType = 'static';

export interface MainVideoContentMetadata {
    assetid: string;
    type: MainVideoContentType;
    program: string;
    title: string;
    length: string;
    crossId: string;
    livestream: string;
    channelId: string;
    attributes: string;
}

interface EmbeddedContentMetadata {
    assetid: string;
    type: EmbeddedContentType;
    length: string;
    title: string;
    asmea: string;
    attributes: string;
}

interface StaticContentMetadata {
    assetid: string;
    type: MainVideoContentType;
    sec1: string;
    sec2: string;
    sec3: string;
    sec4: string;
    ref: string;
}

export interface PlayerState {
    muted: number;
    volume: number;
    triggeredByUser: number;
    normalSpeed: number;
    fullscreen: number;
    visibility: number;
    width: number;
    height: number;
}

interface JHMTArray extends Array<any> {
    i12n: I12n;
    contentMetadata: ContentMetadata;
    playerState: PlayerState;
    push: (item: any) => number; // Type of the push function
}

declare global {
    interface Window {
        JHMT: JHMTArray;
        JHMTApi: typeof JHMTApi;
        JHMTApiProtocol: JHMTApiProtocol;
    }
}

export interface JHMTApi {
    setI12n(i12n: I12n);
    setContentMetadata(contentMetadata: ContentMetadata);
    setPlayerState(playerState: PlayerState);
}
