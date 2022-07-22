import {Event} from "./Event";

/**
 * The keys of T which are strings.
 */
export type StringKeyOf<T> = Extract<keyof T, string>;
/**
 * The function to be executed when an event occurred.
 *
 * @public
 */
export type EventListener<TEvent extends Event> = (event: TEvent) => void;
export type EventMap<TType extends string> = { [type in TType]: Event };

export interface EventDispatcher<TEventMap extends EventMap<StringKeyOf<TEventMap>>> {
    /**
     * Add the given listener for the given event type(s).
     *
     * @param type - The type of the event.
     * @param listener - The callback which is executed when the event occurs.
     */
    addEventListener<TType extends StringKeyOf<TEventMap>>(type: TType | readonly TType[], listener: EventListener<TEventMap[TType]>): void;

    /**
     * Remove the given listener for the given event type(s).
     *
     * @param type - The type of the event.
     * @param listener - The callback which will be removed.
     */
    removeEventListener<TType extends StringKeyOf<TEventMap>>(type: TType | readonly TType[], listener: EventListener<TEventMap[TType]>): void;
}