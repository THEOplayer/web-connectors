export enum ResourceType {
    STATIC,
    HTML,
    IFRAME,
    UNKNOWN
}

export enum ViewableEvent {
    VIEWABLE,
    NOT_VIEWABLE,
    VIEW_UNDETERMINED
}

export enum BreakType {
    LINEAR,
    NONLINEAR,
    DISPLAY
}

export type BreakPosition = 'preroll' | 'midroll' | 'postroll' | 'unknown';

export interface Resource {
    getByteData(): number[];
    getCreativeType(): string;
    getResourceType(): ResourceType;
    getStringData(): string;
    isEncoded(): boolean;
}

export interface CreativeEventHandler {
    onClickThrough(): void;
    onTrackingEvent(event: string): void;
    setVisible(visible: boolean): void;
}

export interface Creative extends CreativeEventHandler {
    getAdvertIdentifier(): string;
    getAdParameters(): string | null;
    getCreativeIdentifier(): string;
    getSequence(): number;
    getUniversalAdIds(): VASTProperty[];
}

export interface LinearCreative extends Creative {
    getClickThroughUrl(): string;
    getCustomClickUrls(): string[];
}

export interface NonLinearCreative extends Creative {
    getClickThroughUrl(): string;
    getProperties(): VASTProperty[];
    getProperty(name: string): VASTProperty | null;
    getResource(type: ResourceType): Resource | null;
    getResources(): Resource[];
    isVisible(): boolean;
    setVisible(visible: boolean): void;
}

export interface CompanionCreative extends Creative {
    getAltText(): string;
    getClickThroughUrl(): string;
    getProperties(): VASTProperty[];
    getProperty(name: string): VASTProperty | null;
    getResource(type: ResourceType): Resource | null;
    getResources(): Resource[];
    isVisible(): boolean;
    setVisible(visible: boolean): void;
}

export interface AdvertEventHandler {
    onViewableEvent(event: ViewableEvent): void;
    onErrorEvent(errorCode?: number): void;
    onImpressionEvent(): void;
}

export interface Advert extends AdvertEventHandler {
    addMacroSubstitution(key: string, value: string): void;
    getAdType(): string;
    getAdVerifications(): AdVerification[];
    getCompanionAdsByType(type: ResourceType): CompanionCreative[];
    getCompanionRequired(): string;
    getDuration(): number;
    getIdentifier(): string;
    getLinearCreative(): LinearCreative;
    getMediaIdentifier(): string;
    getNonLinearCreativesByType(type: ResourceType): NonLinearCreative[];
    getProperties(): VASTProperty[];
    getProperty(name: string): VASTProperty | null;
    getRemainingTime(playhead: number): number;
    getSequence(): number;
    getSkipOffset(): number;
    getStart(): number;
    isActive(): boolean;
    isFiller(): boolean;
    isNonLinear(): boolean;
    broker: any;
}

export type { Advert as AdVert };

export interface VASTProperty {
    getAttributes(): Map<string, string>;
    getName(): string;
    getValue(): string;
}

export interface AdVerification {
    getParameters(): string;
    getResources(): Resource[];
    getVendor(): string;
}

export interface AdBreak {
    getAdverts(): Advert[];
    getType(): BreakType;
    getDuration(): number;
    getIdentifier(): string;
    isPlaceholder(): boolean;
    getPosition(): BreakPosition;
    getRemainingTime(): number;
    getStart(): number;
    isActive(): boolean;
    setInactive(): void;
    onNonLinearTrackingEvent(event: string): void;
}
