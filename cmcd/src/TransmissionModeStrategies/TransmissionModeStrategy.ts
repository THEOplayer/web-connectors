import { InterceptableRequest } from 'theoplayer';
import { CMCDPayload } from '../CMCDPayload';
import { Configuration, TransmissionMode } from '../Configuration';
import { HTTPHeaderTransmissionModeStrategy } from './HTTPHeaderTransmissionModeStrategy';
import { JSONObjectTransmissionModeStrategy } from './JSONObjectTransmissionModeStrategy';
import { QueryArgumentTransmissionModeStrategy } from './QueryArgumentTransmissionModeStrategy';

/**
 * The main interface for all transmission modes.
 */
export interface TransmissionModeStrategy {
    /**
     * The method responsible to transmit the CMCD payload for the provided request. The strategy can either piggyback
     * on the provided request, or can issue a parallel request.
     * @param request The request for which the CMCD payload was generated.
     * @param payload The payload which should be sent.
     */
    transmitPayload(request: InterceptableRequest, payload: CMCDPayload): void;
}

/**
 * Factory function to create the appropriate {@link TransmissionModeStrategy}.
 * @param configuration The configuration of the connector containing information on the proper instantiation of the transmission mode.
 * @throws Error when {@link TransmissionMode.JSON_OBJECT} is to be used, but no {@link Configuration.jsonObjectTargetURI} is provided.
 */
export function createTransmissionModeStrategyFor(configuration: Configuration): TransmissionModeStrategy {
    switch (configuration.transmissionMode) {
        case TransmissionMode.HTTP_HEADER:
            return new HTTPHeaderTransmissionModeStrategy();
        case TransmissionMode.JSON_OBJECT:
            if (!configuration.jsonObjectTargetURI) {
                throw new Error(
                    'When using the `TransmissionMode.JSON_OBJECT` transmission mode, a `jsonObjectTargetURI` must be provided.'
                );
            }
            return new JSONObjectTransmissionModeStrategy(configuration.jsonObjectTargetURI);
        case TransmissionMode.QUERY_ARGUMENT:
        default:
            return new QueryArgumentTransmissionModeStrategy();
    }
}
