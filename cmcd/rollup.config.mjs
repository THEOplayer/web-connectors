import fs from "node:fs";
import {getSharedBuildConfiguration} from "../tools/build.mjs";

const {version} = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const fileName = "cmcd-connector";
const globalName = "THEOplayerCMCDConnector"
const banner = `
/**
 * THEOplayer CMCD Connector v${version}
 */`.trim();

export default getSharedBuildConfiguration(fileName, globalName, banner);
