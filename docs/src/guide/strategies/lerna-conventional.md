# Lerna Conventional

This strategy is the default use if no `Vertis` configuration as been found.

It supports the [conventional commit types](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional#type-enum) and produces a cool Changelog.

If your monorepo project is using `independent` versioning, the changelog will also have a `Releases` section for each or you package, and each release will be grouped by date.

Here's an example of [unique CHANGELOG](https://github.com/cadgerfeast/vertis/blob/master/CHANGELOG.md) and [independent CHANGELOG](https://github.com/cadgerfeast/madoc/blob/master/CHANGELOG.md).
