import { builtinEnvironments, type Environment } from 'vitest/environments';
import type { EnvironmentOptions, JSDOMOptions } from 'vitest/node';

const jsdomEnvironment = builtinEnvironments.jsdom;
const name = 'jsdom-silent';

declare module 'vitest/node' {
    export interface EnvironmentOptions {
        ['jsdom-silent']?: JSDOMSilentOptions;
    }
}

export interface JSDOMSilentOptions extends JSDOMOptions {
    /**
     * If set, do not send JSDOM errors to the console.
     */
    omitJSDOMErrors?: boolean;
}

/**
 * Same as the default JSDOM environment for Vitest,
 * but with the ability to omit JSDOM errors.
 *
 * @see https://github.com/jsdom/jsdom/blob/16.1.0/README.md#virtual-consoles
 */
const jsdomSilentEnv: Environment = {
    ...jsdomEnvironment,
    name,
    async setupVM({ [name]: jsdom = {}, ...options }: EnvironmentOptions = {}) {
        const { console = false, omitJSDOMErrors = false } = jsdom;
        const { VirtualConsole } = await import('jsdom');
        const virtualConsole = new VirtualConsole();
        if (console && globalThis.console) {
            virtualConsole.sendTo(globalThis.console, { omitJSDOMErrors });
        }
        return jsdomEnvironment.setupVM({
            ...options,
            jsdom: {
                ...jsdom,
                console: false,
                virtualConsole
            }
        });
    },
    async setup(global, { [name]: jsdom = {}, ...options }: EnvironmentOptions = {}) {
        const { console = false, omitJSDOMErrors = false } = jsdom;
        const { VirtualConsole } = await import('jsdom');
        const virtualConsole = new VirtualConsole();
        if (console && global.console) {
            virtualConsole.sendTo(global.console, { omitJSDOMErrors });
        }
        return jsdomEnvironment.setup(global, {
            ...options,
            jsdom: {
                ...jsdom,
                console: false,
                virtualConsole
            }
        });
    }
};

export default jsdomSilentEnv;
