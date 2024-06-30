export type PlayEvent = "play"
export type BreakEvent = "break"
export type ChangeResolutionEvent = "chngRes"
export type ChangeVolumeEvent = "chngVol"
export type ChangeQualityEvent = "chngQual"

export enum ListEvent {
     NEXT = "next",
     PREVIOUS = "prev"
}

export enum BasicEvent {
    STOP = "stop",
    PAUSE = "pause",
    BUFFER = "buffer",
    SEEK = "seek",
    COMPLETE = "complete",
    CLOSE = "close",
    SKIP = "skip",
    NEXT = "next"
}