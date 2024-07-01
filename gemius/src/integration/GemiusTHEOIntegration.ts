import {
    Ad,
    AdBreakEvent,
    ChromelessPlayer,
    PauseEvent,
    PlayEvent,
    SourceChangeEvent,
    WaitingEvent,
} from 'theoplayer';
import { GemiusPlayer } from '../gemius/Gemius';
import { GemiusConfiguration } from './GemiusConfiguration';
import { GemiusProgramParameters } from './GemiusParameters';
import { Logger } from '../utils/Logger';
import { BasicEvent } from './GemiusEvents';

const THEOPLAYER_ID = "THEOplayer"

const DEFAULT_AD_ID = "PLACEHOLDER ID"

export class GemiusTHEOIntegration {
    // References for constructor arguments
    private player: ChromelessPlayer;
    private debug: boolean;
    private gemiusPlayer: GemiusPlayer;
    private programParameters: GemiusProgramParameters;

    private partCount: number = 1;
    private adCount: number = 1;
    private inAd: boolean = false;
    private currentAd: Ad | undefined;

    constructor(player: ChromelessPlayer, configuration: GemiusConfiguration, programParameters: GemiusProgramParameters) {
        this.player = player;
        this.debug = configuration.debug ?? false; 
        this.gemiusPlayer = new GemiusPlayer(THEOPLAYER_ID ,configuration.gemiusID, {});
        this.programParameters = programParameters;
        this.addListeners();
    }

    public destroy() {
        this.removeListeners();
        this.gemiusPlayer.dispose();
    }

    private addListeners(): void {
        this.player.addEventListener('sourcechange', this.onSourceChange);
        this.player.addEventListener('play', this.onPlay);
        this.player.addEventListener('pause', this.onPause);
        if (this.player.ads) {
            this.player.ads.addEventListener('adbreakbegin', this.onAdBreakBegin)
        }
    }

    private removeListeners(): void {
        this.player.removeEventListener('sourcechange', this.onSourceChange);
        this.player.removeEventListener('play', this.onPlay);
        this.player.removeEventListener('pause', this.onPause);
        if (this.player.ads) {
            this.player.ads.removeEventListener('adbreakbegin', this.onAdBreakBegin)
        }
    }

    // EVENT HANDLERS
    private onSourceChange = (event: SourceChangeEvent) => {
        Logger.log(event);
        if (!this.programParameters) {
            console.log(`[GEMIUS] No program parameters were provdided`);
            return;
        }
        if (!event.source) {
            // TODO handle some clear source flow
            return;
        }
        this.partCount = 1;
        this.currentAd = undefined;

        const { programID, customAttributes, ...additionalParameters } = this.programParameters
        this.gemiusPlayer.newProgram(programID, {...additionalParameters, ...customAttributes})
    };

    private onPlay = (event: PlayEvent) => {
        Logger.log(event);
        const { programID } = this.programParameters;
        const computedVolume = this.player.muted ? -1 : (this.player.volume * 100)
        if (this.currentAd) {
            const { id, adBreak, duration } = this.currentAd;
            const { timeOffset, ads } = adBreak
            this.gemiusPlayer.adEvent(programID, id ?? DEFAULT_AD_ID, timeOffset, "play", {
                autoPlay: true,
                adPosition: this.adCount,
                breakSize: ads?.length,
                // resolution: `AxB`, TODO
                volume: computedVolume,
                adDuration: duration
            })
        } else {
            this.gemiusPlayer.programEvent(programID, this.player.currentTime, "play", {
                autoPlay: this.player.autoplay,
                partID: this.partCount,
                // resolution: `AxB`; TODO
                volume: computedVolume,
                programDuration: this.player.duration
            })
        }
    }

    private onPause = (event: PauseEvent) => {
        Logger.log(event);
        this.reportBasicEvent(BasicEvent.PAUSE)
    }

    private onWaiting = (event: WaitingEvent) => {
        Logger.log(event);
        this.reportBasicEvent(BasicEvent.BUFFER)
    }

    private onAdBreakBegin = (event: AdBreakEvent<'adbreakbegin'>) => {
        Logger.log(event);
        const { programID } = this.programParameters
        const { adBreak } = event
        this.gemiusPlayer.programEvent(programID, adBreak.timeOffset, "break")
    }

    private reportBasicEvent = (event: BasicEvent) => {
        const { programID } = this.programParameters;
        const { currentTime } = this.player;
        if (this.currentAd) {
            const { id, adBreak } = this.currentAd;
            const { timeOffset } = adBreak
            this.gemiusPlayer.adEvent(programID, id ?? DEFAULT_AD_ID, timeOffset + currentTime, event); // TODO make SSAI ready
        } else {
            this.gemiusPlayer.programEvent(programID,currentTime, event)
        }
    }
}
