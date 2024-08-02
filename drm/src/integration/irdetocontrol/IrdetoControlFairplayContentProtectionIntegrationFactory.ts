import { ContentProtectionIntegration, ContentProtectionIntegrationFactory } from 'theoplayer';
import { IrdetoControlConfiguration } from './IrdetoControlConfiguration';
import { IrdetoControlFairplayContentProtectionIntegration } from './IrdetoControlFairplayContentProtectionIntegration';

export class IrdetoControlFairplayContentProtectionIntegrationFactory implements ContentProtectionIntegrationFactory {
    build(configuration: IrdetoControlConfiguration): ContentProtectionIntegration {
        return new IrdetoControlFairplayContentProtectionIntegration(configuration);
    }
}
