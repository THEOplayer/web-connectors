import {
    ChromelessPlayer,
    SourceChangeEvent,
} from 'theoplayer';
import { GemiusPlayer } from '../gemius/Gemius';
import { GemiusConfiguration } from './GemiusConfiguration';

const LOG_THEOPLAYER_EVENTS = true;
const THEOPLAYER_ID = "THEOplayer"

export class GemiusTHEOIntegration {
    // References for constructor arguments
    private player: ChromelessPlayer;
    private debug: boolean;
    private gemiusPlayer: GemiusPlayer;

    constructor(player: ChromelessPlayer, configuration: GemiusConfiguration) {
        this.player = player;
        this.debug = configuration.debug ?? false; 
        this.gemiusPlayer = new GemiusPlayer(THEOPLAYER_ID ,configuration.gemiusID, {});
        this.addListeners();
    }

    public destroy() {
        this.removeListeners();
        this.gemiusPlayer.dispose();
    }

    private addListeners(): void {
        this.player.addEventListener('sourcechange', this.onSourceChange);
    }

    private removeListeners(): void {
        this.player.removeEventListener('sourcechange', this.onSourceChange);
    }

    // EVENT HANDLERS
    private onSourceChange = (event: SourceChangeEvent) => {
        if (this.debug && LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        this.gemiusPlayer.newProgram('modern family', {})
    };
}
