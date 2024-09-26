import { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { KeyOSDrmConfiguration } from './KeyOSDrmConfiguration';
import { KeyOSDrmFairplayContentProtectionIntegration } from './KeyOSDrmFairplayContentProtectionIntegration';

export class KeyOSDrmFairplayContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: KeyOSDrmConfiguration): ContentProtectionIntegration {
        return new KeyOSDrmFairplayContentProtectionIntegration(configuration);
    }
}
