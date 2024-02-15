export interface Event<TType extends string = string> {
    /**
     * The type of the event.
     */
    type: TType;

    /**
     * The creation date of the event.
     */
    date: Date;
}

export class BaseEvent<TType extends string = string> implements Event<TType> {
    type: TType;

    date: Date;

    constructor(type: TType, date: Date = new Date()) {
        this.type = type;
        this.date = date;
    }
}
