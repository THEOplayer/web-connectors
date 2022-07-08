export class PromiseController<T> {
    readonly promise: Promise<T>;

    private resolvePromise: ((result: T | PromiseLike<T>) => void) | undefined;

    private rejectPromise: ((reason: any) => void) | undefined;

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    resolve(result: T | PromiseLike<T>): void {
        if (this.resolvePromise) {
            this.resolvePromise(result);
            this.destroy();
        }
    }

    reject(reason: any): void {
        if (this.rejectPromise) {
            this.rejectPromise(reason);
            this.destroy();
        }
    }

    abort(): void {
        this.promise.catch(() => {});
        this.reject(new Error());
    }

    private destroy() {
        this.resolvePromise = undefined;
        this.rejectPromise = undefined;
    }
}
