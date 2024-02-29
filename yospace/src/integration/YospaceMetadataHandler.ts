import { AddTrackEvent, TextTrack, TextTrackCue, TextTrackCueChangeEvent, TextTracksList } from 'theoplayer';
import { YospaceWindow } from '../yospace/YospaceWindow';
import { YospaceSessionManager } from '../yospace/YospaceSessionManager';

export interface YospaceMetadata {
    YMID: string;
    YSEQ: string;
    YTYP: string;
    YDUR: string;
    YCSP: string;
    startTime: number;
}

export type YospaceReport = Partial<YospaceMetadata>;

export abstract class YospaceMetadataHandler {
    private textTrackList: TextTracksList;

    private sessionManager: YospaceSessionManager;

    constructor(textTrackList: TextTracksList, session: YospaceSessionManager) {
        this.textTrackList = textTrackList;
        this.sessionManager = session;
        this.textTrackList.addEventListener('addtrack', this.handleAddTrack);
    }

    protected handleAddTrack = (event: AddTrackEvent) => {
        const track = event.track as TextTrack;
        if (track.kind !== 'metadata' || !track.cues) {
            return;
        }

        track.addEventListener('cuechange', this.handleCueChange);
    };

    protected abstract isCorrectCueType(cue: TextTrackCue): boolean;

    private handleCueChange = (cueChangeEvent: TextTrackCueChangeEvent) => {
        this.doHandleCueChange(cueChangeEvent);
    };

    protected abstract doHandleCueChange(cueChangeEvent: TextTrackCueChangeEvent): void;

    protected reportData(report: YospaceReport) {
        if (report.YMID && report.YDUR && report.YSEQ && report.YTYP && report.startTime) {
            const timedMetadata = (
                window as unknown as YospaceWindow
            ).YospaceAdManagement.TimedMetadata.createFromMetadata(
                report.YMID,
                report.YSEQ,
                report.YTYP,
                report.YDUR,
                report.startTime * 1000
            );
            this.sessionManager.onTimedMetadata(timedMetadata);
        }
    }

    reset(): void {
        this.textTrackList.forEach((track) => track.removeEventListener('cuechange', this.handleCueChange));
        this.textTrackList.removeEventListener('addtrack', this.handleAddTrack);
    }
}
