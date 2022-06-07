export enum ResourceType {
    STATIC,
    HTML,
    IFRAME,
    UNKNOWN
}

interface Resource {
    getStringData(): string;
}

export interface LinearCreative {
    getClickThroughUrl(): string;
}

export interface NonLinearCreative {
    getClickThroughUrl(): string;

    getResource(type: ResourceType): Resource | undefined;
}

export interface AdVert {
    getLinearCreative(): LinearCreative

    getNonLinearCreativesByType(type: ResourceType): NonLinearCreative[];
}

export interface AdBreak {
    adverts: AdVert[];
}