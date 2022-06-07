import {Source, Sources, TypedSource} from "theoplayer";

export function isObject(x: unknown): x is object {
    return typeof x === 'object' && x !== null;
}

export function isString(parameter: unknown): parameter is string {
    return typeof parameter === 'string';
}

export function implementsInterface(object: object, interfaceProperties: string[]): boolean {
    if (!isObject(object)) {
        return false;
    }
    return !interfaceProperties.some((property) => !(property in object));
}

export function isTypedSource(parameter: unknown): parameter is TypedSource {
    return Boolean(isObject(parameter) && isString((parameter as TypedSource).src));
}

export function isSource(source: unknown): source is Source {
    return isString(source) || isTypedSource(source);
}

export function toSources(sources: Sources): Source[] {
    if (isSource(sources)) { // string | TypedSource
        return [sources];
    }

    if (Array.isArray(sources) && isSource(sources[0])) { // (string | TypedSource)[]
        return sources;
    }

    throw new Error('not a good source');
}
