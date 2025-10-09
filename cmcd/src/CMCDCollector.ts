import type { ChromelessPlayer, CurrentSourceChangeEvent, MediaTrack, MediaType, Quality, Request } from 'theoplayer';
import { CMCDObjectType, type CMCDPayload, CMCDReservedKey, CMCDStreamingFormat, CMCDStreamType } from './CMCDPayload';
import type { Configuration } from './Configuration';
import { calculateBufferSize, getStreamingFormatFromTypedSource } from './PlayerUtils';
import { uuid } from './RandomUtils';

const REQUESTED_MAXIMUM_THROUGHPUT_SAFETY_FACTOR = 5;
const BUFFER_STARVATION_MARGIN = 0.2;

/**
 * Collector for all CMCD data. This object will subscribe to player events and observe player behaviour in order to collect
 * the correct data. When resetting the player, this object must be recycled as well.
 */
export class CMCDCollector {
    private readonly _config: Configuration;
    private readonly _player: ChromelessPlayer;
    private _bufferStarved: boolean = false;
    private _streamType: CMCDStreamType | undefined;
    private _streamingFormat: CMCDStreamingFormat | undefined;

    /**
     * Creates a new CMCD data collector for the given player and the given configuration.
     * @param player The player for which data is to be collected.
     * @param config The configuration containing the sessionID, contentID and optional custom parameters.
     */
    constructor(player: ChromelessPlayer, config: Configuration) {
        this._player = player;
        this._config = config;
        player.addEventListener('waiting', this.handleWaiting_);
        player.addEventListener('durationchange', this.handleDurationChange_);
        player.addEventListener('currentsourcechange', this.handleCurrentSourceChange_);
    }

    /**
     * Handler for player `waiting` events in order to mark buffer starvation.
     * @private
     */
    private handleWaiting_ = () => {
        if (calculateBufferSize(this._player.currentTime, this._player.buffered) < BUFFER_STARVATION_MARGIN) {
            this._bufferStarved = true;
        }
    };

    /**
     * Handler for player `durationchange` events in order to identify the stream type.
     * @private
     */
    private handleDurationChange_ = () => {
        if (this._player.duration) {
            this._streamType = isFinite(this._player.duration) ? CMCDStreamType.STATIC : CMCDStreamType.DYNAMIC;
        } else {
            this._streamType = undefined;
        }
    };

    /**
     * Handler for player `currentsourcechange` events in order to identify the streaming format.
     * @private
     */
    private handleCurrentSourceChange_ = (event: CurrentSourceChangeEvent) => {
        const currentSource = event.currentSource;
        if (!currentSource || currentSource.type === 'application/vnd.theo.hesp+json') {
            this._streamingFormat = undefined;
        } else {
            this._streamingFormat = getStreamingFormatFromTypedSource(currentSource);
        }
    };

    /**
     * Collection method for all reserved keys of the SESSION-type and the configured custom keys.
     * @returns A payload object containing all custom keys and all reserved keys of the SESSION-type other than VERSION (which currently is 1 so it must be omitted).
     * @private
     */
    private collectSessionKeys(): CMCDPayload {
        let payload: CMCDPayload = {
            // [CMCDReservedKey.VERSION]: 1 // Client SHOULD omit this field if the version is 1.
        };

        if (this._config.sessionID) {
            payload[CMCDReservedKey.SESSION_ID] = this._config.sessionID;
        }

        if (this._config.contentID) {
            payload[CMCDReservedKey.CONTENT_ID] = this._config.contentID;
        }

        if (this._player.playbackRate !== 1) {
            payload[CMCDReservedKey.PLAYBACK_RATE] = this._player.playbackRate;
        }

        if (this._streamType) {
            payload[CMCDReservedKey.STREAM_TYPE] = this._streamType;
        }

        if (this._streamingFormat) {
            payload[CMCDReservedKey.STREAMING_FORMAT] = this._streamingFormat;
        }

        if (this._config.customKeys) {
            payload = {
                ...payload,
                ...this._config.customKeys
            };
        }

        return payload;
    }

    /**
     * Collection method for all reserved keys of the STATUS-type.
     * @returns A payload object containing all reserved keys of the STATUS-type.
     * @private
     */
    collectStatusKeys(track: MediaTrack | undefined): CMCDPayload {
        const payload: CMCDPayload = {};

        if (this._bufferStarved) {
            payload[CMCDReservedKey.BUFFER_STARVATION] = true;
            this._bufferStarved = false;
        }

        const activeQuality = track?.activeQuality;
        const activeBandwidth = activeQuality?.bandwidth;
        const targetBuffer = this._player.abr.targetBuffer;
        if (activeBandwidth && targetBuffer) {
            payload[CMCDReservedKey.REQUESTED_MAXIMUM_THROUGHPUT] = calculateRequestedMaximumThroughput(
                this._player.currentTime,
                this._player.buffered,
                targetBuffer,
                this._player.playbackRate,
                activeBandwidth
            );
        }

        return payload;
    }

    /**
     * Collects all the CMCD parameters as supported by the connector depending on the provided {@link Request}.
     * @param request The request for which CMCD parameters should be collected.
     * @returns A payload object containing keys for the provided request or `undefined` if CMCD is not applicable for
     * this request
     */
    collect(request: Request): CMCDPayload | undefined {
        if (this._streamingFormat === undefined) {
            return;
        }
        const sessionKeys = this.collectSessionKeys();
        const requestKeys = this._config.sendRequestID
            ? {
                  [CMCDReservedKey.SVA_REQUEST_ID]: uuid()
              }
            : {};
        switch (request.type) {
            case 'manifest': {
                return {
                    ...sessionKeys,
                    ...requestKeys,
                    [CMCDReservedKey.OBJECT_TYPE]: CMCDObjectType.INIT_SEGMENT
                };
            }
            case 'content-protection': {
                return {
                    ...sessionKeys,
                    ...requestKeys,
                    [CMCDReservedKey.OBJECT_TYPE]: CMCDObjectType.KEY_LICENSE_OR_CERTIFICATE
                };
            }
            case 'segment': {
                if (request.subType === 'initialization-segment') {
                    return {
                        ...sessionKeys,
                        ...requestKeys,
                        [CMCDReservedKey.STARTUP]: true,
                        [CMCDReservedKey.OBJECT_TYPE]: CMCDObjectType.INIT_SEGMENT
                    };
                }

                const bufferSize = calculateBufferSize(this._player.currentTime, this._player.buffered);
                // TODO could be better if we have segment info...
                const track =
                    (request.mediaType === 'audio' && this._player.audioTracks[0]) ||
                    (request.mediaType === 'video' && this._player.videoTracks[0]) ||
                    undefined;

                const statusKeys = this.collectStatusKeys(track);
                const payload: CMCDPayload = {
                    ...sessionKeys,
                    ...statusKeys,
                    ...requestKeys,
                    [CMCDReservedKey.OBJECT_TYPE]: getObjectType(request.mediaType) // TODO could be better if we have segment info...
                };

                if (track?.activeQuality) {
                    // Encoded bitrate in kbps
                    if (track.activeQuality.bandwidth) {
                        payload[CMCDReservedKey.ENCODED_BITRATE] = Math.round(track.activeQuality.bandwidth / 1000);
                    }

                    const playableQualities: Quality[][] = track.qualities
                        .slice()
                        .sort(perceptualQualityCompareFunction)
                        .filter(isPlayableFilter.bind(null, request.mediaType))
                        .reduce(redundantQualityGrouper, []);
                    payload[CMCDReservedKey.SVA_PLAYABLE_MANIFEST_INDEX] = playableQualities.length;
                    payload[CMCDReservedKey.SVA_CURRENT_MANIFEST_INDEX] =
                        findQualityGroupIndex(playableQualities, track.activeQuality) + 1;

                    payload[CMCDReservedKey.SVA_TRACK_IDENTIFIER] = track.id ?? track.uid;
                }

                // Top bitrate in kbps
                if (track?.qualities) {
                    const topQuality = track.qualities[track.qualities.length - 1];
                    payload[CMCDReservedKey.TOP_BITRATE] = Math.round(topQuality.bandwidth / 1000);
                }

                // Measured throughput rounded to the closest 100kbps in kbps
                // NOTE only the LL-HLS pipeline realy uses the estimator properly today, so fall back to metrics API for others
                const measuredBandwidth =
                    this._player.network.estimator.bandwidth || this._player.metrics.currentBandwidthEstimate;
                const measuredBandwidthInKbps = measuredBandwidth / 1000;
                payload[CMCDReservedKey.MEASURED_THROUGHPUT] = (measuredBandwidthInKbps / 100 + 1) * 100;

                // Deadline rounded to the closest 100ms in ms.
                payload[CMCDReservedKey.DEADLINE] = Math.round((bufferSize / this._player.playbackRate) * 10) * 100;

                // Buffer length rounded to the closest 100ms in ms.
                payload[CMCDReservedKey.BUFFER_LENGTH] = Math.round(bufferSize * 10) * 100;

                // Startup flag if buffer is empty due to startup, seeking or starvation.
                if (bufferSize < BUFFER_STARVATION_MARGIN) {
                    payload[CMCDReservedKey.STARTUP] = true;
                    if (this._player.played.length === 0) {
                        delete payload[CMCDReservedKey.BUFFER_STARVATION];
                    }
                }

                // TODO object duration
                // TODO next request... and next range
                return payload;
            }
            default:
                return {};
        }
    }

    /**
     * Destruction method responsible to clear up any event listeners.
     */
    destroy(): void {
        this._player.removeEventListener('waiting', this.handleWaiting_);
        this._player.removeEventListener('durationchange', this.handleDurationChange_);
        this._player.removeEventListener('currentsourcechange', this.handleCurrentSourceChange_);
    }
}

/**
 * Maps the provided {@link MediaType} to the corresponding {@link CMCDObjectType}.
 * @param mediaType The media type for which the object type should be retrieved.
 */
function getObjectType(mediaType: MediaType): CMCDObjectType {
    switch (mediaType) {
        case 'audio':
            return CMCDObjectType.AUDIO;
        case 'video':
            return CMCDObjectType.VIDEO;
        case 'text':
            return CMCDObjectType.CAPTION_OR_SUBTITLE;
        case 'image':
        default:
            return CMCDObjectType.OTHER;
    }
}

/**
 * Calculates the maximum throughput which should be provided. This throughput is calculated as the maximum between the current
 * data consumption rate and the rate needed to achieve the target buffer size in a timely fashion. The resulting value is multiplied
 * with {@link REQUESTED_MAXIMUM_THROUGHPUT_SAFETY_FACTOR} in order to ensure a high enough bandwidth is marked.
 * The resulting value is returned rounded up to the next 100kbps in kbps.
 * @param currentTime The current time which is used to calculate the current buffer size.
 * @param buffered The time ranges used to calculate the current buffer size.
 * @param targetBuffer The target buffer which is to be achieved.
 * @param playbackRate The rate at which the player is currently playing.
 * @param activeBandwidth The bandwidth for which the player is currently downloading data.
 */
function calculateRequestedMaximumThroughput(
    currentTime: number,
    buffered: TimeRanges,
    targetBuffer: number,
    playbackRate: number,
    activeBandwidth: number
) {
    const bufferSize = calculateBufferSize(currentTime, buffered);
    const dataConsumptionRate = activeBandwidth * playbackRate;
    const dataRequiredToReachTargetBuffer = activeBandwidth * (targetBuffer - bufferSize);
    const minimumBandwidth = Math.max(dataConsumptionRate, dataRequiredToReachTargetBuffer);
    const requestedMaximumThroughput = minimumBandwidth * REQUESTED_MAXIMUM_THROUGHPUT_SAFETY_FACTOR;
    const requestedMaximumThroughputInKbps = requestedMaximumThroughput / 1000;
    return (requestedMaximumThroughputInKbps / 100 + 1) * 100;
}

/**
 * Compare function which compares two qualities based on their assumed perceptual quality as based on the available
 * bitrate.
 * @param first The first element for this comparison.
 * @param second The second element for this comparison.
 */
function perceptualQualityCompareFunction(first: Quality | undefined, second: Quality): number {
    return (first?.bandwidth ?? 0) - second.bandwidth;
}

/**
 * Filter returning true if the quality provided can be played if it's from the given type and false otherwise.
 * @param type The media type of the quality.
 * @param quality The quality which we want to test.
 */
function isPlayableFilter(type: MediaType, quality: Quality): boolean {
    switch (type) {
        case 'audio':
            return MediaSource.isTypeSupported(`audio/mp4; codecs="${quality.codecs}"`);
        case 'video':
            return MediaSource.isTypeSupported(`video/mp4; codecs="${quality.codecs}"`);
        default:
            return true;
    }
}

/**
 * Reducer which can be used to reduce a list of qualities into a list of qualities grouped based on perceptual quality.
 * Assumes the list being looped is sorted by perceptual quality and an empty list is provided on the first run.
 * @param list The current list of already grouped qualities.
 * @param quality The quality to group.
 */
function redundantQualityGrouper(list: Quality[][], quality: Quality): Quality[][] {
    const lastGroup: Quality[] | undefined = list[list.length - 1];
    const lastGroupElement: Quality | undefined = lastGroup?.[0];
    if (lastGroup && perceptualQualityCompareFunction(lastGroupElement, quality) === 0) {
        lastGroup.push(quality);
    } else {
        list.push([quality]);
    }
    return list;
}

/**
 * Returns the zero-based index of the group to which the provided quality belongs. Behaves similar to `Array.indexOf`.
 * @param qualityGroups The list of quality groups in which we try to find the index.
 * @param quality The quality for which the group index is sought.
 */
function findQualityGroupIndex(qualityGroups: Quality[][], quality: Quality): number {
    for (let index = 0; index < qualityGroups.length; index += 1) {
        if (qualityGroups[index].indexOf(quality) !== -1) {
            return index;
        }
    }
    return -1;
}
