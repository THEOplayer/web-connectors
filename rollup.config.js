import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

export default [{
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
        connector_yospace_web: "src/index.ts"
    },
    output: [
        {
            dir: "dist",
            format: "esm"
        }
    ],
    plugins: [
        dts({
            tsconfig: "tsconfig.json",
        })
    ]
}];
