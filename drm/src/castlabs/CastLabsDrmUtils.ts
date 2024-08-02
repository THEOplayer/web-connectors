import { CastLabsDrmConfiguration } from './CastLabsDrmConfiguration';

export function isCastLabsDrmDRMConfiguration(configuration: CastLabsDrmConfiguration): boolean {
    return (
        configuration.integrationParameters.merchant !== undefined &&
        configuration.integrationParameters.sessionId !== undefined &&
        configuration.integrationParameters.userId !== undefined
    );
}
