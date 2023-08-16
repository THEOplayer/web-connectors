import {CMCDHeaderName, CMCDPayload, CMCDReservedKey} from './CMCDPayload';

/**
 * Transforms the provided payload into a query parameter string. Strings will be escaped and placed between quotes, numbers
 * will be passed as raw numbers, booleans will be shortened and tokens will be transformed as per the specification.
 * The resulting list of parameters will be sorted ascending based on UTF-16 values of the keys.
 * @param payload The payload.
 * @returns A query parameter string containing all payload parameters as specified.
 */
export function transformToQueryParameters(payload: CMCDPayload): string {
    const serialisedEntries: string[] = [];
    for (const key in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            const value = payload[key];
            if (typeof value === 'boolean') {
                if (value) {
                    serialisedEntries.push(key);
                } else {
                    serialisedEntries.push(`${key}=false`);
                }
            } else if (typeof value === 'number') {
                serialisedEntries.push(`${key}=${value}`);
            } else {
                serialisedEntries.push(`${key}=${JSON.stringify(encodeURIComponent(payload[key].replace(/\\/g, '\\\\').replace(/"/g, '\\"')))}`);
            }
        }
    }
    serialisedEntries.sort();
    return serialisedEntries.join(',');
}

/**
 * Provides a map of all reserved keys to the header name.
 * @param key The key for which you want to know the header name.
 * @returns The header name in which the key should be sent.
 */
function mapKeyToHeaderMapping(key: string): CMCDHeaderName {
    switch (key) {
        case CMCDReservedKey.ENCODED_BITRATE:
        case CMCDReservedKey.OBJECT_DURATION:
        case CMCDReservedKey.TOP_BITRATE:
            return CMCDHeaderName.CMCD_OBJECT;
        case CMCDReservedKey.BUFFER_LENGTH:
        case CMCDReservedKey.DEADLINE:
        case CMCDReservedKey.MEASURED_THROUGHPUT:
        case CMCDReservedKey.NEXT_OBJECT_REQUEST:
        case CMCDReservedKey.NEXT_RANGE_REQUEST:
        case CMCDReservedKey.OBJECT_TYPE:
        case CMCDReservedKey.SVA_REQUEST_ID:
        case CMCDReservedKey.SVA_TRACK_IDENTIFIER:
        case CMCDReservedKey.SVA_PLAYABLE_MANIFEST_INDEX:
        case CMCDReservedKey.SVA_CURRENT_MANIFEST_INDEX:
        case CMCDReservedKey.STARTUP:
            return CMCDHeaderName.CMCD_REQUEST;
        case CMCDReservedKey.BUFFER_STARVATION:
        case CMCDReservedKey.REQUESTED_MAXIMUM_THROUGHPUT:
            return CMCDHeaderName.CMCD_STATUS;
        case CMCDReservedKey.CONTENT_ID:
        case CMCDReservedKey.PLAYBACK_RATE:
        case CMCDReservedKey.STREAMING_FORMAT:
        case CMCDReservedKey.SESSION_ID:
        case CMCDReservedKey.STREAM_TYPE:
        case CMCDReservedKey.VERSION:
        default:
            return CMCDHeaderName.CMCD_SESSION;
    }
}

/**
 * Returns a new {@link CMCDPayload} which contains all of the keys from the provided payload but only if these keys
 * should be sent with the provided header.
 * @param payload The payload.
 * @param header The header for which payload entries must be retained.
 * @returns A payload containing only the key/value pairs for the provided header.
 */
export function extractKeysFor(payload: CMCDPayload, header: CMCDHeaderName): CMCDPayload {
    const filteredPayload: CMCDPayload = {};
    for (const key in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            const headerForKey = mapKeyToHeaderMapping(key);
            if (headerForKey === header) {
                filteredPayload[key] = payload[key];
            }
        }
    }
    return filteredPayload;
}
