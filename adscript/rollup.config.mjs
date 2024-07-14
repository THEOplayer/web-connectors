import fs from "node:fs";
import {getSharedBuildConfiguration} from "../tools/build.mjs";


const {version} = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const fileName = "adscript-connector";
const globalName = "THEOplayerAdScriptConnector";

const banner = `
/**
 * THEOplayer AdScript Web Connector v${version}
 */`.trim();

export default getSharedBuildConfiguration({fileName, globalName, banner});
