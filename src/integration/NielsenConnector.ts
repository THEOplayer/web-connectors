import {
    Ad,
    AddTrackEvent,
    ChromelessPlayer,
    Event,
    TextTrack,
    TextTrackEnterCueEvent,
    VolumeChangeEvent
} from "theoplayer";
import { loadNielsenLibrary } from "../nielsen/NOLBUNDLE";
import { ContentMetadata, NielsenOptions } from "../nielsen/Types";
import { getAdType } from "../utils/Util";

export class NielsenConnector {

    private player: ChromelessPlayer;

    private nSdkInstance: any; // TODO fix type?

    private sessionInProgress: boolean = false;

    constructor(player: ChromelessPlayer, appId: string, instanceName: string, options: NielsenOptions) {
        this.player = player;
        this.nSdkInstance = loadNielsenLibrary(appId, instanceName, options);

        this.addEventListeners();
    }

    updateMetadata(metadata: { [ key: string ]: string }): void {
        this.nSdkInstance.ggPM('updateMetadata', metadata);
    }

    private addEventListeners(): void {
        this.player.addEventListener('play', this.onPlay);
        this.player.addEventListener('ended', this.onEnd);
        this.player.addEventListener('sourcechange', this.onEnd);
        this.player.addEventListener('loadedmetadata', this.onLoadMetadata);
        this.player.addEventListener('volumechange', this.onVolumeChange);

        this.player.textTracks.addEventListener('addtrack', this.onAddTrack);

        if (this.player.ads) {
            this.player.ads.addEventListener('adbegin', this.onAdBegin);
        }

        window.addEventListener('beforeunload', this.onEnd);
    }

    private removeEventListeners(): void {
        this.player.removeEventListener('play', this.onPlay);
        this.player.removeEventListener('ended', this.onEnd);
        this.player.removeEventListener('sourcechange', this.onEnd);
        this.player.removeEventListener('loadedmetadata', this.onLoadMetadata);
        this.player.removeEventListener('volumechange', this.onVolumeChange);

        this.player.textTracks.removeEventListener('addtrack', this.onAddTrack);

        window.removeEventListener('beforeunload', this.onEnd);
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
            adModel: '1'
        }
        this.nSdkInstance.ggPM('loadmetadata', data);
    }

    private onAddTrack = (event: AddTrackEvent) => {
        console.log('added track', event.track);
        if (event.track.kind === 'metadata') {
            const track = ( event.track as TextTrack );
            if (track.type === 'id3' || track.type === 'emsg') {
                if (track.mode === 'disabled') {
                    track.mode = 'hidden';
                }
                track.addEventListener('entercue', this.onEnterCue);
            }
        }
    }

    // On add cue? exit cue? enter cue??? Enter cue seems best tbh
    private onEnterCue = (event: TextTrackEnterCueEvent) => {
        const { cue } = event;
        if (cue.track.type === 'id3') {
            if (cue.content.id === 'PRIV' && cue.content.ownerIdentifier.indexOf('www.nielsen.com') !== -1) {
                this.nSdkInstance.ggPM('sendID3', cue.content.ownerIdentifier);
            }
        } else {
            // DASH emsg
            // TODO test once we get DASH stream, verify if below is valid (with changes as I got it from old integration)
            // if (cue.schemeIDURI && cue.schemeIDURI.indexOf(NIELSEN_ID) > -1) {
            //     this.nielsenApi.sendId3Payload(cue.content);
            // }
        }
    }

    private onEnd = () => {
        if (this.sessionInProgress) {
            this.sessionInProgress = false;
            this.nSdkInstance.ggPM('end', this.getPlayHeadPosition());
        }
    }

    private onPlay = () => {
        if (!this.sessionInProgress) {
            this.sessionInProgress = true;
            // TODO pass metadataObject instead? https://engineeringportal.nielsen.com/docs/play_(Browser)
            this.nSdkInstance.ggPM('play', this.getPlayHeadPosition());
        }
    }

    private onAdBegin = (event: Event) => {
        const currentAd = this.player.ads!.currentAds.filter((ad: Ad) => ad.type === 'linear');
        if (currentAd.length !== 1) {
            console.error('WAIT I THOUGHT WE WOULD HAVE A LINEAR AD, lets hope it is only nonlinear!', currentAd, this.player.ads!.currentAds);
        }

        const type = getAdType(this.player.ads!.currentAdBreak!);
        const adMetadata = {
            type,
            // TODO check if id is always filled
            assetid: currentAd[ 0 ].id
        }
        this.nSdkInstance.ggPM('loadMetadata', adMetadata);
    }

    private getPlayHeadPosition(): string {
        return Math.floor(this.player.currentTime).toString();
    }

    destroy() {
        this.removeEventListeners();
    }
}
