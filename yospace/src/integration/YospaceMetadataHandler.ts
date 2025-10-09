import type { AddTrackEvent, TextTrack, TextTrackCue, TextTrackCueChangeEvent, TextTracksList } from 'theoplayer';
import type { YospaceWindow } from '../yospace/YospaceWindow';
import type { YospaceSessionManager } from '../yospace/YospaceSessionManager';

export class YospaceReport {
    YMID: string | undefined = undefined;
    YSEQ: string | undefined = undefined;
    YTYP: string | undefined = undefined;
    YDUR: string | undefined = undefined;
    YCSP: string | undefined = undefined;

    constructor(readonly startTime: number) {}

    isComplete(): boolean {
        return this.YMID !== undefined && this.YDUR !== undefined && this.YSEQ !== undefined && this.YTYP !== undefined;
    }
}

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
        if (report.isComplete()) {
            const timedMetadata = (
                window as unknown as YospaceWindow
            ).YospaceAdManagement.TimedMetadata.createFromMetadata(
                report.YMID!,
                report.YSEQ!,
                report.YTYP!,
                report.YDUR!,
                report.startTime * 1000
            );
            this.sessionManager.onTimedMetadata(timedMetadata);
        }
    }

    reset(): void {
        for (const track of this.textTrackList) {
            track.removeEventListener('cuechange', this.handleCueChange);
        }
        this.textTrackList.removeEventListener('addtrack', this.handleAddTrack);
    }
}
