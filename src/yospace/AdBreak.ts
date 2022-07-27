export enum ResourceType {
    STATIC,
    HTML,
    IFRAME,
    UNKNOWN
}

interface Resource {
    getByteData(): number[];
    getCreativeType(): string;
    getResourceType(): ResourceType;
    getStringData(): string;
    isEncoded(): boolean;
}

export interface LinearCreative {
    getClickThroughUrl(): string;
}

export interface NonLinearCreative {
    getClickThroughUrl(): string;

    getResource(type: ResourceType): Resource | undefined;
}

export interface AdVert {
    getLinearCreative(): LinearCreative;

    getNonLinearCreativesByType(type: ResourceType): NonLinearCreative[];
}

export interface AdBreak {
    adverts: AdVert[];
}
