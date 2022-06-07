# yospace-connector-web

A connector implementing Yospace for web.

## Getting started

-   `npm install`

## Testing and code quality

A test stack is set up and can be used by adding tests to the `test/unit/` folder. Run these tests with

```
npm run test
```

This project is set up with [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/). You can run these checks with

```
npm run lint
npm run prettier
```

but it's a good idea to set up the necessary IDE integration for both.

CI will automatically verify whether the code passes all necessary quality gates.

## Manual testing

-   Include a THEOplayer build in the root folder under `local/`. It should contain:
    -   The THEOplayer javascript libraries e.g. `THEOplayer.js` and/or `THEOplayer.chomeless.js`. Also include any necessary worker files.
    -   The `ui.css` file.
-   Run `npm run serve` to start `http-server` in the root folder by running.
-   Run `npm run build` to create the integrations library `connector_yospace_web-latest.js` under `dist/bundle/`.
-   Navigate to `localhost:8080/test/pages/main.html` or add an alternative test page.

## Release process

This release process is based on the assumption that the `master` branch is the default branch, and working branches are branched off from it and PR's back to it.
It is mostly automated by creating tags with a specific format on the `master` branch.

### Prerequisites

-   All the necesary code for the release is present on the `master` branch.
-   The `PACKAGE_README.md` file contains the necessary information for an external developer to use the connector. This will be published along with the code.
-   Bitbucket Pipelines has been correctly enabled for the repository.
    -   Github Actions integration is on the roadmap.
-   The necessary variables have been configured for Bitbucket Pipelines:
    -   `NPMRC_CONTENT`: the full content of an `.npmrc` file to be used during publishing. Linebreaks in the file can be substituted by `\n` in the variable.
    -   `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: The AWS credentials necessary to publish a bundle to CDN.
        -   This might be replaced with a Github release artifact later.

### Creating a release

These steps assume that the new release version is `X.Y.Z`.

-   Create a new version bump commit on the `master` branch to bump the project version to the release version.
-   Create a tag on the version bump commit of the format `vX.Y.Z`.
-   Verify that the release pipeline correctly runs for your new tag.
-   Verify that the correct artifacts have been published once the pipeline has completed.
