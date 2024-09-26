import type { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { VudrmWidevineContentProtectionIntegration } from './VudrmWidevineContentProtectionIntegration';
import { VudrmDrmConfiguration } from './VudrmDrmConfiguration';

export class VudrmWidevineContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: VudrmDrmConfiguration): ContentProtectionIntegration {
        return new VudrmWidevineContentProtectionIntegration(configuration);
    }
}
