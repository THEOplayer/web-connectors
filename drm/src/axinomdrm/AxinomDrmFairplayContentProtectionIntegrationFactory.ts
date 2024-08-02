import { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { AxinomDrmConfiguration } from './AxinomDrmConfiguration';
import { AxinomDrmFairplayContentProtectionIntegration } from './AxinomDrmFairplayContentProtectionIntegration';

export class AxinomDrmFairplayContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: AxinomDrmConfiguration): ContentProtectionIntegration {
        return new AxinomDrmFairplayContentProtectionIntegration(configuration);
    }
}
