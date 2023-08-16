import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import {version} from './package.json';

const banner = `
/**
 * cmcd-connector-web v${version}
 */`.trim();

const options = [{
    input: {
        THEOplayerCMCDConnector: "src/index.ts"
    },
    output: [
        {
            dir: "dist",
            entryFileNames: "[name].umd.js",
            name: "THEOplayerCMCDConnector",
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
        THEOplayerCMCDConnector: "src/index.ts"
    },
    output: [
        {
            dir: "dist",
            format: "esm",
            banner,
            footer: `export as namespace THEOplayerCMCDConnector;`
        }
    ],
    plugins: [
        dts({
            tsconfig: "tsconfig.json",
        })
    ]
}];
export default options;
