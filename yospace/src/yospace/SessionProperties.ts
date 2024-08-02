export interface SessionProperties {
    getAllowCorsForAnalytics(): boolean;
    getApplyEncryptedTracking(): boolean;
    getCustomHttpHeaders(): Map<string, string>;
    getExcludedCategories(): number;
    getFireHistoricalBeacons(): boolean;
    getPrefetchResources(): boolean;
    getRequestTimeout(): number;
    getUserAgent(): string;

    excludeFromSuppression(categories: number): void;
    setAllowCorsForAnalytics(allowCorsForAnalytics: boolean): void;
    setApplyEncryptedTracking(useHttps: boolean): void;
    setCustomHttpHeaders(customHttpHeaders: Map<string, string>): void;
    setFireHistoricalBeacons(fire: boolean): void;
    setPrefetchResources(prefetch: boolean): void;
    setRequestTimeout(requestTimeout: number): void;
    setUserAgent(userAgent: string): void;
}

export interface SessionPropertiesConstructor {
    new (): SessionProperties;
}
