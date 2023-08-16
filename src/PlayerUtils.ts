import {TypedSource} from 'theoplayer';
import {CMCDStreamingFormat} from './CMCDPayload';

function isM3U8SourceString(source: string): boolean {
    return source.indexOf('m3u8') !== -1;
}

function isDASHSourceString(source: string): boolean {
    return source.indexOf('mpd') !== -1;
}

function guessStreamingFormatFromURI(uri: string | undefined): CMCDStreamingFormat {
    if (!uri) {
        return CMCDStreamingFormat.OTHER;
    } else if (isDASHSourceString(uri)) {
        return CMCDStreamingFormat.MPEG_DASH;
    } else if (isM3U8SourceString(uri)) {
        return CMCDStreamingFormat.HLS;
    } else {
        return CMCDStreamingFormat.OTHER;
    }
}

/**
 * Returns the streaming format as observed in the provided {@link TypedSource}. If no {@link TypedSource.type} is provided,
 * it will be inferred from the {@link TypedSource.src}, or the {@link CMCDStreamingFormat.OTHER} will be returned.
 * @param source The source for which the {@link CMCDStreamingFormat} is to be inferred.
 * @returns The streaming format for the provided source.
 */
export function getStreamingFormatFromTypedSource(source: TypedSource): CMCDStreamingFormat {
    const type = source.type;
    switch (type) {
        case 'application/dash+xml':
            return CMCDStreamingFormat.MPEG_DASH;
        case 'application/vnd.apple.mpegurl':
        case 'application/x-mpegurl':
            return CMCDStreamingFormat.HLS;
        default:
            return guessStreamingFormatFromURI(source.src);
    }
}

const BUFFER_GAP_OFFSET = 0.05;

/**
 * Returns the size of the buffer in seconds as of the provided time in the given ranges. Will jump gaps if small enough.
 * @param currentTime The time as of which the buffer size is to be calculated.
 * @param buffered The time range which is to be used containing ranges which are within the buffer.
 * @returns The buffer size in seconds.
 */
export function calculateBufferSize(currentTime: number, buffered: TimeRanges): number {
    let timeIndex = currentTime;
    for (let bufferIndex = 0; bufferIndex < buffered.length; bufferIndex += 1) {
        const rangeStart = buffered.start(bufferIndex);
        const rangeEnd = buffered.end(bufferIndex);
        if (timeIndex + BUFFER_GAP_OFFSET >= rangeStart && timeIndex - BUFFER_GAP_OFFSET <= rangeEnd) {
            timeIndex = rangeEnd;
        }
    }
    return timeIndex - currentTime;
}