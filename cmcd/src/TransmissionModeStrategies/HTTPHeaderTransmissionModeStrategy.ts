import type { InterceptableRequest } from 'theoplayer';
import { CMCDHeaderName, CMCDPayload } from '../CMCDPayload';
import { extractKeysFor, transformToQueryParameters } from '../CMCDPayloadUtils';
import { TransmissionModeStrategy } from './TransmissionModeStrategy';

/**
 * The transmission mode strategy to transmit CMCD data as HTTP Headers as specified in section 2.1 of CTA-5004.
 * This strategy will add CMCD headers prefixed with `CMCD-` based on their expected level of variability:
 * - CMCD-Request: keys whose values vary with each request.
 * - CMCD-Object: keys whose values vary with the object being requested.
 * - CMCD-Status: keys whose values do not vary with every request or object.
 * - CMCD-Session: keys whose values are expected to be invariant over the life of the session.
 * Note the addition of these headers will trigger CORS pre-flight requests in most web based environments.
 */
export class HTTPHeaderTransmissionModeStrategy implements TransmissionModeStrategy {
    /**
     * The method responsible to transmit the CMCD payload for the provided request.
     * This strategy piggybacks on the provided request and will add the relevant CMCD headers by redirecting the original request.
     * @param request The request for which the CMCD payload was generated.
     * @param payload The payload which should be sent.
     */
    transmitPayload(request: InterceptableRequest, payload: CMCDPayload): void {
        const headers = request.headers;

        for (const headerName of Object.values(CMCDHeaderName)) {
            const parameters = transformToQueryParameters(extractKeysFor(payload, headerName));
            if (parameters) {
                headers[headerName] = parameters;
            }
        }

        request.redirect({
            ...request,
            headers
        });
    }
}
