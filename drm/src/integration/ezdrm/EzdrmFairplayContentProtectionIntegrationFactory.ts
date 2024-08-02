import { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { EzdrmDrmConfiguration } from './EzdrmDrmConfiguration';
import { EzdrmFairplayContentProtectionIntegration } from './EzdrmFairplayContentProtectionIntegration';

export class EzdrmFairplayContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: EzdrmDrmConfiguration): ContentProtectionIntegration {
        return new EzdrmFairplayContentProtectionIntegration(configuration);
    }
}
