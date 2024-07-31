import type { ServerSideAdInsertionConfiguration } from 'theoplayer';

/**
 * The identifier of the Yospace integration.
 */
export type YospaceSSAIIntegrationID = 'yospace';

/**
 * The type of the Yospace stream, represented by a value from the following list:
 *  - `'live'`: The stream is a live stream.
 *  - `'livepause'`: The stream is a live stream with a large DVR window.
 *  - `'nonlinear'`: The stream is a Non-Linear Start-Over stream.
 *  - `'vod'`: The stream is a video-on-demand stream.
 */
export type YospaceStreamType = 'vod' | 'live' | 'livepause' | 'nonlinear';

/**
 * Represents a configuration for server-side ad insertion with Yospace using the {@link YospaceConnector}.
 */
export interface YospaceServerSideAdInsertionConfiguration extends ServerSideAdInsertionConfiguration {
    /**
     * The identifier for the Yospace integration.
     */
    integration: YospaceSSAIIntegrationID;

    /**
     * The type of the requested stream.
     *
     * @defaultValue `'live'`
     */
    streamType?: YospaceStreamType;
}
