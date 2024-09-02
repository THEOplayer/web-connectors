/* eslint-disable */
import { NielsenCountry, NielsenOptions } from './Types';

export function loadNielsenLibrary(
    appId: string,
    instanceName: string,
    options?: NielsenOptions,
    country?: NielsenCountry
) {
    if (country == NielsenCountry.CZ) {
        // https://engineeringportal.nielsen.com/wiki/DCR_Czech_Video_Browser_SDK
        // Step 1: Configure SDK
        // @ts-ignore
        !(function (e: any, n: any) {
            function t(e: any) {
                return 'object' == typeof e ? JSON.parse(JSON.stringify(e)) : e;
            }
            e[n] = e[n] || {
                nlsQ: function (o: any, r: any, c: any) {
                    //@ts-ignore
                    var s = e.document,
                        a = s.createElement('script');
                    (a.async = 1),
                        (a.src =
                            ('http:' === e.location.protocol ? 'http:' : 'https:') +
                            '//cdn-gl.imrworldwide.com/conf/' +
                            o +
                            '.js#name=' +
                            r +
                            '&ns=' +
                            n);
                    var i = s.getElementsByTagName('script')[0];
                    return (
                        i.parentNode.insertBefore(a, i),
                        (e[n][r] = e[n][r] || {
                            g: c || {},
                            ggPM: function (o: any, c: any, s: any, a: any, i: any) {
                                // @ts-ignore
                                e[n][r].q = e[n][r].q || [];
                                try {
                                    var l = t([o, c, s, a, i]);
                                    e[n][r].q.push(l);
                                } catch (e) {
                                    console &&
                                        console.log &&
                                        console.log('Error: Cannot register event in Nielsen SDK queue.');
                                }
                            },
                            trackEvent: function (o: any) {
                                // @ts-ignore
                                e[n][r].te = e[n][r].te || [];
                                try {
                                    var c = t(o);
                                    e[n][r].te.push(c);
                                } catch (e) {
                                    console &&
                                        console.log &&
                                        console.log('Error: Cannot register event in Nielsen SDK queue.');
                                }
                            }
                        }),
                        e[n][r]
                    );
                }
            };
        })(window, 'NOLBUNDLE');
    } else {
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
                            }
                        }),
                        t[n][o]
                    );
                }
            };
        })(window, 'NOLBUNDLE');
    }

    if (options) {
        return (window as any).NOLBUNDLE.nlsQ(appId, instanceName, options);
    } else {
        return (window as any).NOLBUNDLE.nlsQ(appId, instanceName);
    }
}
