import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';

const { workspaces } = JSON.parse(readFileSync('package.json', 'utf8'));

export default defineConfig({
    test: {
        projects: workspaces
    }
});
