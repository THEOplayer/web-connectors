import { ID3Frame, ID3Yospace, TextTrackCue, TextTrackCueChangeEvent } from 'theoplayer';
import { YospaceMetadataHandler, YospaceReport } from './YospaceMetadataHandler';

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
    protected doHandleCueChange(cueChangeEvent: TextTrackCueChangeEvent): void {
        const { track } = cueChangeEvent;
        const cues = track.activeCues;
        if (!cues) {
            return;
        }
        const filteredCues = cues.filter((c: TextTrackCue) => this.isCorrectCueType(c));
        if (filteredCues.length === 0) {
            return;
        }

        let report: YospaceReport = {};
        report.startTime = filteredCues[0].startTime;
        for (let i = 0; i < filteredCues.length; i += 1) {
            const cue = filteredCues[i];
            const frame = cue.content as ID3Yospace;
            report[frame.id] = frame.text;
            if (cue.startTime !== report.startTime) {
                this.reportData(report);
                report = {};
                report.startTime = cue.startTime;
            }
        }

        this.reportData(report);
    }

    protected isCorrectCueType(cue: TextTrackCue): boolean {
        return cue.content.id && isID3YospaceFrame(cue.content);
    }
}
