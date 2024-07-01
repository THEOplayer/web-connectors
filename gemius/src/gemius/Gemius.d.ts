import { 
    NewAdAdditionalParameters,
    NewProgramAdditionalParameters,
    PlayAdEventAdditionalParameters,
    PlayProgramEventAdditionalParameters,
    PlayerAdditionalParameters,
    ListEventAdditionalParameters,
    ChangeResolutionEventAddtionalParameters,
    ChangeVolumeEventAddtionalParameters,
    ChangeQualityEventAddtionalParameters 
} from "../integration/GemiusParameters";
import { 
    PlayEvent,
    ListEvent,
    ChangeResolutionEvent,
    ChangeVolumeEvent,
    ChangeQualityEvent,
    BreakEvent,
    BasicEvent 
} from '../integration/GemiusEvents'


export class GemiusPlayer {
    constructor(playerID: string, gemiusID: string, additionalParameters?: PlayerAdditionalParameters);
    newProgram(programID: string, additionalParameters: NewProgramAdditionalParameters);
    newAd(adId: string, additionalParameters?: NewAdAdditionalParameters)

    // List event
    programEvent(programID: string, offset: number, event: ListEvent, additionalParameters?: ListEventAdditionalParameters)

    // Change resolution events
    programEvent(programID: string, offset: number, event: ChangeResolutionEvent, additionalParameters?: ChangeResolutionEventAddtionalParameters)
    adEvent(programID: string, offset: number, event: ChangeResolutionEvent, additionalParameters?: ChangeResolutionEventAddtionalParameters)

    // Change volume events
    programEvent(programID: string, offset: number, event: ChangeVolumeEvent, additionalParameters?: ChangeVolumeEventAddtionalParameters)
    adEvent(programID: string, adID: string, offset: number, event: ChangeVolumeEvent, additionalParameters?: ChangeVolumeEventAddtionalParameters)

    // Change quality events
    programEvent(programID: string, offset: number, event: ChangeQualityEvent, additionalParameters?: ChangeQualityEventAddtionalParameters)
    adEvent(programID: string, adID: string, offset: number, event: ChangeQualityEvent, additionalParameters?: ChangeQualityEventAddtionalParameters)

    // Play event
    adEvent(programID: string, adID: string, offset: number, event: PlayEvent, additionalParameters: PlayAdEventAdditionalParameters)
    programEvent(programID: string, offset: number, event: PlayEvent, additionalParameters: PlayProgramEventAdditionalParameters)

    // Break event (program only)
    programEvent(programID: string, offset: number, event: BreakEvent)

    // Basic events for both program and ads that don't require additional parameters
    adEvent(programID: string, adID: string, offset: number, event: BasicEvent)
    programEvent(programID: string, offset: number, event: BasicEvent)

    dispose();
    


}