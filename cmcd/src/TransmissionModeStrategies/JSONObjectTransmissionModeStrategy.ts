import type { InterceptableRequest } from 'theoplayer';
import type { CMCDPayload } from '../CMCDPayload';
import type { TransmissionModeStrategy } from './TransmissionModeStrategy';

/**
 * The transmission mode strategy to transmit CMCD data as a JSON object to an alternative endpoint as specified in section 2.3 of CTA-5004.
 * This means the {@link CMCDPayload} will be sent as the body of an HTTP POST body as a plain JSON object for the configured URI.
 */
export class JSONObjectTransmissionModeStrategy implements TransmissionModeStrategy {
    private readonly _uri: string;

    /**
     * Creates a new instance and ensures configuration of the provided endpoint.
     * @param uri The endpoint to which any payload is to be sent.
     */
    constructor(uri: string) {
        this._uri = uri;
    }

    /**
     * The method responsible to transmit the CMCD payload for the provided request.
     * This strategy will send out a beacon containing a JSON representation of the payload to the configured URI.
     * @param request The request for which the CMCD payload was generated.
     * @param payload The payload which should be sent.
     */
    transmitPayload(request: InterceptableRequest, payload: CMCDPayload): void {
        const data = JSON.stringify(payload);
        navigator.sendBeacon(this._uri, data);
    }
}
