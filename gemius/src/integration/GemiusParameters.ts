export enum ProgramType {
    AUDIO = 'audio',
    VIDEO = 'video'
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
    BREAK = 'break',
    PROMO = 'promo',
    SPOT = 'spot',
    SPONSOR = 'sponsor'
}

export enum AdFormat {
    VIDEO = 1,
    AUDIO = 2
}

export interface PlayerAdditionalParameters {
    currentDomain?: string;
    volume?: number;
    resolution?: string;
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
    quality?: string;
    resolution?: string;
    volume?: number;
    customAttributes?: {
        [key: string]: string;
    };
}

export interface NewAdAdditionalParameters {
    adName?: string;
    adDuration?: number;
    adType?: AdType;
    campaignClassification?: string;
    adFormat?: AdFormat;
    quality?: string;
    resolution?: string;
    volume?: number;
    customAttributes?: {
        [key: string]: string;
    };
}

export interface PlayAdEventAdditionalParameters {
    autoPlay?: boolean;
    adPosition?: number;
    breakSize?: number;
    resolution?: string;
    volume?: number;
    adDuration?: number;
    customAttributes?: {
        [key: string]: string;
    };
}

export interface PlayProgramEventAdditionalParameters {
    autoPlay?: boolean;
    partID?: number;
    resolution?: string;
    volume?: number;
    programDuration?: number;
    customAttributes?: {
        [key: string]: string;
    };
}

export interface ListEventAdditionalParameters {
    listID?: number;
}

export interface ChangeResolutionEventAddtionalParameters {
    resolution?: string;
}

export interface ChangeVolumeEventAddtionalParameters {
    volume?: number;
}

export interface ChangeQualityEventAddtionalParameters {
    quality?: string;
}

export interface GemiusProgramParameters extends NewProgramAdditionalParameters {
    programID: string;
}
