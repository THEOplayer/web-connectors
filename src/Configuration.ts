/**
 * The transmission mode to be used.
 */
export enum TransmissionMode {
    /**
     * Transmit CMCD data as a custom HTTP request header.
     *
     * @remarks
     *
     * Usage of a custom header from a web browser user-agent will trigger a preflight OPTIONS request before
     * each unique media object request. This will lead to an increased request rate against the server. As a result,
     * for CMCD transmissions from web browser user-agents that require CORS-preflighting per URL, the preferred mode
     * of use is query arguments.
     */
    HTTP_HEADER,
    /**
     * Transmit CMCD data as a HTTP query argument.
     */
    QUERY_ARGUMENT,
    /**
     * Transmit CMCD data as a JSON object independent of the HTTP object request.
     */
    JSON_OBJECT
}

/**
 * The configuration object for the Common Media Client Data (CTA-5004) connector.
 */
export interface Configuration {

    /**
     * The data transmission mode as defined in section 2 of the specification.
     * When no transmission mode is selected, {@link TransmissionMode.QUERY_ARGUMENT} will be used in order to avoid CORS preflight requests in browsers.
     */
    transmissionMode: TransmissionMode;

    /**
     * The target URI where client data is to be delivered in case the {@link Configuration.transmissionMode} is set
     * to {@link TransmissionMode.JSON_OBJECT}.
     */
    jsonObjectTargetURI?: string;

    /**
     * The session ID parameter which should be passed as a CMCD value. If left empty, a UUIDv4 will be generated when applying the configuration.
     */
    sessionID?: string;

    /**
     * The content ID parameter which should be passed as a CMCD value. If left empty, no content ID will be sent.
     */
    contentID?: string;

    /**
     * A flag to indicate if request IDs should be sent or not.
     * When set to a truthly value, a UUIDv4 will be sent as a request id (`rid`) with every request to allow for request tracing.
     */
    sendRequestID?: boolean;

    /**
     * An object containing custom keys which should be added to the generated CMCD parameters.
     * Note custom keys MUST carry a hyphenated prefix to ensure that there will not be a namespace collision with future
     * revisions to the specification. Clients SHOULD use a reverse-DNS syntax when defining their own prefix.
     */
    customKeys?: {
        [key: string]: string | number | boolean
    }
}