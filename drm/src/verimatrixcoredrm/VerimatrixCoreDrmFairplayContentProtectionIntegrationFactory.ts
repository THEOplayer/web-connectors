import type { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import type { VerimatrixCoreDrmConfiguration } from './VerimatrixCoreDrmConfiguration';
import { VerimatrixCoreDrmFairplayContentProtectionIntegration } from './VerimatrixCoreDrmFairplayContentProtectionIntegration';

export class VerimatrixCoreDrmFairplayContentProtectionIntegrationFactory
    implements ContentProtectionIntegrationFactory
{
    build(configuration: VerimatrixCoreDrmConfiguration): ContentProtectionIntegration {
        return new VerimatrixCoreDrmFairplayContentProtectionIntegration(configuration);
    }
}
