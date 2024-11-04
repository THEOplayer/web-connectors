import type {
    AddTrackEvent,
    TextTrack,
    TextTrackCue,
    TextTrackCueChangeEvent,
    TextTracksList,
    YospaceId
} from 'theoplayer';
import { YospaceSessionManager } from '../yospace/YospaceSessionManager';
import { TimedMetadata } from '../yospace/TimedMetadata';

export class YospaceReport {
    YMID: string | undefined = undefined;
    YSEQ: string | undefined = undefined;
    YTYP: string | undefined = undefined;
    YDUR: number | undefined = undefined;
    YCSP: string | undefined = undefined;

    constructor(readonly startTime: number) {}

    set(key: YospaceId, value: any): void {
        switch (key) {
            case 'YDUR': {
                this.YDUR = Number(value);
                break;
            }
            case 'YMID':
            case 'YTYP':
            case 'YSEQ':
            case 'YCSP': {
                this[key] = String(value);
                break;
            }
        }
    }

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
            const timedMetadata = TimedMetadata.createFromMetadata(
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
