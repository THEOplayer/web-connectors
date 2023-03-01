import { AddTrackEvent, ChromelessPlayer, TextTrack, TextTrackCueChangeEvent, VolumeChangeEvent } from "theoplayer";
import { loadNielsenLibrary } from "../nielsen/NOLBUNDLE";
import { AdMetadata, ContentMetadata, NielsenOptions } from "../nielsen/Types";

export class NielsenConnector {

    private player: ChromelessPlayer;

    private nSdkInstance: any; // TODO fix type?

    constructor(player: ChromelessPlayer, appId: string, instanceName: string, debug: boolean) {
        this.player = player;
        const nielsenOptions: NielsenOptions = {};
        if (debug) {
            nielsenOptions.nol_sdkDebug = 'debug';
        }
        this.nSdkInstance = loadNielsenLibrary(appId, instanceName, nielsenOptions);

        this.addEventListeners();
    }

    updateMetadata(metadata: { [key: string]: string }): void {
        this.nSdkInstance.ggPM('updateMetadata', metadata);
    }

    setAdMetadata(metadata: AdMetadata): void {
        // TODO
    }

    private addEventListeners(): void {
        this.player.addEventListener('volumechange', this.onVolumeChange);
        this.player.addEventListener('loadedmetadata', this.onLoadMetadata);
        this.player.addEventListener('ended', this.onEnd);
        this.player.addEventListener('sourcechange', this.onEnd);

        this.player.textTracks.addEventListener('addtrack', this.onAddTrack);
    }

    private removeEventListeners(): void {
        this.player.removeEventListener('volumechange', this.onVolumeChange);
        this.player.removeEventListener('loadedmetadata', this.onLoadMetadata);
        this.player.removeEventListener('ended', this.onEnd);
        this.player.removeEventListener('sourcechange', this.onEnd);

        this.player.textTracks.removeEventListener('addtrack', this.onAddTrack);
    }

    // TODO check if necessary?
    private onVolumeChange = (event: VolumeChangeEvent) => {
        const volumeLevel = this.player.muted ? 0 : event.volume * 100;
        this.nSdkInstance.ggPM('setVolume', volumeLevel);
    }

    private onLoadMetadata = () => {
        console.log('SENDING LOADMETADATA');
        const data: ContentMetadata = {
            type: 'content',
            adModel: '1',
            custom: 'value'
        }
        this.nSdkInstance.ggPM('loadmetadata', data);
    }

    private onAddTrack = (event: AddTrackEvent) => {
        console.log('added track', event.track);
        if (event.track.kind === 'metadata') {
            const track = (event.track as TextTrack);
            if (track.type === 'id3' || track.type === 'emsg') {
                if (track.mode === 'disabled') {
                    track.mode = 'hidden';
                }
                track.addEventListener('cuechange', this.onCueChange);
            }

        }
    }

    private onCueChange = (event: TextTrackCueChangeEvent) => {
        console.log('oncuechange', event);
    }

    private onEnd = () => {
        const playHeadPosition = Math.floor(this.player.currentTime).toString()
        this.nSdkInstance.ggPM('end', playHeadPosition);
    }

    destroy() {
        this.nSdkInstance.destroy() // TODO check if this is how it should be? also what about player?
        this.removeEventListeners();
    }
}
