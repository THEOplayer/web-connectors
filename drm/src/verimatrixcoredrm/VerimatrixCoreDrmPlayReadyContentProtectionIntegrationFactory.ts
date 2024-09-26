import type { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import type { VerimatrixCoreDrmConfiguration } from './VerimatrixCoreDrmConfiguration';
import { VerimatrixCoreDrmPlayReadyContentProtectionIntegration } from './VerimatrixCoreDrmPlayReadyContentProtectionIntegration';

export class VerimatrixCoreDrmPlayReadyContentProtectionIntegrationFactory
    implements ContentProtectionIntegrationFactory
{
    build(configuration: VerimatrixCoreDrmConfiguration): ContentProtectionIntegration {
        return new VerimatrixCoreDrmPlayReadyContentProtectionIntegration(configuration);
    }
}
