import type { Event } from 'theoplayer';
import { EmbeddedContentMetadata, MainVideoContentMetadata, PlayerState } from '../adscript/AdScript';

export class Logger {
    private readonly debug: boolean;

    constructor(debug: boolean = false) {
        this.debug = debug;
    }

    onEvent = (event: Event) => {
        if (this.debug) console.log(`[ADSCRIPT - THEOplayer EVENTS] ${event.type} event`);
    };

    onPlayerStateChange = (playerState: PlayerState) => {
        if (this.debug) console.log(`[ADSCRIPT - setPlayerState]`, playerState);
    };

    onSetMainVideoContentMetadata = (metadata: MainVideoContentMetadata) => {
        if (this.debug) console.log(`[ADSCRIPT - setContentMetadata]`, metadata);
    };

    onAdScriptEvent = (name: string, metadata: MainVideoContentMetadata | EmbeddedContentMetadata | undefined) => {
        if (this.debug) console.log(`[ADSCRIPT - EVENT] ${name}`, metadata);
    };

    onSetI12N = (id: string, value: string) => {
        if (this.debug) console.log(`[ADSCRIPT - SET I12N] ${id}: ${value}`);
    };
}
