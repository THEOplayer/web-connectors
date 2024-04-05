import { SessionPropertiesConstructor } from './SessionProperties';
import { TimedMetadata } from './TimedMetadata';
import { YospaceSessionManagerCreator } from './YospaceSessionManager';

export interface YospaceAdManagement {
    SessionLive: YospaceSessionManagerCreator;
    SessionDVRLive: YospaceSessionManagerCreator;
    SessionVOD: YospaceSessionManagerCreator;
    SessionProperties: SessionPropertiesConstructor;
    TimedMetadata: TimedMetadata;
}
