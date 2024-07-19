import { Event } from 'theoplayer';
import { EmbeddedContentMetadata, MainVideoContentMetadata, PlayerState } from '../adscript/AdScript';

const LOG_THEOPLAYER_EVENTS = true;
const LOG_SETPLAYERSTATE = true;
const LOG_SETMETADATA = true;
const LOG_ADSCRIPT_EVENTS = true;
const LOG_SETI12N = true;

export class Logger {
    static logEvent = (event: Event) => {
        if (LOG_THEOPLAYER_EVENTS) console.log(`[ADSCRIPT - THEOplayer EVENTS] ${event.type} event`);
    };

    static logPlayerState = (playerState: PlayerState) => {
        if (LOG_SETPLAYERSTATE) console.log(`[ADSCRIPT - setPlayerState]`, playerState);
    };

    static logSetContentMetadata = (metadata: MainVideoContentMetadata) => {
        if (LOG_SETMETADATA) console.log(`[ADSCRIPT - setContentMetadata]`, metadata);
    };

    static logAdScriptEvent = (
        name: string,
        metadata: MainVideoContentMetadata | EmbeddedContentMetadata | undefined
    ) => {
        if (LOG_ADSCRIPT_EVENTS) console.log(`[ADSCRIPT - EVENT] ${name}`, metadata);
    };

    static logsetI12n = (id: string, value: string) => {
        if (LOG_SETI12N) console.log(`[ADSCRIPT - SET I12N] ${id}: ${value}`);
    };
}
