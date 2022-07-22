import {Event} from "./event/Event";
import {EventDispatcher, EventMap, StringKeyOf} from "./event/EventDispatcher";

export type EventListener<TEvent extends Event = Event> = (event: TEvent) => void;
export type EventListenerList<TEvent extends Event> = Array<EventListener<TEvent>> | EventListener<TEvent> | undefined;
type EventListenerListMap<TMap extends EventMap<StringKeyOf<TMap>>> = {
    [TType in StringKeyOf<TMap>]: EventListenerList<TMap[TType]>;
};

export class DefaultEventDispatcher<TMap extends EventMap<StringKeyOf<TMap>>> implements EventDispatcher<TMap> {
    private eventListeners: EventListenerListMap<TMap> = createDictionaryObject();

    private allEventListeners: EventListenerList<TMap[StringKeyOf<TMap>]> = undefined;

    protected readonly scope: any;

    constructor(scope?: any) {
        this.scope = scope || this;
    }

    addEventListener<K extends StringKeyOf<TMap>>(types: K | readonly K[], listener: EventListener<TMap[K]>): void {
        if (typeof listener !== 'function') {
            return;
        }
        if (typeof types === 'string') {
            this.addSingleEventListener(types, listener);
        } else {
            types.forEach(type => {
                this.addSingleEventListener(type, listener);
            });
        }
    }

    private addSingleEventListener<K extends StringKeyOf<TMap>>(type: K, listener: EventListener<TMap[K]>): void {
        const eventListeners: EventListenerList<TMap[K]> = this.eventListeners[type];
        if (!eventListeners) {
            // Optimize case of single listener, don't allocate extra array
            this.eventListeners[type] = listener;
        } else if (typeof eventListeners === 'function') {
            // Migrate from single listener to array of listeners
            this.eventListeners[type] = [eventListeners, listener];
        } else {
            // Append to existing array of listeners
            eventListeners.push(listener);
        }
    }

    clearEventListeners(): void {
        this.eventListeners = createDictionaryObject();
        this.allEventListeners = undefined;
    }

    dispatchEvent<K extends StringKeyOf<TMap>>(event: TMap[K]): void {
        const listeners = copyEventListenerList(this.eventListeners[event.type as K]);
        const allListeners = copyEventListenerList(this.allEventListeners);
        callEventListenerList(this.scope, event, listeners);
        callEventListenerList(this.scope, event, allListeners);
    }

    forwardEvent = <K extends StringKeyOf<TMap>>(event: TMap[K]): void => {
        this.dispatchEvent(event);
    };

    removeEventListener<K extends StringKeyOf<TMap>>(types: K | readonly K[], listener: EventListener<TMap[K]>): void {
        if (typeof listener !== 'function') {
            return;
        }
        if (typeof types === 'string') {
            this.removeSingleEventListener(types, listener);
        } else {
            types.forEach(type => {
                this.removeSingleEventListener(type, listener);
            });
        }
    }

    private removeSingleEventListener<K extends StringKeyOf<TMap>>(type: K, listener: EventListener<TMap[K]>): void {
        const eventListeners: EventListenerList<TMap[K]> = this.eventListeners[type];
        if (eventListeners) {
            if (typeof eventListeners === 'function') {
                // Remove single listener
                if (eventListeners === listener) {
                    this.eventListeners[type] = undefined;
                }
            } else {
                // Remove from array of listeners
                arrayRemove(eventListeners, listener);
            }
        }
    }

    nextEvent<K extends StringKeyOf<TMap>>(types: K | readonly K[], abortSignal?: AbortSignal): Promise<TMap[K]> {
        return new Promise<TMap[K]>((resolve) => {
            const listener: EventListener<TMap[K]> = (event) => {
                cleanup();
                resolve(event);
            };
            const cleanup = () => {
                this.removeEventListener(types, listener);
            };
            this.addEventListener(types, listener);
        });
    }
}

export function createDictionaryObject<K extends string, V>(): Record<K, V> {
    const map = Object.create(null);

    // Using 'delete' on an object causes V8 to put the object in dictionary mode.
    // This disables creation of hidden classes, which are expensive when an object is
    // constantly changing shape.
    map._ = undefined;
    delete map._;

    return map;
}

export function copyEventListenerList<TEvent extends Event>(list: EventListenerList<TEvent>): EventListenerList<TEvent> {
    if (!list || typeof list === 'function') {
        // No listeners, or single listener
        // No need to copy
        return list;
    }
    // Array of listeners
    // Create a copy to handle adding/removing listeners while dispatching an event
    return list.slice();

}

export function callEventListenerList<TEvent extends Event>(scope: object, event: TEvent, list: EventListenerList<TEvent>): void {
    if (!list) {
        // No listeners
    } else if (typeof list === 'function') {
        // Single listener
        list.call(scope, event);
    } else {
        // Array of listeners
        list.forEach(listener => {
            listener.call(scope, event);
        });
    }
}

function arrayRemove<T>(array: T[], element: T): boolean {
    const index = array.indexOf(element);
    if (index === -1) {
        return false;
    }
    array.splice(index, 1);
    return true;
}
