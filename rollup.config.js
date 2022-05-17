import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

const { version } = require("./package.json");

export default {
    input: {
        connector_yospace_web: "src/index.ts"
    },
    output: [
        {
            dir: "dist",
            entryFileNames: "[name].umd.js",
            name: "connector_yospace_web",
            format: "umd",
            globals: { THEOplayer: "THEOplayer" }
        },
        {
            dir: "dist",
            entryFileNames: "[name].esm.js",
            format: "esm"
        },
        {
            dir: "dist/bundle",
            entryFileNames: `[name]-${version}.js`,
            name: "connector_yospace_web",
            format: "iife",
            exports: "auto",
            globals: { THEOplayer: "THEOplayer" },
            plugins: [terser()]
        },
        {
            dir: "dist/bundle",
            entryFileNames: "[name]-latest.js",
            name: "connector_yospace_web",
            format: "iife",
            exports: "auto",
            globals: { THEOplayer: "THEOplayer" },
            plugins: [terser()]
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
};
