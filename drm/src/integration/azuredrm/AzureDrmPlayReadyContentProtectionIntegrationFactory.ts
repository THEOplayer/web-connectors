import { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { AzureDrmConfiguration } from './AzureDrmConfiguration';
import { AzureDrmPlayReadyContentProtectionIntegration } from './AzureDrmPlayReadyContentProtectionIntegration';

export class AzureDrmPlayReadyContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: AzureDrmConfiguration): ContentProtectionIntegration {
        return new AzureDrmPlayReadyContentProtectionIntegration(configuration);
    }
}
