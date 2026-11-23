export type Listener = (event: any) => void;

export class Dispatcher {
    private listeners: Record<string, Listener[]> = {};

    addEventListener(type: string, fn: Listener) {
        (this.listeners[type] ??= []).push(fn);
    }

    removeEventListener(type: string, fn: Listener) {
        this.listeners[type] = (this.listeners[type] ?? []).filter((l) => l !== fn);
    }

    dispatch(type: string, event?: unknown) {
        (this.listeners[type] ?? []).forEach((fn) => fn(event));
    }
}
