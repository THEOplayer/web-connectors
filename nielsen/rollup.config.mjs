import {getSharedBuildConfiguration} from "../tools/build.mjs";
import fs from "node:fs";

const {version} = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const fileName = "nielsen-connector";
const globalName = "THEOplayerNielsenConnector";

const banner = `
/**
 * Nielsen Web Connector v${version}
 */`.trim();

export default getSharedBuildConfiguration(fileName, globalName, banner);
