import {ID3Cue, ID3Frame, ID3Yospace, TextTrackCue, TextTracksList} from "theoplayer";
import {YospaceMetadataHandler, YospaceReport} from "./YospaceMetadataHandler";
import {YospaceWindow} from "../yospace/YospaceWindow";
import {YospaceSessionManager} from "../yospace/YospaceSessionManager";

function isID3YospaceFrame(frame: ID3Frame): frame is ID3Yospace {
    switch (frame.id) {
        case 'YMID':
        case 'YTYP':
        case 'YSEQ':
        case 'YDUR':
        case 'YCSP':
            return true;
        default:
            return false;
    }
}

export class YospaceID3MetadataHandler extends YospaceMetadataHandler {

    private session: YospaceSessionManager;

    constructor(textTrackList: TextTracksList, session: YospaceSessionManager) {
        super(textTrackList);
        this.session = session;
    }

    protected handleCueChange = (cueExitEvent: any): void => {
        const {track} = cueExitEvent;
        const {activeCues} = track;
        this.reportMetadataToYospace(activeCues);
    }

    private reportMetadataToYospace(cues: ID3Cue[]): void {
        const filteredCues = cues.filter((c: ID3Cue) => this.isCorrectCueType(c));
        if (filteredCues.length < 5) {
            return;
        }

        const report: YospaceReport = {};
        let {startTime} = filteredCues[0];
        for (let i = 0; i < filteredCues.length; i += 1) {
            const cue = filteredCues[i];
            const frame = cue.content as ID3Yospace;
            report[frame.id] = frame.text;
            if (cue.startTime !== startTime) {
                const timedMetadata = (window as unknown as YospaceWindow).YospaceAdManagement.TimedMetadata.createFromMetadata(report.YMID!, report.YSEQ!, report.YTYP!, report.YDUR!, startTime * 1000)
                this.session.onTimedMetadata(timedMetadata);
                startTime = cue.startTime;
            }
        }

        if (startTime) {
            const timedMetadata = (window as unknown as YospaceWindow).YospaceAdManagement.TimedMetadata.createFromMetadata(report.YMID!, report.YSEQ!, report.YTYP!, report.YDUR!, startTime * 1000)
            this.session.onTimedMetadata(timedMetadata);
        }
    }

    protected isCorrectCueType = (cue: TextTrackCue): boolean => {
        return cue.content.id && isID3YospaceFrame(cue.content);
    }
}
