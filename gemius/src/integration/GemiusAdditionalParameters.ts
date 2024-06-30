export type Resolution = {
    width: number;
    height: number
}

export enum ProgramType {
    AUDIO = "audio",
    VIDEO = "video"
}

export enum TransmissionType {
    ON_DEMAND = 1,
    BROADCAST_LIVE_TIMESHIFT = 2 
}

export enum ProgramGenre {
    LIVE = 1,
    FILM = 2,
    SERIES_VLOG = 3,
    PROGRAM = 4,
    MUSIC = 5,
    TRAILER_TEASER = 6
}

export enum AdType {
    BREAK = "break",
    PROMO = "promo",
    SPOT = "spot",
    SPONSOR = "sponsor"
}

export enum AdFormat {
    VIDEO = 1,
    AUDIO = 2
}

export interface PlayerAdditionalParameters {
    currentDomain?: string;
    volume?: number;
    resolution?: Resolution;
}

export interface NewProgramAdditionalParameters {
    programName: string;
    programDuration: number;
    programType: ProgramType;
    transmissionType?: TransmissionType;
    transmissionChannel?: string;
    transmissionStartTime?: EpochTimeStamp;
    programGenre?: ProgramGenre;
    programThematicCategory?: string; // TODO check separate document for details
    series?: string;
    programSeason?: string;
    programPartialName?: string;
    programProducer?: string;
    typology?: string;
    premiereDate?: string; 
    externalPremiereDate?: string;
    quality?: Resolution
    resolution?: Resolution
    volume: number;
    customAttributes: any;
}

export interface NewAdAdditionalParameters {
    adName?: string;
    adDuration?: number;
    adType?: AdType
    campaignClassification?: string;
    adFormat?: AdFormat;
    quality?: Resolution;
    resolution?: Resolution;
    volume?: number;
    customAttributes?: any;
}

export interface PlayAdEventAdditionalParameters {
    autoPlay?: boolean;
    adPosition?: number;
    breakSize?: number;
    resolution?: Resolution;
    volume?: number;
    adDuration?: number;
    customAttributes?: any;
}

export interface PlayProgramEventAdditionalParameters {
    autoPlay?: boolean;
    partID?: number;
    resolution?: Resolution;
    volume?: number;
    programDuration?: number;
    customAttributes?: any;
}

export interface ListEventAdditionalParameters {
    listID?: number
}

export interface ChangeResolutionEventAddtionalParameters {
    resolution?: Resolution;
}

export interface ChangeVolumeEventAddtionalParameters {
    volume?: number;
}

export interface ChangeQualityEventAddtionalParameters {
    quality?: Resolution;
}