const { workspaces } = require('./package.json');

/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
    extends: ['./typedoc.base.json'],
    name: 'THEOplayer Web SDK Connectors',
    entryPoints: workspaces.slice().sort(),
    entryPointStrategy: 'packages',
    includeVersion: false,
    out: 'api',
    hostedBaseUrl: 'https://theoplayer.github.io/web-connectors/api/'
};
