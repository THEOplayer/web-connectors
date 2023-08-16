import {CMCDObjectType, CMCDStreamingFormat, CMCDStreamType} from '../../src';
import {transformToQueryParameters} from '../../src/CMCDPayloadUtils';

describe('transformToQueryParameters', () => {
    it('returns an empty string if there are no parameters', () => {
        expect(transformToQueryParameters({})).toBe('');
    });

    it('serialises booleans which are true without equals sign', () => {
        expect(transformToQueryParameters({'bs': true})).toBe('bs');
    });

    it('serialises booleans which are false with equals `false`', () => {
        expect(transformToQueryParameters({'bs': false})).toBe('bs=false');
    });

    it('serialises multiple key/value pairs with a comma in between', () => {
        expect(transformToQueryParameters({'bs': true, 'su': true})).toBe('bs,su');
    });

    it('serialises strings with double quotes', () => {
        expect(transformToQueryParameters({'sid': 'string'})).toBe('sid="string"');
    });

    it('serialises strings with escaped double quotes', () => {
        expect(transformToQueryParameters({'sid': '"'})).toBe('sid="%5C%22"');
    });

    it('serialises strings with escaped backslashes', () => {
        expect(transformToQueryParameters({'sid': '\\'})).toBe('sid="%5C%5C"');
    });

    it('serialises object type with its token', () => {
        expect(transformToQueryParameters({'ot': CMCDObjectType.AUDIO})).toBe('ot="a"');
    });

    it('serialises streaming format with its token', () => {
        expect(transformToQueryParameters({'sf': CMCDStreamingFormat.HLS})).toBe('sf="h"');
    });

    it('serialises stream type with its token', () => {
        expect(transformToQueryParameters({'st': CMCDStreamType.DYNAMIC})).toBe('st="l"');
    });

    it('serialises parameters in a concatenated string with all parameters sorted in ascending alphabetic order', () => {
        expect(transformToQueryParameters({'tb': 1, 'br': 2, 'rtp': 3})).toBe('br=2,rtp=3,tb=1');
    });

    it('serialises parameters in a concatenated string as example 1', () => {
        expect(transformToQueryParameters({'sid': '6e2fb550-c457-11e9-bb97-0800200c9a66'})).toBe('sid="6e2fb550-c457-11e9-bb97-0800200c9a66"');
    });

    it('serialises parameters in a concatenated string as example 2', () => {
        expect(transformToQueryParameters({
            'br': 3200,
            'bs': true,
            'd': 4004,
            'mtp': 25400,
            'ot': CMCDObjectType.VIDEO,
            'rtp': 15000,
            'sid': '6e2fb550-c457-11e9-bb97-0800200c9a66',
            'tb': 6000
        })).toBe('br=3200,bs,d=4004,mtp=25400,ot="v",rtp=15000,sid="6e2fb550-c457-11e9-bb97-0800200c9a66",tb=6000');
    });

    it('serialises parameters in a concatenated string as example 3', () => {
        expect(transformToQueryParameters({
            'bs': true,
            'rtp': 15000,
            'sid': '6e2fb550-c457-11e9-bb97-0800200c9a66'
        })).toBe('bs,rtp=15000,sid="6e2fb550-c457-11e9-bb97-0800200c9a66"');
    });

    it('serialises parameters in a concatenated string as example 4', () => {
        expect(transformToQueryParameters({'bs': true, 'su': true})).toBe('bs,su');
    });

    it('serialises parameters in a concatenated string as example 5 (but with d being at the end due to sort order)', () => {
        expect(transformToQueryParameters({
            'd': 4004,
            'com.example-myNumericKey': 500,
            'com.example-myStringKey': 'myStringValue'
        })).toBe('com.example-myNumericKey=500,com.example-myStringKey="myStringValue",d=4004');
    });

    it('serialises parameters in a concatenated string as example 6', () => {
        expect(transformToQueryParameters({
            'nor': '../300kbps/segment35.m4v',
            'sid': '6e2fb550-c457-11e9-bb97-0800200c9a66'
        })).toBe('nor="..%2F300kbps%2Fsegment35.m4v",sid="6e2fb550-c457-11e9-bb97-0800200c9a66"');
    });

    it('serialises parameters in a concatenated string as example 7', () => {
        expect(transformToQueryParameters({
            'nrr': '12323-48763',
            'sid': '6e2fb550-c457-11e9-bb97-0800200c9a66'
        })).toBe('nrr="12323-48763",sid="6e2fb550-c457-11e9-bb97-0800200c9a66"');
    });

    it('serialises parameters in a concatenated string as example 8', () => {
        expect(transformToQueryParameters({
            'nor': '../300kbps/track.m4v',
            'nrr': '12323-48763',
            'sid': '6e2fb550-c457-11e9-bb97-0800200c9a66'
        })).toBe('nor="..%2F300kbps%2Ftrack.m4v",nrr="12323-48763",sid="6e2fb550-c457-11e9-bb97-0800200c9a66"');
    });

    it('serialises parameters in a concatenated string as example 9', () => {
        expect(transformToQueryParameters({
            'bl': 21300,
            'br': 3200,
            'bs': true,
            'cid': 'faec5fc2-ac30-11ea-bb37-0242ac130002',
            'd': 4004,
            'dl': 18500,
            'mtp': 48100,
            'nor': '../300kbps/track.m4v',
            'nrr': '12323-48763',
            'ot': CMCDObjectType.VIDEO,
            'pr': 1.08,
            'rtp': 12000,
            'sf': CMCDStreamingFormat.MPEG_DASH,
            'sid': '6e2fb550-c457-11e9-bb97-0800200c9a66',
            'st': CMCDStreamType.STATIC,
            'su': true,
            'tb': 6000
        })).toBe('bl=21300,br=3200,bs,cid="faec5fc2-ac30-11ea-bb37-0242ac130002",d=4004,dl=18500,mtp=48100,nor="..%2F300kbps%2Ftrack.m4v",nrr="12323-48763",ot="v",pr=1.08,rtp=12000,sf="d",sid="6e2fb550-c457-11e9-bb97-0800200c9a66",st="v",su,tb=6000');
    });
});