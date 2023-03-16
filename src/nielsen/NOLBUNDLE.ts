/* eslint-disable */
import { NielsenOptions } from "./Types";

export function loadNielsenLibrary(appId: string, instanceName: string, options?: NielsenOptions) {
    // https://engineeringportal.nielsen.com/docs/DTVR_Browser_SDK
    // Add Static Queue Snippet to initialize a Nielsen SDK Instance.
    // @ts-ignore
    !(function (t: Window, n: any) {
        t[n] = t[n] || {
            nlsQ: function (e: any, o: any, c?: any, r?: any, s?: any, i?: any) {
                // @ts-ignore
                return (
                    (s = t.document),
                        (r = s.createElement('script')),
                        (r.async = 1),
                        (r.src =
                            ('http:' === t.location.protocol ? 'http:' : 'https:') +
                            '//cdn-gl.imrworldwide.com/conf/' +
                            e +
                            '.js#name=' +
                            o +
                            '&ns=' +
                            n),
                        (i = s.getElementsByTagName('script')[0]),
                        i.parentNode.insertBefore(r, i),
                        (t[n][o] = t[n][o] || {
                            g: c || {},
                            ggPM: function (e: any, c: any, r?: any, s?: any, i?: any) {
                                // @ts-ignore
                                (t[n][o].q = t[n][o].q || []).push([e, c, r, s, i]);
                            },
                        }),
                        t[n][o]
                );
            },
        };
    })(window, 'NOLBUNDLE');

    if (options) {
        return (window as any).NOLBUNDLE.nlsQ(
            appId,
            instanceName,
            options
        );
    } else {
        return (window as any).NOLBUNDLE.nlsQ(appId, instanceName);
    }
}
