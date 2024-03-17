import { AdBreakEvent, AdEvent, ChromelessPlayer, EndedEvent, LoadedDataEvent, LoadedMetadataEvent, PauseEvent, PlayingEvent, RateChangeEvent, SeekingEvent, SourceChangeEvent, TimeUpdateEvent, WaitingEvent } from "theoplayer";
import { ComscoreConfiguration } from "../api/ComscoreConfiguration";
import { ComscoreMetadata } from "../api/ComscoreMetadata";

enum ComscoreState {
    INITIALIZED,
    ADVERTISEMENT,
    ADVERTISEMENT_PAUSED,
    VIDEO,
    VIDEO_PAUSED,
    STOPPED
}

export class ComscoreTHEOIntegration {
    private player: ChromelessPlayer;
    private configuration: ComscoreConfiguration;
    private contentMetadata: ComscoreMetadata;
    private state = ComscoreState.INITIALIZED

    constructor(player: ChromelessPlayer, configuration: ComscoreConfiguration, metadata: ComscoreMetadata) {
        this.player = player
        this.configuration = configuration
        this.contentMetadata = metadata
    }

    public update(metadata: ComscoreMetadata) {
        this.contentMetadata = metadata;
    }

    public destroy() {
        // this.removeListeners();
    }

    private addListeners(): void {
        this.player.addEventListener("sourcechange", this.onSourceChange);
        this.player.addEventListener("ended", this.onEnded);
        this.player.addEventListener("loadeddata", this.onLoadedData);
        this.player.addEventListener("loadedmetadata", this.onLoadedMetadata);
        this.player.addEventListener("playing", this.onPlaying);
        this.player.addEventListener("seeking", this.onSeeking);
        this.player.addEventListener("pause", this.onPause);
        this.player.addEventListener("timeupdate", this.onTimeUpdate);
        this.player.addEventListener("ratechange", this.onRateChange);
        this.player.addEventListener("waiting", this.onWaiting);

        if (this.player.ads) {
            this.player.ads.addEventListener("adbegin", this.onAdBegin);
            this.player.ads.addEventListener("adbreakend", this.onAdBreakEnd);
        }
    }

    private removeListeners(): void {
        this.player.removeEventListener("sourcechange", this.onSourceChange);
        this.player.removeEventListener("ended", this.onEnded);
        this.player.removeEventListener("loadeddata", this.onLoadedData);
        this.player.removeEventListener("loadedmetadata", this.onLoadedMetadata);
        this.player.removeEventListener("playing", this.onPlaying);
        this.player.removeEventListener("seeking", this.onSeeking);
        this.player.removeEventListener("pause", this.onPause);
        this.player.removeEventListener("timeupdate", this.onTimeUpdate);
        this.player.removeEventListener("ratechange", this.onRateChange);
        this.player.removeEventListener("waiting", this.onWaiting);

        if (this.player.ads) {
            this.player.ads.removeEventListener("adbegin", this.onAdBegin);
            this.player.ads.removeEventListener("adbreakend", this.onAdBreakEnd);
        }
    }

    private onSourceChange(event: SourceChangeEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onPlaying(event: PlayingEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onEnded(event: EndedEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onLoadedData(event: LoadedDataEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onLoadedMetadata(event: LoadedMetadataEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onSeeking(event: SeekingEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onPause(event: PauseEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onAdBegin(event: AdEvent<"adbegin">) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onAdBreakEnd(event: AdBreakEvent<"adbreakend">) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onTimeUpdate(event: TimeUpdateEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onRateChange(event: RateChangeEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onWaiting(event: WaitingEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }


}