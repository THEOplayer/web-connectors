import fs from "node:fs";
import {getSharedBuildConfiguration} from "../tools/build.mjs";

const {version} = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const fileName = 'conviva-connector';
const globalName = 'THEOplayerConvivaConnector';
const banner = `
/**
 * THEOplayer Conviva Connector v${version}
 */`.trim();


export default getSharedBuildConfiguration({ fileName, globalName, banner });
