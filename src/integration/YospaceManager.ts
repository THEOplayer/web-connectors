import { ChromelessPlayer, SourceDescription, YospaceTypedSource } from "theoplayer";
import { isYospaceTypedSource, yoSpaceWebSdkIsAvailable } from "../utils/YospaceUtils";
import { PromiseController } from "../utils/PromiseController";
import { PlayerEvent } from "../yospace/PlayerEvent";
import { toSources } from "../utils/SourceUtils";
import { ResultCode, SessionState, YospaceSessionManager } from "../yospace/YospaceSessionManager";
import { YospaceWindow } from "../yospace/YospaceWindow";
import { YospaceAdHandler } from "./YospaceAdHandler";
import { YospaceUiHandler } from "./YospaceUIHandler";
import { YospaceID3MetadataHandler } from "./YospaceID3MetadataHandler";
import { YospaceEMSGMetadataHandler } from "./YospaceEMSGMetadataHandler";
import { SessionProperties } from "../yospace/SessionProperties";
import { AnalyticEventObserver } from "../yospace/AnalyticEventObserver";
import { DefaultEventDispatcher } from "../utils/DefaultEventDispatcher";
import { YospaceEventMap } from "./YospaceConnector";
import { BaseEvent } from "../utils/event/Event";

export class YospaceManager extends DefaultEventDispatcher<YospaceEventMap> {
    private readonly player: ChromelessPlayer;

    private yospaceSessionManager: YospaceSessionManager | undefined;

    private adHandler: YospaceAdHandler | undefined;

    private id3MetadataHandler: YospaceID3MetadataHandler | undefined;

    private emsgMetadataHandler: YospaceEMSGMetadataHandler | undefined;

    private sourceDescription: SourceDescription | undefined;

    private yospaceTypedSource: YospaceTypedSource | undefined;

    private yospaceSourceDescriptionDefined: PromiseController<void>;

    private didFirstPlay: boolean = false;

    private isMuted: boolean = false;

    private isStalling: boolean = false;

    private needsTimedMetadata: boolean = false;

    private playbackPositionUpdater: any;

    constructor(player: ChromelessPlayer) {
        super();
        this.player = player;
        this.yospaceSourceDescriptionDefined = new PromiseController<void>();
    }

    get sessionManager(): YospaceSessionManager | undefined {
        return this.yospaceSessionManager;
    }

    get startedPlaying(): boolean {
        return this.didFirstPlay;
    }

    async createYospaceSource(
        sourceDescription: SourceDescription,
        sessionProperties?: SessionProperties
    ): Promise<void> {
        this.yospaceSourceDescriptionDefined.abort();
        this.yospaceSourceDescriptionDefined = new PromiseController<void>();
        this.createSession(sourceDescription, sessionProperties);
        await this.yospaceSourceDescriptionDefined.promise;
    }

    registerAnalyticEventObserver(analyticEventObserver: AnalyticEventObserver) {
        if (!this.adHandler) {
            throw new Error("The observer can't be registered because the session is not yet initialised");
        }
        this.adHandler.registerAnalyticEventObserver(analyticEventObserver);
    }

    unregisterAnalyticEventObserver(analyticEventObserver: AnalyticEventObserver) {
        this.adHandler?.unregisterAnalyticEventObserver(analyticEventObserver);
    }

    private createSession(sourceDescription: SourceDescription, sessionProperties?: SessionProperties): void {
        this.reset();

        const { sources } = sourceDescription;
        const isYospaceSDKAvailable = yoSpaceWebSdkIsAvailable();
        this.sourceDescription = sourceDescription;
        this.yospaceTypedSource = sources ? toSources(sources).find(isYospaceTypedSource) : undefined;
        if (isYospaceSDKAvailable && this.yospaceTypedSource?.src) {
            const yospaceWindow = (window as unknown as YospaceWindow).YospaceAdManagement;
            const properties = sessionProperties ?? new yospaceWindow.SessionProperties();
            properties.setUserAgent(navigator.userAgent);
            switch (this.yospaceTypedSource?.ssai.streamType) {
                case "vod":
                    yospaceWindow.SessionVOD.create(this.yospaceTypedSource.src, properties, this.onInitComplete);
                    break;
                case "nonlinear":
                case "livepause":
                    yospaceWindow.SessionDVRLive.create(this.yospaceTypedSource.src, properties, this.onInitComplete);
                    break;
                default:
                    this.needsTimedMetadata = true;
                    yospaceWindow.SessionLive.create(this.yospaceTypedSource.src, properties, this.onInitComplete);
            }
            this.isMuted = this.player.muted;
        } else if (this.yospaceTypedSource && !isYospaceSDKAvailable) {
            throw new Error("The Yospace Ad Management SDK has not been loaded.");
        } else {
            throw new Error("The given source is not a Yospace source.");
        }
    }

    private initialiseSession(sessionManager: YospaceSessionManager) {
        this.yospaceSessionManager = sessionManager;

        const yospaceUiHandler = new YospaceUiHandler(this.player.element, sessionManager);
        this.adHandler = new YospaceAdHandler(this, yospaceUiHandler, this.player);
        this.addEventListenersToNotifyYospace();
        if (!this.needsTimedMetadata) {
            this.playbackPositionUpdater = setInterval(this.updateYospaceWithPlaybackPosition, 250);
        } else {
            this.id3MetadataHandler = new YospaceID3MetadataHandler(this.player.textTracks, sessionManager);
            this.emsgMetadataHandler = new YospaceEMSGMetadataHandler(this.player.textTracks, sessionManager);
        }
    }

    private updateYospaceWithPlaybackPosition = () => {
        const currentTime = this.player.currentTime * 1000;
        this.sessionManager?.onPlayheadUpdate(currentTime);
    };

    private onInitComplete = (e: any) => {
        const session: YospaceSessionManager = e.getPayload();
        switch (session.getSessionState()) {
            case SessionState.INITIALISED:
            case SessionState.NO_ANALYTICS:
                this.handleSessionInitialised(session);
                break;
            case SessionState.FAILED:
            case SessionState.SHUT_DOWN :
            default:
                this.handleSessionInitialisationErrors(session.getResultCode());
        }
    };

    private handleSessionInitialised(session: YospaceSessionManager): void {
        this.initialiseSession(session);
        this.player.source = {
            ...this.sourceDescription,
            sources: [
                {
                    ...this.yospaceTypedSource,
                    src: session.getPlaybackUrl()
                }
            ]
        };
        this.dispatchEvent(new BaseEvent("sessionavailable"));
        this.yospaceSourceDescriptionDefined.resolve();
    }

    private handleSessionInitialisationErrors(result: ResultCode) {
        let errorMessage: string;
        if (result === ResultCode.MALFORMED_URL) {
            errorMessage = "Yospace: The stream URL is not correctly formatted";
        } else if (result === ResultCode.CONNECTION_ERROR) {
            errorMessage = "Yospace: Connection error";
        } else if (result === ResultCode.CONNECTION_TIMEOUT) {
            errorMessage = "Yospace: Connection timeout";
        } else {
            errorMessage = "Yospace: Session could not be initialised";
        }

        this.reset();
        throw new Error(errorMessage);
    }

    private addEventListenersToNotifyYospace = () => {
        this.player.addEventListener("volumechange", this.handleVolumeChange);
        this.player.addEventListener("play", this.handlePlay);
        this.player.addEventListener("ended", this.handleEnded);
        this.player.addEventListener("pause", this.handlePause);
        this.player.addEventListener("seeked", this.handleSeeked);
        this.player.addEventListener("waiting", this.handleWaiting);
        this.player.addEventListener("playing", this.handlePlaying);
    };

    private removeEventListenersToNotifyYospace = () => {
        this.player.removeEventListener("volumechange", this.handleVolumeChange);
        this.player.removeEventListener("play", this.handlePlay);
        this.player.removeEventListener("ended", this.handleEnded);
        this.player.removeEventListener("pause", this.handlePause);
        this.player.removeEventListener("seeked", this.handleSeeked);
        this.player.removeEventListener("waiting", this.handleWaiting);
        this.player.removeEventListener("playing", this.handlePlaying);
    };

    private handleVolumeChange = () => {
        const newMuted = this.player.muted;
        if (newMuted !== this.isMuted) {
            this.isMuted = newMuted;
            this.sessionManager?.onVolumeChange(newMuted);
        }
    };

    private handlePlay = () => {
        if (!this.didFirstPlay) {
            this.didFirstPlay = true;
            this.sessionManager?.onPlayerEvent(PlayerEvent.START, this.player.currentTime);
            return;
        }
        this.sessionManager?.onPlayerEvent(PlayerEvent.RESUME, this.player.currentTime);
    };

    private handleEnded = () => {
        this.sessionManager?.onPlayerEvent(PlayerEvent.STOP, this.player.currentTime);
    };

    private handlePause = () => {
        this.sessionManager?.onPlayerEvent(PlayerEvent.PAUSE, this.player.currentTime);
    };

    private handleSeeked = () => {
        this.sessionManager?.onPlayerEvent(PlayerEvent.SEEK, this.player.currentTime);
    };

    private handleWaiting = () => {
        this.isStalling = true;
        this.sessionManager?.onPlayerEvent(PlayerEvent.STALL, this.player.currentTime);
    };

    private handlePlaying = () => {
        if (this.isStalling) {
            this.isStalling = false;
            this.sessionManager?.onPlayerEvent(PlayerEvent.CONTINUE, this.player.currentTime);
        }
    };

    private reset() {
        this.removeEventListenersToNotifyYospace();
        this.sessionManager?.shutdown();
        clearInterval(this.playbackPositionUpdater);

        this.adHandler?.reset();
        this.adHandler = undefined;
        this.id3MetadataHandler?.reset();
        this.id3MetadataHandler = undefined;
        this.emsgMetadataHandler?.reset();
        this.emsgMetadataHandler = undefined;
        this.yospaceTypedSource = undefined;
        this.yospaceSessionManager = undefined;
        this.sourceDescription = undefined;
        this.needsTimedMetadata = false;
        this.isMuted = false;
        this.isStalling = false;
        this.didFirstPlay = false;
    }
}
