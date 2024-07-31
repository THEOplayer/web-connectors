import type { ServerSideAdInsertionConfiguration } from 'theoplayer';

/**
 * The identifier of the Yospace integration.
 */
export type YospaceSSAIIntegrationID = 'yospace';

/**
 * The type of the Yospace stream, represented by a value from the following list:
 * <br/> - `'live'`: The stream is a live stream.
 * <br/> - `'livepause'`: The stream is a live stream with a large DVR window.
 * <br/> - `'nonlinear'`: The stream is a Non-Linear Start-Over stream.
 * <br/> - `'vod'`: The stream is a video-on-demand stream.
 */
export type YospaceStreamType = 'vod' | 'live' | 'livepause' | 'nonlinear';

/**
 * Represents a configuration for server-side ad insertion with the Yospace pre-integration.
 */
export interface YospaceServerSideAdInsertionConfiguration extends ServerSideAdInsertionConfiguration {
    /**
     * The identifier for the SSAI pre-integration.
     */
    integration: YospaceSSAIIntegrationID;

    /**
     * The type of the requested stream.
     *
     * @defaultValue `'live'`
     */
    streamType?: YospaceStreamType;
}
