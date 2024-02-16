/**
 * @type {import('@changesets/types').GetReleaseLine}
 */
const getReleaseLine = async (changeset, type, changelogOpts) => {
    const [firstLine, ...otherLines] = changeset.summary
        .trim()
        .split('\n')
        .map((l) => l.trimEnd());

    let result = `- ${firstLine}`;
    if (otherLines.length > 0) {
        result += `\n${otherLines.map((l) => `  ${l}`).join('\n')}`;
    }

    return result;
}

/**
 * @type {import('@changesets/types').GetDependencyReleaseLine}
 */
const getDependencyReleaseLine = async (changesets, dependenciesUpdated, changelogOpts) => {
    return '';
}

/**
 * @type {import('@changesets/types').ChangelogFunctions}
 */
const changelogFunctions = {
    getReleaseLine,
    getDependencyReleaseLine,
}

module.exports = changelogFunctions;
