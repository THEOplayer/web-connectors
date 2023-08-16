import {InterceptableRequest} from 'theoplayer';
import {CMCDPayload} from '../CMCDPayload';
import {transformToQueryParameters} from '../CMCDPayloadUtils';
import {TransmissionModeStrategy} from './TransmissionModeStrategy';

/**
 * The transmission mode strategy to transmit CMCD data as query arguments as specified in section 2.2 of CTA-5004.
 * This strategy will append a `CMCD` parameter containing the url encoded concatenation of all key value pairs.
 */
export class QueryArgumentTransmissionModeStrategy implements TransmissionModeStrategy {

    /**
     * The method responsible to transmit the CMCD payload for the provided request.
     * This strategy piggybacks on the provided request and will add a `CMCD` parameter to the query string by redirecting
     * the original request.
     * @param request The request for which the CMCD payload was generated.
     * @param payload The payload which should be sent.
     */
    transmitPayload(request: InterceptableRequest, payload: CMCDPayload): void {
        const url = new URL(request.url);
        const parameters = transformToQueryParameters(payload);
        if (parameters) {
            url.searchParams.append('CMCD', parameters);
            request.redirect({
                ...request,
                url: url.href
            });
        }
    }
}