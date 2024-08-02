import { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { ComcastDrmConfiguration } from './ComcastDrmConfiguration';
import { ComcastDrmFairPlayContentProtectionIntegration } from './ComcastDrmFairPlayContentProtectionIntegration';

export class ComcastDrmFairPlayContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: ComcastDrmConfiguration): ContentProtectionIntegration {
        return new ComcastDrmFairPlayContentProtectionIntegration(configuration);
    }
}
