export interface TrackingError {
    getAdBreakIdentifier(): string;
    getMediaIdentifier(): string;
    getUrl(): string;
    getErrorCode(): number;
    getEvent(): string;
}
