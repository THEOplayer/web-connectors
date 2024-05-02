import type { EmsgCue, TextTrackCue, TextTrackCueChangeEvent, YospaceId } from 'theoplayer';
import { YospaceMetadataHandler, YospaceReport } from './YospaceMetadataHandler';

export const YOSPACE_EMSG_SCHEME_ID_URI = 'urn:yospace:a:id3:2016';

function isValidYospaceSchemeIDURI(schemeIDURI: string): boolean {
    return schemeIDURI === YOSPACE_EMSG_SCHEME_ID_URI;
}

function parseEmsgYospaceMetadata(data: number[]): YospaceReport {
    const emsgString = String.fromCharCode(...data);
    const parsedEmsg = emsgString.split(',');
    const result: YospaceReport = {};
    for (const metadataElement of parsedEmsg) {
        const [key, value] = metadataElement.split('=');
        result[key as YospaceId] = value;
    }
    return result;
}

export class YospaceEMSGMetadataHandler extends YospaceMetadataHandler {
    protected doHandleCueChange(cueChangeEvent: TextTrackCueChangeEvent): void {
        const { track } = cueChangeEvent;
        const cues = track.activeCues;
        if (!cues) {
            return;
        }
        const filteredCues = cues.filter((cue: TextTrackCue) => this.isCorrectCueType(cue));
        if (filteredCues.length === 0) {
            return;
        }

        for (let i = 0; i < filteredCues.length; i += i) {
            const cue = filteredCues[i];
            const metadata: YospaceReport = parseEmsgYospaceMetadata(cue.content);
            metadata.startTime = cue.startTime;
            this.reportData(metadata);
        }
    }

    protected isCorrectCueType(cue: TextTrackCue): boolean {
        const emsgCue = cue as EmsgCue;
        return isValidYospaceSchemeIDURI(emsgCue.schemeIDURI);
    }
}
