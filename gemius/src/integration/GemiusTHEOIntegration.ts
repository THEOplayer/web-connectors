import {
    ChromelessPlayer,
    SourceChangeEvent,
} from 'theoplayer';
import { GemiusPlayer } from '../gemius/Gemius';
const LOG_THEOPLAYER_EVENTS = true;

export class GemiusTHEOIntegration {
    // References for constructor arguments
    private player: ChromelessPlayer;
    private gemiusPlayer: GemiusPlayer;

    constructor(player: ChromelessPlayer) {
        this.player = player;
        this.gemiusPlayer = new GemiusPlayer('THEOplayer','12345', {})
        this.addListeners();
    }

    public destroy() {
        this.removeListeners();
    }

    private addListeners(): void {
        this.player.addEventListener('sourcechange', this.onSourceChange);
    }

    private removeListeners(): void {
        this.player.removeEventListener('sourcechange', this.onSourceChange);
    }

    // EVENT HANDLERS
    private onSourceChange = (event: SourceChangeEvent) => {
        if (LOG_THEOPLAYER_EVENTS)
            console.log(`[COMSCORE - THEOplayer EVENTS] ${event.type} event`);
        this.gemiusPlayer.newProgram('modern family', {})
    };
}
