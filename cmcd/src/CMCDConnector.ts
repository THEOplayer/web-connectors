import { ChromelessPlayer, InterceptableRequest, Request } from 'theoplayer';
import { CMCDCollector } from './CMCDCollector';
import { CMCDPayload } from './CMCDPayload';
import { Configuration, TransmissionMode } from './Configuration';
import { uuid } from './RandomUtils';
import {
    createTransmissionModeStrategyFor,
    TransmissionModeStrategy
} from './TransmissionModeStrategies/TransmissionModeStrategy';

/**
 * Type for processors which are triggered before a CMCD payload is transmitted.
 * The `payload` parameter contains the actual payload which will be transmitted.
 * The `request` parameter contains the request for which the payload was generated. Note this is before any addition of
 * payload data if it will be piggy backing on this request.
 * The returned payload should be the payload which will be transmitted.
 */
export type CMCDPayloadProcessor = (payload: CMCDPayload, request: Request) => CMCDPayload;

/**
 * The connector between a THEOplayer Player instance and a Common Media Client Data (CMCD) server.
 * This implementation supports CMCD data as defined in CTA-5004, published in September 2020.
 *
 * Note that when native playback is being used, either through THEOplayer's configuration, or due to absence of MSE/EME APIs
 * (such as on iOS Safari), the {@link TransmissionMode.JSON_OBJECT} should be used.
 *
 * All standardized reserved keys are reported, except:
 * - Object duration (d)
 * - Next object request (nor)
 * - Next range request (nrr)
 */
export class CMCDConnector {
    private _transmissionModeStrategy: TransmissionModeStrategy | undefined;
    private _collector: CMCDCollector | undefined;
    private readonly _player: ChromelessPlayer;
    private _processor: CMCDPayloadProcessor | undefined;
    private readonly _sessionID: string;

    /**
     * Creates a new connector for the given player, following the provided configuration. If no session ID is provided,
     * the session ID will be set to a random UUIDv4.
     * @param player The THEOplayer.Player instance for which common media client data is to be reported.
     * @param configuration The {@link Configuration} detailing how the data is to be logged. When no configuration is provided,
     *        the {@link TransmissionMode.QUERY_ARGUMENT} transmission mode will be used in order to avoid CORS preflight requests in browsers.
     */
    constructor(player: ChromelessPlayer, configuration?: Configuration) {
        this._player = player;
        this._sessionID = configuration?.sessionID || uuid();
        this.reconfigure(configuration);
        player.network.addRequestInterceptor(this.interceptor_);
        player.addEventListener('destroy', this.onDestroy_);
    }

    /**
     * The interceptor which ensures a payload is constructed for every request which should be fired.
     *
     * @param request The request which is fired.
     */
    private interceptor_ = (request: InterceptableRequest) => {
        if (this._collector === undefined || this._transmissionModeStrategy === undefined) {
            return;
        }

        let payload = this._collector.collect(request);
        if (this._processor) {
            payload = this._processor(payload, request);
        }
        this._transmissionModeStrategy.transmitPayload(request, payload); // TODO add callback/processor
    };

    /**
     * Handler to observe player destruction and automatically destroy the connector and all created objects.
     */
    private onDestroy_ = () => {
        this.destroy();
    };

    /**
     * Resets the configuration of the connector. The connector will halt all transmissions and new transmissions will be
     * made as per the updated configuration. If no new session ID is provided, the previous session ID will be reused.
     * @param configuration The {@link Configuration} detailing how the data is to be logged. When no configuration is provided,
     *        the {@link TransmissionMode.QUERY_ARGUMENT} transmission mode will be used in order to avoid CORS preflight requests in browsers.
     */
    reconfigure(configuration?: Configuration): void {
        const config: Configuration = {
            transmissionMode: TransmissionMode.QUERY_ARGUMENT,
            sessionID: this._sessionID,
            ...configuration
        };
        this._collector?.destroy();
        this._collector = new CMCDCollector(this._player, config);
        this._transmissionModeStrategy = createTransmissionModeStrategyFor(config);
    }

    /**
     * Returns the current processor which will be called before transmitting any CMCD payload, or undefined if no
     * processor is known.
     */
    get processor(): CMCDPayloadProcessor | undefined {
        return this._processor;
    }

    /**
     * Modifies the current processor which will be called before transmitting any CMCD payload data. This value can be
     * set to `undefined` to remove the current processor.
     * @param value The processor which must be used for any subsequent payload about to be transmitted or `undefined` if
     * no processor is to be used.
     */
    set processor(value: CMCDPayloadProcessor | undefined) {
        this._processor = value;
    }

    /**
     * Stops all operation of the connector.
     */
    destroy(): void {
        this._player.removeEventListener('destroy', this.onDestroy_);
        this._player.network.removeRequestInterceptor(this.interceptor_);
        this._collector?.destroy();
    }
}

export function createCMCDConnector(player: ChromelessPlayer, configuration?: Configuration): CMCDConnector {
    return new CMCDConnector(player, configuration);
}
