import { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { AxinomDrmConfiguration } from './AxinomDrmConfiguration';
import { AxinomDrmWidevineContentProtectionIntegration } from './AxinomDrmWidevineContentProtectionIntegration';

export class AxinomDrmWidevineContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: AxinomDrmConfiguration): ContentProtectionIntegration {
        return new AxinomDrmWidevineContentProtectionIntegration(configuration);
    }
}
