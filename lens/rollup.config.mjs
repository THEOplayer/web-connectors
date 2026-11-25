import fs from 'node:fs';
import { getSharedBuildConfiguration } from '../tools/build.mjs';

const { version } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const fileName = 'lens-connector';
const globalName = 'THEOplayerLensConnector';
const banner = `
/**
 * THEOplayer Lens Connector v${version}
 */`.trim();

export default getSharedBuildConfiguration({
    fileName,
    globalName,
    banner,
    external: ['@dolby-optiview/lens-sdk'],
    globals: { '@dolby-optiview/lens-sdk': 'LensSDK' }
});
