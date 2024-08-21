import type {
    Ad,
    AddTrackEvent,
    ChromelessPlayer,
    TextTrack,
    TextTrackEnterCueEvent,
    VolumeChangeEvent
} from 'theoplayer';
import { loadNielsenLibrary } from '../nielsen/NOLBUNDLE';
import {
    AdMetadata,
    DTVRContentMetadata,
    NielsenConfiguration,
    NielsenCountry,
    NielsenOptions
} from '../nielsen/Types';
import { getAdType } from '../utils/Util';

const EMSG_PRIV_SUFFIX = 'PRIV{';
const EMSG_PAYLOAD_SUFFIX = 'payload=';

export class NielsenHandler {
    private player: ChromelessPlayer;

    private dcrEnabled: boolean;
    private dtvrEnabled: boolean;
    private country: NielsenCountry = NielsenCountry.US;

    private nSdkInstance: any;

    private sessionInProgress: boolean = false;

    private duration: number = NaN;

    private decoder = new TextDecoder('utf-8');

    constructor(
        player: ChromelessPlayer,
        appId: string,
        instanceName: string,
        options?: NielsenOptions,
        configuration?: NielsenConfiguration
    ) {
        this.player = player;
        this.dcrEnabled = configuration?.enableDCR ?? false;
        this.dtvrEnabled = configuration?.enableDTVR ?? true;
        this.country = configuration?.country ?? NielsenCountry.US;
        this.nSdkInstance = loadNielsenLibrary(appId, instanceName, options, this.country);

        this.addEventListeners();
    }

    updateMetadata(metadata: { [key: string]: string }): void {
        switch (this.country) {
            case NielsenCountry.US: {
                const { type, vidtype, assetid, ...updateableParameters } = metadata;
                console.log(`[NIELSEN] updateMetadata: ${{ type, vidtype, assetid }} will not be updated`);
                this.nSdkInstance.ggPM('updateMetadata', updateableParameters);
                // ex
                break;
            }
            case NielsenCountry.CZ:
            default:
            //
        }
    }

    updateDCRContentMetadata(metadata: DCRContentMetadata): void {
        if (this.dcrEnabled) this.metadata = metadata;
    }

    private addEventListeners(): void {
        this.player.addEventListener('play', this.onPlay);
        this.player.addEventListener('ended', this.onEnd);
        this.player.addEventListener('sourcechange', this.onSourceChange);
        this.player.addEventListener('volumechange', this.onVolumeChange);
        this.player.addEventListener('loadedmetadata', this.onLoadMetadata);
        this.player.addEventListener('durationchange', this.onDurationChange);

        this.player.textTracks.addEventListener('addtrack', this.onAddTrack);

        if (this.player.ads) {
            this.player.ads.addEventListener('adbegin', this.onAdBegin);
        }

        window.addEventListener('beforeunload', this.onEnd);
    }

    private removeEventListeners(): void {
        this.player.removeEventListener('play', this.onPlay);
        this.player.removeEventListener('ended', this.onEnd);
        this.player.removeEventListener('sourcechange', this.onSourceChange);
        this.player.removeEventListener('volumechange', this.onVolumeChange);
        this.player.removeEventListener('loadedmetadata', this.onLoadMetadata);
        this.player.removeEventListener('durationchange', this.onDurationChange);

        this.player.textTracks.removeEventListener('addtrack', this.onAddTrack);

        if (this.player.ads) {
            this.player.ads.removeEventListener('adbegin', this.onAdBegin);
        }

        window.removeEventListener('beforeunload', this.onEnd);
    }

    private onPlay = () => {
        this.maybeSendPlayEvent();
    };

    private onEnd = () => {
        this.endSession();
    };

    private onSourceChange = () => {
        this.duration = NaN;
        this.endSession();
    };

    private onVolumeChange = (event: VolumeChangeEvent) => {
        const volumeLevel = this.player.muted ? 0 : event.volume * 100;
        this.nSdkInstance.ggPM('setVolume', volumeLevel);
    };

    private onDurationChange = () => {
        this.duration = this.player.duration;
        this.maybeSendPlayEvent();
    };

    private onLoadMetadata = () => {
        const data: DTVRContentMetadata = {
            type: 'content',
            adModel: '1' // Always '1' for DTVR
        };
        this.nSdkInstance.ggPM('loadMetadata', data);
    };

    private onAddTrack = (event: AddTrackEvent) => {
        if (event.track.kind === 'metadata') {
            const track = event.track as TextTrack;
            if (track.type === 'id3' || track.type === 'emsg') {
                // Make sure we get cues.
                if (track.mode === 'disabled') {
                    track.mode = 'hidden';
                }
                track.addEventListener('entercue', this.onEnterCue);
            }
        }
    };

    private onEnterCue = (event: TextTrackEnterCueEvent) => {
        const { cue } = event;
        if (cue.content) {
            if (cue.track.type === 'id3') {
                this.handleNielsenId3Payload(cue.content);
            } else if (cue.track.type === 'emsg') {
                this.handleNielsenEmsgPayload(cue.content);
            }
        }
    };

    private handleNielsenId3Payload = (content: any) => {
        if (content.id === 'PRIV' && content.ownerIdentifier.indexOf('www.nielsen.com') !== -1) {
            this.nSdkInstance.ggPM('sendID3', content.ownerIdentifier);
        }
    };

    private handleNielsenEmsgPayload = (content: any) => {
        const cueContentText = this.decoder.decode(content);
        if (cueContentText.startsWith('type=nielsen_tag')) {
            // extract payload
            const base64Index = cueContentText.indexOf(EMSG_PAYLOAD_SUFFIX);
            try {
                if (base64Index !== -1) {
                    const base64Payload = cueContentText.substring(base64Index + EMSG_PAYLOAD_SUFFIX.length);

                    // sanitise base64payload before decoding, remove null and %-encoded chars.
                    // eslint-disable-next-line no-control-regex
                    const sanitizedBase64Payload = base64Payload.replace(/\x00|%[0-9A-Fa-f]{2}/g, '');
                    const payload = atob(sanitizedBase64Payload);

                    // sanitise payload before submitting:
                    // - only allow printable characters within ASCII 32 to 126 range.
                    // - no character beyond the last digit.
                    // - drop everything before ID3 PRIV{
                    let sanitizedPayload = payload.replace(/[^ -~]|\D+$/g, '');
                    const privIndex = sanitizedPayload.indexOf(EMSG_PRIV_SUFFIX);
                    sanitizedPayload =
                        privIndex !== -1
                            ? sanitizedPayload.substring(privIndex + EMSG_PRIV_SUFFIX.length)
                            : sanitizedPayload;

                    // send payload. Note that there is no separate method for sending emsg content.
                    this.nSdkInstance.ggPM('sendID3', sanitizedPayload);
                }
            } catch (error) {
                console.error('NielsenConnector', 'Failed to parse Nielsen payload', error);
            }
        }
    };

    private onAdBegin = () => {
        const currentAd = this.player.ads!.currentAds.filter((ad: Ad) => ad.type === 'linear');
        const type = getAdType(this.player.ads!.currentAdBreak!);
        const adMetadata: AdMetadata = {
            type,
            assetid: currentAd[0].id!
        };
        this.nSdkInstance.ggPM('loadMetadata', adMetadata);
    };

    private maybeSendPlayEvent(): void {
        if (!this.sessionInProgress && !Number.isNaN(this.duration)) {
            this.sessionInProgress = true;
            const metadataObject = {
                channelName: this.player.src,
                length: this.duration
            };
            this.nSdkInstance.ggPM('play', metadataObject);
        }
    }

    private endSession(): void {
        if (this.sessionInProgress) {
            this.sessionInProgress = false;
            this.nSdkInstance.ggPM('end', this.getPlayHeadPosition());
        }
    }

    private getPlayHeadPosition(): string {
        return Math.floor(this.player.currentTime).toString();
    }

    destroy() {
        this.removeEventListeners();
        this.endSession();
    }
}
