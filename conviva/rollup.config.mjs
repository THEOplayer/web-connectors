import fs from "node:fs";
import {getSharedBuildConfiguration} from "../tools/build.mjs";

const {version} = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const fileName = 'conviva-connector';
const globalName = 'THEOplayerConvivaConnector';
const banner = `
/**
 * THEOplayer Conviva Connector v${version}
 */`.trim();
const external = ['@convivainc/conviva-js-coresdk', '@theoplayer/yospace-connector-web'];
const globals = {
    '@convivainc/conviva-js-coresdk': 'Conviva',
    '@theoplayer/yospace-connector-web': 'THEOplayerYospaceConnector'
};

export default getSharedBuildConfiguration({ fileName, globalName, banner, external, globals });
