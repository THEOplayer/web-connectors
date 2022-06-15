import {EmsgCue, TextTrackCue, TextTrackCueChangeEvent, TextTracksList, YospaceId} from "theoplayer";
import {YospaceMetadata, YospaceMetadataHandler, YospaceReport} from "./YospaceMetadataHandler";
import {YospaceWindow} from "../yospace/YospaceWindow";
import {YospaceSessionManager} from "../yospace/YospaceSessionManager";

export const YOSPACE_EMSG_SCHEME_ID_URI = 'urn:yospace:a:id3:2016';

function isValidYospaceSchemeIDURI(schemeIDURI: string): boolean {
    return schemeIDURI === YOSPACE_EMSG_SCHEME_ID_URI;
}

function parseEmsgYospaceMetadata(data: number[]): YospaceMetadata {
    const emsgString = String.fromCharCode(...data);
    const parsedEmsg = emsgString.split(',');
    const result: YospaceReport = {};
    parsedEmsg.forEach(metadataElement => {
        const [key, value] = metadataElement.split('=');
        result[key as YospaceId] = value;
    });
    return result as YospaceMetadata;
}

export class YospaceEMSGMetadataHandler extends YospaceMetadataHandler {

    private session: YospaceSessionManager;

    constructor(textTrackList: TextTracksList, session: YospaceSessionManager) {
        super(textTrackList);
        this.session = session;
    }

    protected doHandleCueChange(cueChangeEvent: TextTrackCueChangeEvent): void {
        const {track} = cueChangeEvent;
        const cues = track.activeCues;
        const filteredCues = cues?.filter((cue: TextTrackCue) => this.isCorrectCueType(cue));
        if (!filteredCues) {
            return;
        }

        for (let i = 0; i < filteredCues.length; i += i) {
            const cue = filteredCues[i];
            const metadata: YospaceMetadata = parseEmsgYospaceMetadata(cue.content);
            const {startTime} = cue;
            const timedMetadata = (window as unknown as YospaceWindow).YospaceAdManagement.TimedMetadata.createFromMetadata(metadata.YMID!, metadata.YSEQ!, metadata.YTYP!, metadata.YDUR!, startTime * 1000)
            this.session.onTimedMetadata(timedMetadata);
        }
    }

    protected isCorrectCueType(cue: TextTrackCue): boolean {
        const emsgCue = cue as EmsgCue;
        return isValidYospaceSchemeIDURI(emsgCue.schemeIDURI);
    }

}
