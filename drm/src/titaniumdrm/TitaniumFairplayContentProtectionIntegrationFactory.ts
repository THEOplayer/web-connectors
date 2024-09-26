import type { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { TitaniumFairplayContentProtectionIntegration } from './TitaniumFairplayContentProtectionIntegration';
import type { TitaniumDrmConfiguration } from './TitaniumDrmConfiguration';

export class TitaniumFairplayContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: TitaniumDrmConfiguration): ContentProtectionIntegration {
        return new TitaniumFairplayContentProtectionIntegration(configuration);
    }
}
