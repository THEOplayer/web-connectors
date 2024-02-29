import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import {version} from './package.json';

const fileName = "cmcd-connector";
const globalName = "THEOplayerCMCDConnector"
const banner = `
/**
 * THEOplayer CMCD Connector v${version}
 */`.trim();

/**
 * @type {import("rollup").RollupOptions[]}
 */
const options = [{
    input: {
        [fileName]: "src/index.ts"
    },
    output: [
        {
            dir: "dist",
            entryFileNames: "[name].umd.js",
            name: globalName,
            format: "umd",
            banner,
            intend: false,
            globals: {THEOplayer: "THEOplayer"}
        },
        {
            dir: "dist",
            entryFileNames: "[name].esm.js",
            format: "esm",
            banner,
            intend: false
        }
    ],
    plugins: [
        nodeResolve({
            extensions: [".ts", ".js"]
        }),
        commonjs({
            include: "node_modules/**"
        }),
        typescript({
            tsconfig: "tsconfig.json",
            module: "es2015",
            include: ["src/**/*"]
        })
    ]
}, {
    input: {
        [fileName] : "src/index.ts"
    },
    output: [
        {
            dir: "dist",
            format: "esm",
            banner,
            footer: `export as namespace ${globalName};`
        }
    ],
    plugins: [
        dts({
            tsconfig: "tsconfig.json",
        })
    ]
}];
export default options;
