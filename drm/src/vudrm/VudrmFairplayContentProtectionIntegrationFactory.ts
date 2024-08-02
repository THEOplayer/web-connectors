import { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { VudrmDrmConfiguration } from './VudrmDrmConfiguration';
import { VudrmFairplayContentProtectionIntegration } from './VudrmFairplayContentProtectionIntegration';

export class VudrmFairplayContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: VudrmDrmConfiguration): ContentProtectionIntegration {
        return new VudrmFairplayContentProtectionIntegration(configuration);
    }
}
