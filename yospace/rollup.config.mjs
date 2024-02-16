import fs from "node:fs";
import {getSharedBuildConfiguration} from "../tools/build.mjs";

const {version} = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const fileName = "yospace-connector";
const globalName = "THEOplayerYospaceConnector";
const banner = `
/**
 * THEOplayer Yospace Connector v${version}
 */`.trim();

export default getSharedBuildConfiguration(fileName, globalName, banner);