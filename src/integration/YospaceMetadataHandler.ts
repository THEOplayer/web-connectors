import {AddTrackEvent, TextTrack, TextTrackCue, TextTrackCueChangeEvent, TextTracksList} from 'theoplayer';

export interface YospaceMetadata {
    YMID: string;
    YSEQ: string;
    YTYP: string;
    YDUR: string;
    YCSP: string;
}

export type YospaceReport = Partial<YospaceMetadata>;

export abstract class YospaceMetadataHandler {

   private textTrackList: TextTracksList;

    protected constructor(textTrackList: TextTracksList) {
        this.textTrackList = textTrackList;
        this.textTrackList.addEventListener('addtrack', this.handleAddTrack);
    }

    protected handleAddTrack = (event: AddTrackEvent) => {
        const track = event.track as TextTrack;
        if (track.kind !== 'metadata' || !track.cues) {
            return;
        }

        track.addEventListener('cuechange', this.handleCueChange);
    }

    protected abstract isCorrectCueType(cue: TextTrackCue): boolean;

    private handleCueChange = (cueChangeEvent: TextTrackCueChangeEvent) => {
        this.doHandleCueChange(cueChangeEvent);
    }

    protected abstract doHandleCueChange(cueChangeEvent: TextTrackCueChangeEvent): void;

    reset(): void {
        this.textTrackList.forEach((track) => track.removeEventListener('cuechange', this.handleCueChange));
        this.textTrackList.removeEventListener('addtrack', this.handleAddTrack);
    }
}