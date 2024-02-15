export interface TimedMetadata {
    createFromMetadata(ymid: string, yseq: string, ytyp: string, ydur: string, playhead: number): TimedMetadata;
    getOffset(): number;
    getPlayhead(): number;
    getSegmentCount(): number;
    getSegmentNumber(): number;
    getTypeWithinSegment(): string;
    isDuplicate(previous: TimedMetadata): boolean;
}
