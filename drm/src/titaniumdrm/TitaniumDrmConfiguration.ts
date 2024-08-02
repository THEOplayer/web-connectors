import type { DRMConfiguration } from 'theoplayer';
import type { TitaniumIntegrationParameters } from './TitaniumIntegrationParameters';

export type TitaniumIntegrationID = 'titaniumdrm';

export interface TitaniumDrmConfiguration extends DRMConfiguration {
    integration: TitaniumIntegrationID;

    integrationParameters: TitaniumIntegrationParameters;
}
