import fs from "node:fs";
import {getSharedBuildConfiguration} from "../tools/build.mjs";

const {version} = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const fileName = "drm-connector";
const globalName = "THEOplayerDrmConnector";
const banner = `
/**
 * THEOplayer DRM Connectors v${version}
 */`.trim();

export default getSharedBuildConfiguration({ fileName, globalName, banner });
