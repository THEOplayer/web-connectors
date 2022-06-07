import {YospaceServerSideAdInsertionConfiguration, YospaceSSAIIntegrationID, YospaceTypedSource} from "theoplayer";
import {implementsInterface, isTypedSource} from "./SourceUtils";
import {YospaceWindow} from "../yospace/YospaceWindow";

export const YOSPACE_SSAI_INTEGRATION_ID: YospaceSSAIIntegrationID = 'yospace'

export function isYoSpaceServerSideAdInsertionConfiguration(ssai: any): ssai is YospaceServerSideAdInsertionConfiguration {
    return implementsInterface(ssai, ['integration']) && ssai.integration === YOSPACE_SSAI_INTEGRATION_ID;
}

export function isYospaceTypedSource(typedSource: any): typedSource is YospaceTypedSource {
    return isTypedSource(typedSource)
        && implementsInterface(typedSource, ['ssai'])
        && isYoSpaceServerSideAdInsertionConfiguration(typedSource.ssai);
}

export function yoSpaceWebSdkIsAvailable(): boolean {
    return !!(window as unknown as YospaceWindow).YospaceAdManagement;
}