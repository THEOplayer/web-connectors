import type { Event, EventDispatcher, EventListener, EventMap } from 'theoplayer';

export function nextEvent(target: EventDispatcher<EventMap<any>>, type: string): Promise<Event> {
    return new Promise<Event>((resolve) => {
        const listener: EventListener<Event> = (event) => {
            target.removeEventListener(type, listener);
            resolve(event);
        };
        target.addEventListener(type, listener);
    });
}
