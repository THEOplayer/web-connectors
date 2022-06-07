import {SessionProperties} from "./SessionProperties";
import {TimedMetadata} from "./TimedMetadata";
import {YospaceSessionManagerCreator} from "./YospaceSessionManager";

export interface YospaceAdManagement {
    SessionLive: YospaceSessionManagerCreator;
    SessionDVRLive: YospaceSessionManagerCreator;
    SessionVOD: YospaceSessionManagerCreator;
    SessionProperties: SessionProperties;
    TimedMetadata: TimedMetadata;
}
