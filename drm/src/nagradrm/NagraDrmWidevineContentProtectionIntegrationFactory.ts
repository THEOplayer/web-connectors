import { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { NagraDrmConfiguration } from './NagraDrmConfiguration';
import { NagraDrmWidevineContentProtectionIntegration } from './NagraDrmWidevineContentProtectionIntegration';

export class NagraDrmWidevineContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: NagraDrmConfiguration): ContentProtectionIntegration {
        return new NagraDrmWidevineContentProtectionIntegration(configuration);
    }
}
