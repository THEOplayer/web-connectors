// @ts-nocheck

/**
 * This function loads the AdScript SDK.
 * This comes directly from the AdScript documentation: https://adscript.admosphere.cz/en_adScript_browser.html
 */
export function loadAdScriptSDK(implementationId: string) {
    !(function (j, h, m, t, c, z) {
        c = c || 'JHMT';
        j[c] = j[c] || [];
        j['JHMTApiProtocol'] = 'https:';
        z = z || 3;

        var i = (z % 3) + 1,
            a = arguments.callee,
            b = h.createElement('script');

        (b.async = !0),
            b.readyState
                ? (b.onreadystatechange = function () {
                      ('loaded' !== b.readyState && 'complete' !== b.readyState) ||
                          ((b.onreadystataechange = null), j.JHMTApi.init(c, m, t));
                  })
                : (b.onload = function () {
                      j.JHMTApi.init(c, m, t);
                  }),
            (b.src = j['JHMTApiProtocol'] + '//cm' + i + '.jhmt.cz/api.js'),
            (b.onerror = function () {
                b.parentNode.removeChild(b);
                z++;
                i = (z % 3) + 1;
                a(j, h, m, t, c, i);
            }),
            h.getElementsByTagName('head')[0].appendChild(b);

        try {
            var it = setInterval(function () {
                if (typeof j.JHMTApi !== 'undefined') {
                    clearInterval(it);
                } else {
                    b.parentNode.removeChild(b);
                    z++;
                    i = (z % 3) + 1;
                    a(j, h, m, t, c, i);
                }
            }, 1e3);
        } catch (e) {
            console.log('JHMT: ' + e);
        }
    })(window, document, implementationId);
}
