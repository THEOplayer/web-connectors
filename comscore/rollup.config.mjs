import fs from "node:fs";
import {getSharedBuildConfiguration} from "../tools/build.mjs";


const {version} = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const fileName = "comscore-connector";
const globalName = "THEOplayerComscoreConnector";

const banner = `
/**
 * Comscore Web Connector v${version}
 */`.trim();

export default getSharedBuildConfiguration(fileName, globalName, banner);
