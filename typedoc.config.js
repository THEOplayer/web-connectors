const { workspaces } = require('./package.json');

/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
    extends: ['./typedoc.base.json'],
    name: 'THEOplayer Web SDK Connectors',
    entryPoints: workspaces,
    entryPointStrategy: 'packages',
    includeVersion: false,
    out: 'api',
    sitemapBaseUrl: 'https://theoplayer.github.io/web-connectors/api/'
};
