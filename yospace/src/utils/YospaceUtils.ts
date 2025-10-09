import type { SourceDescription, TypedSource } from 'theoplayer';
import type {
    YospaceServerSideAdInsertionConfiguration,
    YospaceSSAIIntegrationID
} from '../integration/YospaceConfiguration';
import { implementsInterface, isTypedSource, toSources } from './SourceUtils';
import type { YospaceWindow } from '../yospace/YospaceWindow';

export const YOSPACE_SSAI_INTEGRATION_ID: YospaceSSAIIntegrationID = 'yospace';

export interface YospaceTypedSource extends TypedSource {
    ssai: YospaceServerSideAdInsertionConfiguration;
}

export function isYoSpaceServerSideAdInsertionConfiguration(
    ssai: any
): ssai is YospaceServerSideAdInsertionConfiguration {
    return implementsInterface(ssai, ['integration']) && ssai.integration === YOSPACE_SSAI_INTEGRATION_ID;
}

export function isYospaceTypedSource(typedSource: any): typedSource is YospaceTypedSource {
    return (
        isTypedSource(typedSource) &&
        implementsInterface(typedSource, ['ssai']) &&
        isYoSpaceServerSideAdInsertionConfiguration(typedSource.ssai)
    );
}

export function getFirstYospaceTypedSource(sourceDescription: SourceDescription): YospaceTypedSource | undefined {
    const { sources } = sourceDescription;
    return sources ? toSources(sources).find(isYospaceTypedSource) : undefined;
}

export function yoSpaceWebSdkIsAvailable(): boolean {
    return !!(window as unknown as YospaceWindow).YospaceAdManagement;
}
