/**
 * The definition of payload object containing all CMCD data.
 * Note custom keys MUST carry a hyphenated prefix to ensure that there will not be a namespace collision with future
 * revisions to the specification. Clients SHOULD use a reverse-DNS syntax when defining their own prefix.
 */
export type CMCDPayload = {
    [CMCDReservedKey.ENCODED_BITRATE]?: number;
    [CMCDReservedKey.BUFFER_LENGTH]?: number;
    [CMCDReservedKey.BUFFER_STARVATION]?: boolean;
    [CMCDReservedKey.CONTENT_ID]?: string;
    [CMCDReservedKey.OBJECT_DURATION]?: number;
    [CMCDReservedKey.DEADLINE]?: number;
    [CMCDReservedKey.MEASURED_THROUGHPUT]?: number;
    [CMCDReservedKey.NEXT_OBJECT_REQUEST]?: string;
    [CMCDReservedKey.NEXT_RANGE_REQUEST]?: string;
    [CMCDReservedKey.OBJECT_TYPE]?: CMCDObjectType;
    [CMCDReservedKey.PLAYBACK_RATE]?: number;
    [CMCDReservedKey.REQUESTED_MAXIMUM_THROUGHPUT]?: number;
    [CMCDReservedKey.STREAMING_FORMAT]?: CMCDStreamingFormat;
    [CMCDReservedKey.SESSION_ID]?: string;
    [CMCDReservedKey.STREAM_TYPE]?: CMCDStreamType;
    [CMCDReservedKey.STARTUP]?: boolean;
    [CMCDReservedKey.TOP_BITRATE]?: number;
    [CMCDReservedKey.VERSION]?: number;

    [CMCDReservedKey.SVA_REQUEST_ID]?: string;
    [CMCDReservedKey.SVA_CURRENT_MANIFEST_INDEX]?: number;
    [CMCDReservedKey.SVA_PLAYABLE_MANIFEST_INDEX]?: number;
    [CMCDReservedKey.SVA_TRACK_IDENTIFIER]?: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [customKey: string]: any;
};

/**
 * The possible header names as defined in the CTA-5004 specification.
 */
export enum CMCDHeaderName {
    CMCD_OBJECT = 'CMCD-Object',
    CMCD_REQUEST = 'CMCD-Request',
    CMCD_STATUS = 'CMCD-Status',
    CMCD_SESSION = 'CMCD-Session'
}

/**
 * The reserved keys as defined in the CTA-5004 specification.
 */
export enum CMCDReservedKey {
    /**
     * The encoded bitrate of the audio or video object being requested. This may not be known precisely by the player,
     * however it MAY be estimated based upon playlist/manifest declarations.
     * If the playlist declares both peak and average bitrate values, the peak value should be transmitted.
     *
     * Exposed as an Integer in kbps.
     */
    ENCODED_BITRATE = 'br',
    /**
     * The buffer length associated with the media object being requested.
     * This value MUST be rounded to the nearest 100 ms.
     * This key SHOULD only be sent with an object type of ‘a’,‘v’ or ‘av’.
     *
     * Exposed as an Integer in ms.
     */
    BUFFER_LENGTH = 'bl',
    /**
     * Key is included without a value if the buffer was starved at some point between the prior request and this object request,
     * resulting in the player being in a rebuffering state and the video or audio playback being stalled.
     * This key MUST NOT  be sent if the buffer was not starved since the prior request.
     *
     * If the object type ‘ot’ key is sent along with this key, then the ‘bs’ key refers to the buffer associated with the particular object type.
     * If no object type is communicated, then the buffer state applies to the current session.
     */
    BUFFER_STARVATION = 'bs',
    /**
     * A unique string identifying the current content. Maximum length is 64 characters.
     * This value is consistent across multiple different sessions and devices and is defined and updated at the discretion of the service provider.
     */
    CONTENT_ID = 'cid',
    /**
     * The playback duration in milliseconds of the object being requested.
     * If a partial segment is being requested, then this value MUST indicate the playback duration of that part and not that of its parent segment.
     * This value can be an approximation of the estimated duration if the explicit value is not known.
     *
     * Exposed as an Integer in ms.
     */
    OBJECT_DURATION = 'd',
    /**
     * Deadline from the request time until the first sample of this Segment/Object needs to be available in order to not
     * create a buffer underrun or any other playback problems. This value MUST be rounded to the nearest 100ms.
     * For a playback rate of 1, this may be equivalent to the player’s remaining buffer length.
     *
     * Exposed as an Integer in ms.
     */
    DEADLINE = 'dl',
    /**
     * The throughput between client and server, as measured by the client and MUST be rounded to the nearest 100 kbps.
     * This value, however derived, SHOULD be the value that the client is using to make its next Adaptive Bitrate switching decision.
     * If the client is connected to multiple servers concurrently, it must take care to report only the throughput measured against the receiving server.
     * If the client has multiple concurrent connections to the server, then the intent is that this value communicates the
     * aggregate throughput the client sees across all those connections.
     *
     * Exposed as an Integer in kbps.
     */
    MEASURED_THROUGHPUT = 'mtp',
    /**
     * Relative path of the next object to be requested. This can be used to trigger pre-fetching by the CDN.
     * This MUST be a path relative to the current request. This string MUST be URLEncoded.
     * The client SHOULD NOT depend upon any pre-fetch action being taken - it is merely a request for such a pre-fetch to take place.
     */
    NEXT_OBJECT_REQUEST = 'nor',
    /**
     * If the next request will be a partial object request, then this string denotes the byte range to be requested.
     * If the ‘nor’ field is not set, then the object is assumed to match the object currently being requested.
     * The client SHOULD NOT depend upon any pre-fetch action being taken - it is merely a request for such a pre-fetch to take place.
     * Formatting is similar to the HTTP Range header, except that the unit MUST be ‘byte’, the ‘Range:’ prefix is NOT
     * required and specifying multiple ranges is NOT allowed.
     *
     * Valid combinations are:
     *  "<range-start>-"
     *  "<range-start>-<range-end>"
     *  "-<suffix-length>"
     */
    NEXT_RANGE_REQUEST = 'nrr',
    /**
     * The media type of the current object being requested.
     * If the object type being requested is unknown, then this key MUST NOT be used.
     */
    OBJECT_TYPE = 'ot',
    /**
     * The playback rate at which is currently being played.
     * 1 if real-time,
     * 2 if double speed,
     * 0 if not playing.
     * SHOULD only be sent if not equal to 1.
     */
    PLAYBACK_RATE = 'pr',
    /**
     * The requested maximum throughput that the client considers sufficient for delivery of the asset.
     * Values MUST be rounded to the nearest 100kbps. For example, a client would indicate that the current segment,
     * encoded at 2Mbps, is to be delivered at no more than 10Mbps, by using rtp=10000.
     *
     * Note: This can benefit clients by preventing buffer saturation through over-delivery and can also deliver a
     * community benefit through fair-share delivery. The concept is that each client receives the throughput necessary
     * for great performance, but no more. The CDN may not support the rtp feature.
     *
     * Exposed as an Integer in kbps.
     */
    REQUESTED_MAXIMUM_THROUGHPUT = 'rtp',
    /**
     * The streaming format which defines the current request
     * If the streaming format  being requested is unknown, then this key MUST NOT be used.
     */
    STREAMING_FORMAT = 'sf',
    /**
     * A GUID identifying the current playback session. A playback session typically ties together segments belonging to a single media asset.
     * Maximum length is 64 characters. It is RECOMMENDED to conform to the UUID specification.
     */
    SESSION_ID = 'sid',
    /**
     * The type of stream being played.
     */
    STREAM_TYPE = 'st',
    /**
     * Key is included without a value if the object is needed urgently due to startup, seeking or recovery after a buffer-empty event.
     * The media SHOULD not be rendering when this request is made.
     * This key MUST not be sent if it is FALSE.
     */
    STARTUP = 'su',
    /**
     * The highest bitrate rendition in the manifest or playlist that the client is allowed to play, given current codec,
     * licensing and sizing constraints.
     *
     * Exposed as an Integer in kbps.
     */
    TOP_BITRATE = 'tb',
    /**
     * The version of this specification used for interpreting the defined key names and values.
     * If this key is omitted, the client and server MUST interpret the values as being defined by version 1.
     * Client SHOULD omit this field if the version is 1.
     */
    VERSION = 'v',

    /**
     * A GUID identifying the current request. Every request will automatically receive a new GUID automatically.
     * Maximum length is 64 characters. It is RECOMMENDED to conform to the UUID specification.
     *
     * Note: This is NOT a part of the CMCD specification as is, but is an additional parameter in light with the work done in the SVA.
     */
    SVA_REQUEST_ID = 'org.svalabs-rid',
    /**
     * The 1-based index of the CMAF Track, of which the currently loading object is a part, in the sorted list of all
     * tracks in the associated Aligned CMAF Switching Set.
     * This list is sorted as follows:
     * - In ascending order of the protocol's perceptual quality score (if available),
     * - In ascending order of the Track's bandwidth,
     * - In ascending order of the order as present in the stream Manifests.
     *
     * Note: This is NOT a part of the CMCD specification as is, but is an additional parameter in light with the work done in the SVA.
     */
    SVA_CURRENT_MANIFEST_INDEX = 'org.svalabs-cmi',
    /**
     * The number of CMAF Tracks, of which the currently loading object is a part, in the sorted list of all
     * tracks in the associated Aligned CMAF Switching Set.
     *
     * Note: This is NOT a part of the CMCD specification as is, but is an additional parameter in light with the work done in the SVA.
     */
    SVA_PLAYABLE_MANIFEST_INDEX = 'org.svalabs-pmi',
    /**
     * The identifier of the Aligned CMAF Switching Set to which the currently loading object belongs. Its value must be unique
     * across the current viewer session for all different Aligned CMAF Switching Sets and should (if available) be the identifier
     * in the CMAF Manifest.
     *
     * Note: This is NOT a part of the CMCD specification as is, but is an additional parameter in light with the work done in the SVA.
     */
    SVA_TRACK_IDENTIFIER = 'org.svalabs-tid',
}

/**
 * The Object Type as specified in Table 1.
 */
export enum CMCDObjectType {
    /**
     * Audio only
     */
    AUDIO = 'a', // note there is 'm' as an alternative
    /**
     * Video only
     */
    VIDEO = 'v',
    /**
     * Muxed audio and video
     */
    MUXED_AUDIO_VIDEO = 'av',
    /**
     * Init segment
     */
    INIT_SEGMENT = 'i',
    /**
     * Caption or subtitle
     */
    CAPTION_OR_SUBTITLE = 'c',
    /**
     * ISOBMFF timed text track
     */
    TIMED_TEXT_TRACK = 'tt',
    /**
     * Cryptographic key, license or certificate
     */
    KEY_LICENSE_OR_CERTIFICATE = 'k',
    /**
     * Other (not unknown)
     */
    OTHER = 'o'
}

/**
 * The Streaming Format as specified in Table 1.
 */
export enum CMCDStreamingFormat {
    /**
     * MPEG-DASH streaming
     */
    MPEG_DASH = 'd',
    /**
     * HTTP Live Streaming (HLS)
     */
    HLS = 'h',
    /**
     * Microsoft Smooth Streaming
     */
    SMOOTH = 's',
    /**
     * Other (not unknown).
     */
    OTHER = 'o'
}

/**
 * The Stream Type as specified in Table 1.
 */
export enum CMCDStreamType {
    /**
     * All segments are available e.g. VOD
     */
    STATIC = 'v',
    /**
     * Segments become available over time e.g. LIVE
     */
    DYNAMIC = 'l'
}