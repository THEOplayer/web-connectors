import { NielsenConfiguration, NielsenHandler, NielsenOptions } from '../nielsen/Types';
import { ChromelessPlayer } from 'theoplayer';
import { NielsenHandlerDTVR } from './NielsenHandlerDTVR';
import { NielsenHandlerDCR } from './NielsenHandlerDCR';

/**
 * Returns an appropriate handler specified in the configuration.
 *
 */
export function getNielsenHandler(
    player: ChromelessPlayer,
    appId: string,
    instanceName: string,
    options?: NielsenOptions,
    configuration?: NielsenConfiguration
): NielsenHandler {
    if (configuration?.handlerType === 'DTVR') {
        return new NielsenHandlerDTVR(player, appId, instanceName, options, configuration);
    } else {
        return new NielsenHandlerDCR(player, appId, instanceName, options, configuration);
    }
}
