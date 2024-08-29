# Lerna Conventional

This strategy is the default use if no `Vertis` configuration as been found.

It supports the [conventional commit types](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional#type-enum) and produces a cool Changelog.

If your monorepo project is using `independent` versioning, the changelog will also have a `Releases` section for each or you package, and each release will be grouped by date.

Here's an example of [unique CHANGELOG](https://github.com/cadgerfeast/vertis/blob/master/CHANGELOG.md) and [independent CHANGELOG](https://github.com/cadgerfeast/slithe/blob/main/CHANGELOG.md).

## Configuration

``` json
{
	...
	"version": "0.1.2", // Either fixed or independent
	"command": {
		...
		"version": {
			"conventionalCommits": true,
			"message": "chore: release", // Feel free to change this, but "filterReleaseCommit" should be updated accordingly
			"tagVersionPrefix": "vertis@", // Even if only one package is published, you should enforce package prefix, if multiple are, you can leave it undefined
			"changelog": false, // Do not generate changelog, Vertis will ;)
			"push": false // Do not push git tags, you'll do after changelog is generated
		}
		...
	}
}
```

``` javascript
import { defineConfig } from 'vertis';
import { lernaConventional } from 'vertis/strategy';

export default defineConfig({
	strategy: lernaConventional({
		gitTarget: 'github', // By default, vertis generates changelogs and releases for github repositories
		filterPackage: (pkg) => !pkg.private, // Private package are ignored by default
		filterCommit: (commit) => !['chore: release', 'chore: changelog'].includes(commit.message), // This is default behavior, please update to filter undesired commits
		filterReleaseCommit: (commit) => commit.message === 'chore: release', // This is default behavior, please update to get all release commits
		computePackageReleases: (tags, pkgs) => ([...]) // By default, packages are found if tag follow this format: <package-name>@<package-version>, but you can customize
	})
});
```