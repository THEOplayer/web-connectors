import type { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import type { VerimatrixCoreDrmConfiguration } from './VerimatrixCoreDrmConfiguration';
import { VerimatrixCoreDrmWidevineContentProtectionIntegration } from './VerimatrixCoreDrmWidevineContentProtectionIntegration';

export class VerimatrixCoreDrmWidevineContentProtectionIntegrationFactory
    implements ContentProtectionIntegrationFactory
{
    build(configuration: VerimatrixCoreDrmConfiguration): ContentProtectionIntegration {
        return new VerimatrixCoreDrmWidevineContentProtectionIntegration(configuration);
    }
}
