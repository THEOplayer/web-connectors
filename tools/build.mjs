import { defineConfig } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export function getSharedBuildConfiguration({ fileName, globalName, banner, external, globals }) {
    return defineConfig([
        {
            input: {
                [fileName]: 'src/index.ts'
            },
            output: [
                {
                    dir: 'dist',
                    entryFileNames: '[name].umd.js',
                    name: globalName,
                    format: 'umd',
                    indent: false,
                    banner,
                    sourcemap: true,
                    globals: { theoplayer: 'THEOplayer', ...(globals ?? {}) }
                },
                {
                    dir: 'dist',
                    entryFileNames: '[name].esm.js',
                    format: 'esm',
                    indent: false,
                    sourcemap: true,
                    banner
                }
            ],
            external: ['theoplayer', ...(external ?? [])],
            plugins: [
                nodeResolve({
                    extensions: ['.ts', '.js']
                }),
                commonjs({
                    include: ['node_modules/**', '../node_modules/**']
                }),
                typescript({
                    tsconfig: 'tsconfig.json'
                })
            ]
        }
    ]);
}
