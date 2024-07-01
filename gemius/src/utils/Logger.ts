import { Event } from "theoplayer";

const LOG_THEOPLAYER_EVENTS = true;

export class Logger {
    static log = (event: Event) => {
        if (LOG_THEOPLAYER_EVENTS)
            console.log(`[GEMIUS - THEOplayer EVENTS] ${event.type} event`);
    }
}