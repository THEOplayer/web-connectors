import { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { KeyOSDrmConfiguration } from './KeyOSDrmConfiguration';
import { KeyOSDrmWidevineContentProtectionIntegration } from './KeyOSDrmWidevineContentProtectionIntegration';

export class KeyOSDrmWidevineContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: KeyOSDrmConfiguration): ContentProtectionIntegration {
        return new KeyOSDrmWidevineContentProtectionIntegration(configuration);
    }
}
