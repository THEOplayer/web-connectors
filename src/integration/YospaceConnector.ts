import { ChromelessPlayer, SourceDescription } from "theoplayer";
import { YospaceManager } from "./YospaceManager";
import { SessionProperties } from "../yospace/SessionProperties";
import { AnalyticEventObserver } from "../yospace/AnalyticEventObserver";
import { EventDispatcher, EventListener, StringKeyOf } from "../utils/event/EventDispatcher";
import { BaseEvent } from "../utils/event/Event";

export interface YospaceEventMap {
    /**
     * Fired when a new Yospace session starts.
     */
    sessionavailable: BaseEvent<'sessionavailable'>;
}

export class YospaceConnector implements EventDispatcher<YospaceEventMap> {
    private player: ChromelessPlayer;

    private yospaceManager: YospaceManager;

    constructor(player: ChromelessPlayer) {
        this.player = player;
        this.yospaceManager = new YospaceManager(player);
    }

    /**
     * Creates the Yospace session and sets the Yospace source from the session to the player.
     *
     * @param sourceDescription the source that will be used to create the Yospace session.
     * @param sessionProperties the properties that will be used set to customize the Yospace session.
     */
    async setupYospaceSession(
        sourceDescription: SourceDescription,
        sessionProperties?: SessionProperties
    ): Promise<void> {
        await this.yospaceManager.createYospaceSource(sourceDescription, sessionProperties);
    }

    /**
     * Register an analytics event observer to the Yospace SDK.
     *
     * @param analyticEventObserver the observer that will be registered to the Yospace SDK.
     * @throws `Error` if the session is not yet initialised.
     */
    registerAnalyticEventObserver(analyticEventObserver: AnalyticEventObserver) {
        this.yospaceManager.registerAnalyticEventObserver(analyticEventObserver);
    }

    /**
     * Unregister an analytics event observer from the Yospace SDK.
     *
     * @param analyticEventObserver the observer that will be unregistered from the Yospace SDK.
     */
    unregisterAnalyticEventObserver(analyticEventObserver: AnalyticEventObserver) {
        this.yospaceManager.unregisterAnalyticEventObserver(analyticEventObserver);
    }

    addEventListener<TType extends StringKeyOf<YospaceEventMap>>(
        type: TType[] | TType,
        listener: EventListener<YospaceEventMap[TType]>
    ): void {
        this.yospaceManager.addEventListener(type, listener);
    }

    removeEventListener<TType extends StringKeyOf<YospaceEventMap>>(
        type: TType[] | TType,
        listener: EventListener<YospaceEventMap[TType]>
    ): void {
        this.yospaceManager.removeEventListener(type, listener);
    }
}
