import type { Event } from 'theoplayer';

export class Logger {
    private readonly debug: boolean;

    constructor(debug: boolean = false) {
        this.debug = debug;
    }

    log = (event: Event) => {
        if (this.debug) console.log(`[GEMIUS - THEOplayer EVENTS] ${event.type} event`);
    };
}
