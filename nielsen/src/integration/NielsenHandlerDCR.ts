import type { AdBreakEvent, AdEvent, ChromelessPlayer, DurationChangeEvent, TimeUpdateEvent } from 'theoplayer';
import { loadNielsenLibrary } from '../nielsen/NOLBUNDLE';
import {
    DCRContentMetadata,
    NielsenConfiguration,
    NielsenCountry,
    NielsenDCRContentMetadata,
    NielsenHandler,
    NielsenOptions
} from '../nielsen/Types';
import { buildDCRAdMetadata, buildDCRContentMetadata, getAdType } from '../utils/Util';

export class NielsenHandlerDCR implements NielsenHandler {
    private player: ChromelessPlayer;
    private readonly country: NielsenCountry = NielsenCountry.CZ;
    private metadata: DCRContentMetadata | undefined;

    private lastReportedPlayheadPosition: number | undefined;
    private contentDuration: number | undefined;

    private nSdkInstance: any;

    private contentEnded: boolean;
    private isLiveStream: boolean;
    private didFirstPlay: boolean;

    constructor(
        player: ChromelessPlayer,
        appId: string,
        instanceName: string,
        options?: NielsenOptions,
        configuration?: NielsenConfiguration
    ) {
        this.player = player;
        this.country = configuration?.country ?? NielsenCountry.CZ;
        this.nSdkInstance = loadNielsenLibrary(appId, instanceName, options, configuration?.country);

        this.contentEnded = false;
        this.didFirstPlay = false;
        this.isLiveStream = false;
        this.lastReportedPlayheadPosition = -1;

        this.addEventListeners();
    }

    updateMetadata(metadata: { [key: string]: string }): void {
        if (isNielsenDCRContentMetadata(metadata)) {
            this.metadata = buildDCRContentMetadata(metadata, this.country);
        }
    }

    private addEventListeners(): void {
        this.player.addEventListener('play', this.onFirstPlay);
        this.player.addEventListener('pause', this.onInterrupt);
        this.player.addEventListener('waiting', this.onInterrupt);
        this.player.addEventListener('durationchange', this.onDurationChange);
        this.player.addEventListener('sourcechange', this.onSourceChange);

        if (this.player.ads) {
            this.player.ads.addEventListener('adbegin', this.onAdBegin);
            this.player.ads.addEventListener('adend', this.onAdEnded);
            this.player.ads.addEventListener('adbreakbegin', this.onAdBreakBegin);
            this.player.ads.addEventListener('adbreakend', this.onAdBreakEnd);
        }

        window.addEventListener('beforeunload', this.onBeforeUnload);
    }

    private removeEventListeners(): void {
        this.player.removeEventListener('play', this.onFirstPlay);
        this.player.removeEventListener('pause', this.onInterrupt);
        this.player.removeEventListener('waiting', this.onInterrupt);
        this.player.removeEventListener('durationchange', this.onDurationChange);
        this.player.removeEventListener('sourcechange', this.onSourceChange);

        if (this.player.ads) {
            this.player.ads.removeEventListener('adbegin', this.onAdBegin);
            this.player.ads.removeEventListener('adend', this.onAdEnded);
            this.player.ads.removeEventListener('adbreakbegin', this.onAdBreakBegin);
            this.player.ads.removeEventListener('adbreakend', this.onAdBreakEnd);
        }

        window.removeEventListener('beforeunload', this.onBeforeUnload);
    }

    private onFirstPlay = () => {
        if (!this.didFirstPlay) {
            this.nSdkInstance.ggPM('loadMetadata', this.metadata);
            this.player.addEventListener('timeupdate', this.onTimeUpdate);
            this.didFirstPlay = true;
        }
    };

    private onInterrupt = () => {
        if (this.didFirstPlay) {
            this.nSdkInstance.ggPM('stop', this.getPlayHeadPosition());
        }
    };

    private onDurationChange = (event: DurationChangeEvent) => {
        if (!this.player.ads?.playing) {
            this.contentDuration = event.duration;
        }
    };

    private onTimeUpdate = (event: TimeUpdateEvent) => {
        if (this.contentEnded) {
            return;
        }

        const { currentTime } = event;
        if (currentTime < 0) {
            return;
        }
        const currentTimeFloor = Math.floor(currentTime);
        if (currentTimeFloor === this.lastReportedPlayheadPosition) {
            return;
        }
        this.lastReportedPlayheadPosition = currentTimeFloor;
        this.nSdkInstance.ggPM(
            'setPlayheadPosition',
            !this.isLiveStream ? currentTimeFloor.toString() : Math.floor(Date.now() / 1000)
        );

        // end reached
        if (this.contentDuration && Math.floor(this.contentDuration) === currentTimeFloor) {
            this.contentEnded = true;
            this.nSdkInstance.ggPM('end', currentTimeFloor.toString());
        }
    };

    private onSourceChange = () => {
        // content switch without proper end
        if (this.didFirstPlay && !this.contentEnded) {
            this.nSdkInstance.ggPM('end', this.lastReportedPlayheadPosition);
        }
        // load metadata, reset flags
        this.isLiveStream = this.player.duration === Infinity;
        this.contentDuration = NaN;
        this.contentEnded = false;
        this.didFirstPlay = false;
        this.lastReportedPlayheadPosition = -1;
        this.player.removeEventListener('timeupdate', this.onTimeUpdate);
    };

    private onAdBegin = ({ ad }: AdEvent<'adbegin'>) => {
        if (ad.type !== 'linear') {
            return;
        }

        this.nSdkInstance.ggPM('loadMetadata', buildDCRAdMetadata(ad, this.country, this.contentDuration ?? Infinity));
    };

    private onAdEnded = () => {
        this.nSdkInstance.ggPM('stop', this.lastReportedPlayheadPosition);
    };

    private onAdBreakBegin = ({ adBreak }: AdBreakEvent<'adbreakbegin'>) => {
        if (getAdType(adBreak.timeOffset, this.contentDuration ?? Infinity) === 'midroll') {
            this.nSdkInstance.ggPM('stop', this.lastReportedPlayheadPosition);
        }
    };

    private onAdBreakEnd = () => {
        if (!this.contentEnded) {
            this.nSdkInstance.ggPM('loadMetadata', this.metadata);
        }
    };

    private getPlayHeadPosition(): string {
        return Math.floor(this.player.currentTime).toString();
    }

    private onBeforeUnload = () => {
        if (this.player.ads?.playing) {
            this.nSdkInstance.ggPM('stop', this.getPlayHeadPosition());
        }
        this.nSdkInstance.ggPM('end', this.getPlayHeadPosition());
    };

    destroy() {
        this.removeEventListeners();
    }
}

function isNielsenDCRContentMetadata(obj: unknown): obj is NielsenDCRContentMetadata {
    if (typeof obj !== 'object' || obj === null) return false;

    const entries = Object.entries(obj);
    return entries.every(([, value]) => typeof value === 'string');
}
