import type {
    ChromelessPlayer,
    ServerSideAdIntegrationController,
    ServerSideAdIntegrationHandler,
    SourceDescription,
    YospaceTypedSource
} from 'theoplayer';
import { getFirstYospaceTypedSource, yoSpaceWebSdkIsAvailable } from '../utils/YospaceUtils';
import { PlayerEvent } from '../yospace/PlayerEvent';
import {
    PlaybackMode,
    ResultCode,
    SessionState,
    YospaceSession,
    YospaceSessionDVRLive,
    YospaceSessionManager
} from '../yospace/YospaceSessionManager';
import { YospaceWindow } from '../yospace/YospaceWindow';
import { YospaceAdHandler } from './YospaceAdHandler';
import { YospaceUiHandler } from './YospaceUIHandler';
import { YospaceID3MetadataHandler } from './YospaceID3MetadataHandler';
import { YospaceEMSGMetadataHandler } from './YospaceEMSGMetadataHandler';
import { SessionProperties } from '../yospace/SessionProperties';
import { AnalyticEventObserver } from '../yospace/AnalyticEventObserver';
import { DefaultEventDispatcher } from '../utils/DefaultEventDispatcher';
import { YospaceEventMap } from './YospaceConnector';
import { BaseEvent } from '../utils/event/Event';
import { nextEvent } from '../utils/EventUtils';

export class YospaceManager extends DefaultEventDispatcher<YospaceEventMap> {
    private readonly player: ChromelessPlayer;
    private readonly uiHandler: YospaceUiHandler;
    private yospaceSessionManager: YospaceSessionManager | undefined;
    private adHandler: YospaceAdHandler | undefined;
    private adIntegrationController: ServerSideAdIntegrationController | undefined;

    private id3MetadataHandler: YospaceID3MetadataHandler | undefined;

    private emsgMetadataHandler: YospaceEMSGMetadataHandler | undefined;

    private didFirstPlay: boolean = false;

    private isMuted: boolean = false;

    private isStalling: boolean = false;

    private needsTimedMetadata: boolean = false;

    private isSettingSource: boolean = false;

    private playbackPositionUpdater: any;

    constructor(player: ChromelessPlayer) {
        super();
        this.player = player;
        this.uiHandler = new YospaceUiHandler(this.player.element);

        this.player.ads?.registerServerSideIntegration?.('yospace', (controller) => {
            this.adIntegrationController = controller;
            return createIntegrationHandler(this);
        });
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
        const isYospaceSDKAvailable = yoSpaceWebSdkIsAvailable();
        const yospaceTypedSource = getFirstYospaceTypedSource(sourceDescription);
        if (isYospaceSDKAvailable && yospaceTypedSource?.src) {
            const yospaceSource = await this.createSession(yospaceTypedSource, sourceDescription, sessionProperties);
            try {
                this.isSettingSource = true;
                const nextSourceChange = nextEvent(this.player, 'sourcechange');
                this.player.source = yospaceSource;
                await nextSourceChange;
            } finally {
                this.isSettingSource = false;
            }
        } else if (yospaceTypedSource && !isYospaceSDKAvailable) {
            throw new Error('The Yospace Ad Management SDK has not been loaded.');
        } else {
            throw new Error('The given source is not a Yospace source.');
        }
    }

    async createYospaceSourceFromHandler(sourceDescription: SourceDescription): Promise<SourceDescription> {
        if (this.isSettingSource) {
            return sourceDescription;
        }
        const yospaceTypedSource = getFirstYospaceTypedSource(sourceDescription);
        if (!yospaceTypedSource) {
            return sourceDescription;
        }
        const isYospaceSDKAvailable = yoSpaceWebSdkIsAvailable();
        if (!isYospaceSDKAvailable) {
            throw new Error('The Yospace Ad Management SDK has not been loaded.');
        }
        return await this.createSession(yospaceTypedSource, sourceDescription);
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

    private async createSession(
        yospaceTypedSource: YospaceTypedSource,
        sourceDescription: SourceDescription,
        sessionProperties?: SessionProperties
    ): Promise<SourceDescription> {
        this.reset();

        const yospaceWindow = (window as unknown as YospaceWindow).YospaceAdManagement;
        const properties = sessionProperties ?? new yospaceWindow.SessionProperties();
        properties.setUserAgent(navigator.userAgent);
        let session: YospaceSession;
        switch (yospaceTypedSource?.ssai.streamType) {
            case 'vod':
                session = await yospaceWindow.SessionVOD.create(yospaceTypedSource.src!, properties);
                break;
            case 'nonlinear':
            case 'livepause':
                session = await yospaceWindow.SessionDVRLive.create(yospaceTypedSource.src!, properties);
                break;
            default:
                this.needsTimedMetadata = true;
                session = await yospaceWindow.SessionLive.create(yospaceTypedSource.src!, properties);
        }
        switch (session.getSessionState()) {
            case SessionState.INITIALISED:
            case SessionState.NO_ANALYTICS: {
                this.initialiseSession(session);
                this.dispatchEvent(new BaseEvent('sessionavailable'));
                this.isMuted = this.player.muted;
                return {
                    ...sourceDescription,
                    sources: [
                        {
                            ...yospaceTypedSource,
                            src: session.getPlaybackUrl()
                        }
                    ]
                };
            }
            case SessionState.FAILED:
            case SessionState.SHUT_DOWN:
            default:
                this.handleSessionInitialisationErrors(session.getResultCode());
        }
    }

    private initialiseSession(sessionManager: YospaceSessionManager) {
        this.yospaceSessionManager = sessionManager;

        this.adHandler = new YospaceAdHandler(this, this.uiHandler, this.player, this.adIntegrationController);
        this.addEventListenersToNotifyYospace();
        if (!this.needsTimedMetadata) {
            this.playbackPositionUpdater = setInterval(this.updateYospaceWithPlaybackPosition, 250);
        } else {
            this.id3MetadataHandler = new YospaceID3MetadataHandler(this.player.textTracks, sessionManager);
            this.emsgMetadataHandler = new YospaceEMSGMetadataHandler(this.player.textTracks, sessionManager);
        }
    }

    private updateYospaceWithPlaybackPosition = () => {
        const session = this.sessionManager;
        if (!session) {
            return;
        }

        let currentTime = this.player.currentTime * 1000;

        // For Yospace DVRLive sessions we need to offset the playback position from the stream start time
        if (isSessionDVRLive(session)) {
            const ast = session.getManifestData<Date>('availabilityStartTime')?.getTime();
            const sst = session.getStreamStart();
            // availabilityStartTime is initially undefined, and streamStart is initially -1
            const delta = (sst < 0 ? 0 : sst) - (ast || 0);
            currentTime = Math.round(currentTime - delta);
        }

        session.onPlayheadUpdate(currentTime);
    };

    private handleSessionInitialisationErrors(result: ResultCode): never {
        let errorMessage: string;
        if (result === ResultCode.MALFORMED_URL) {
            errorMessage = 'Yospace: The stream URL is not correctly formatted';
        } else if (result === ResultCode.CONNECTION_ERROR) {
            errorMessage = 'Yospace: Connection error';
        } else if (result === ResultCode.CONNECTION_TIMEOUT) {
            errorMessage = 'Yospace: Connection timeout';
        } else {
            errorMessage = 'Yospace: Session could not be initialised';
        }

        this.reset();
        throw new Error(errorMessage);
    }

    private addEventListenersToNotifyYospace = () => {
        this.player.addEventListener('volumechange', this.handleVolumeChange);
        this.player.addEventListener('play', this.handlePlay);
        this.player.addEventListener('ended', this.handleEnded);
        this.player.addEventListener('pause', this.handlePause);
        this.player.addEventListener('seeked', this.handleSeeked);
        this.player.addEventListener('waiting', this.handleWaiting);
        this.player.addEventListener('playing', this.handlePlaying);
    };

    private removeEventListenersToNotifyYospace = () => {
        this.player.removeEventListener('volumechange', this.handleVolumeChange);
        this.player.removeEventListener('play', this.handlePlay);
        this.player.removeEventListener('ended', this.handleEnded);
        this.player.removeEventListener('pause', this.handlePause);
        this.player.removeEventListener('seeked', this.handleSeeked);
        this.player.removeEventListener('waiting', this.handleWaiting);
        this.player.removeEventListener('playing', this.handlePlaying);
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

    reset() {
        this.removeEventListenersToNotifyYospace();
        this.sessionManager?.shutdown();
        clearInterval(this.playbackPositionUpdater);

        this.uiHandler.reset();
        this.adHandler?.reset();
        this.adHandler = undefined;
        this.id3MetadataHandler?.reset();
        this.id3MetadataHandler = undefined;
        this.emsgMetadataHandler?.reset();
        this.emsgMetadataHandler = undefined;
        this.yospaceSessionManager = undefined;
        this.needsTimedMetadata = false;
        this.isMuted = false;
        this.isStalling = false;
        this.didFirstPlay = false;
    }

    resetFromHandler() {
        if (this.isSettingSource) {
            return;
        }
        this.reset();
    }
}

function isSessionDVRLive(session: YospaceSession): session is YospaceSessionDVRLive {
    return session.getPlaybackMode() === PlaybackMode.DVRLIVE;
}

function createIntegrationHandler(yospaceManager: YospaceManager): ServerSideAdIntegrationHandler {
    return {
        setSource(sourceDescription: SourceDescription): Promise<SourceDescription> {
            return yospaceManager.createYospaceSourceFromHandler(sourceDescription);
        },
        resetSource(): void {
            yospaceManager.resetFromHandler();
        },
        destroy(): void {
            yospaceManager.reset();
        }
    };
}
