import { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { VudrmPlayReadyContentProtectionIntegration } from './VudrmPlayReadyContentProtectionIntegration';
import { VudrmDrmConfiguration } from './VudrmDrmConfiguration';

export class VudrmPlayReadyContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: VudrmDrmConfiguration): ContentProtectionIntegration {
        return new VudrmPlayReadyContentProtectionIntegration(configuration);
    }
}
