import type { SessionPropertiesConstructor } from './SessionProperties';
import type { TimedMetadata } from './TimedMetadata';
import type { YospaceSessionManagerCreator } from './YospaceSessionManager';
import { BreakType, ResourceType, ViewableEvent } from './AdBreak';

export interface YospaceAdManagement {
    SessionLive: YospaceSessionManagerCreator;
    SessionDVRLive: YospaceSessionManagerCreator;
    SessionVOD: YospaceSessionManagerCreator;
    SessionProperties: SessionPropertiesConstructor;
    TimedMetadata: TimedMetadata;
    ResourceType: typeof ResourceType;
    ViewableEvent: typeof ViewableEvent;
    BreakType: typeof BreakType;
}
