// Helpers
import * as path from 'path';
import * as fs from 'fs';
import { Eta } from 'eta';
import dayjs from 'dayjs'
import { globSync } from 'glob';
import { mergeAll } from 'remeda';
import { Changelog, Commit, Package, PackageRelease, Release } from './index.js';
// Templates
import lernaConventionalChangelogDate from './templates/lerna-conventional/changelog/date.eta?raw';
import lernaConventionalChangelogPackage from './templates/lerna-conventional/changelog/package.eta?raw';
import lernaConventionalReleaseDate from './templates/lerna-conventional/release/date.eta?raw';
import lernaConventionalReleasePackage from './templates/lerna-conventional/release/package.eta?raw';
// Constants
const eta = new Eta({ autoTrim: false });

export type GitTarget = 'github'|'bitbucket';

export type Strategy = {
	gitTarget: GitTarget;
	computeChangelogContent: (repositoryURL: string, changelog: Changelog) => string;
	computeReleaseContent: (repositoryURL: string, release: Release) => string;
	computeReleases: (gitTarget: GitTarget, repositoryURL: string, changelog: Changelog) => Release[];
};

function getWorkspacePackages (pkgPath: string): Package[] {
	const workspacePackages: Package[] = [];
	const { workspaces } = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
	for (const workspace of workspaces) {
		const pkgPaths = globSync(`${workspace}/package.json`);
		for (const pkgPath of pkgPaths) {
			workspacePackages.push(JSON.parse(fs.readFileSync(pkgPath, 'utf8')));
		}
	}
	return workspacePackages;
}

export const CONVENTIONAL_TYPES = [
	'feat',
	'fix',
	'revert',
	'docs',
	'test',
	'perf',
	'refactor',
	'style',
	'ci',
	'build',
	'chore',
	'unknown'
] as const;
const CONVENTIONAL_EMOJIS: Record<ConventionalType, string> = {
	build: '📦',
	chore: '🏗',
	ci: '🛠️',
	docs: '📚',
	feat: '✨',
	fix: '🐛',
	perf: '⚡️',
	refactor: '♻️',
	revert: '⛑️',
	style: '🎨',
	test: '🚦',
	unknown: '🔖'
};
const CONVENTIONAL_LABELS: Record<ConventionalType, string> = {
	build: 'Builds',
	chore: 'Chores',
	ci: 'Continuous Integration',
	docs: 'Documentation',
	feat: 'New Features',
	fix: 'Bug Fixes',
	perf: 'Performance Tests',
	refactor: 'Refactoring',
	revert: 'Reverts',
	style: 'Style',
	test: 'Tests',
	unknown: 'Misc'
};
export type ConventionalType = typeof CONVENTIONAL_TYPES[number];
export type ConventionalCommit = Commit & {
	type: ConventionalType;
	name: string;
};
export type ConventionalChangelog = ConventionalCommit[];

function getCommitData (message: string) {
	const splits = new RegExp(`^(?<type>${CONVENTIONAL_TYPES.join('|')})(?<scope>\\(\\w+\\)?((?=:\\s)|(?=!:\\s)))?(?<breaking>!)?(?<subject>:\\s.*)?|^(?<merge>Merge \\w+)`).exec(message);
	if (splits) {
		return {
			type: splits[1],
			message: splits[5].replace(':', '').trim()
		};
	}
	return {
		type: 'unknown',
		message
	};
}

function computeConventionalChangelog (changelog: Changelog): ConventionalChangelog {
	const newChangelog: ConventionalChangelog = [];
	for (const commit of changelog) {
		const data = getCommitData(commit.message);
		const type = ((CONVENTIONAL_TYPES as readonly string[]).includes(data.type) ? data.type : 'unknown') as ConventionalType;
		newChangelog.push({
			...commit,
			name: data.message,
			type
		});
	}
	return newChangelog;
}

function buildCompareLink (gitTarget: GitTarget, repositoryURL: string, fromTag: string, toTag: string) {
	switch (gitTarget) {
		case 'bitbucket': {
			return `${repositoryURL}/branches/compare/${encodeURIComponent(`${toTag}\r${fromTag}`)}`;
		}
		default: {
			return `${repositoryURL}/compare/${fromTag}...${toTag}`;
		}
	}
}

function getCommitURL (gitTarget: GitTarget, repositoryURL: string) {
	switch (gitTarget) {
		case 'bitbucket': {
			return `${repositoryURL}/commits`;
		}
		default: {
			return `${repositoryURL}/commit`;
		}
	}
}

function computeReleases (gitTarget: GitTarget, repositoryURL: string, changelog: Changelog, pkgs: Package[], filterCommit: FilterCommit, filterReleaseCommit: FilterReleaseCommit, computePackageReleases: ComputePackageReleases): Release[] {
	const releases: Release[] = [];
	let releaseChangelog: Changelog = [];
	let lastCommitTag: string|null = null;
	for (let i = changelog.length - 1; i >= 0; i--) {
		if (filterReleaseCommit(changelog[i])) {
			const packageReleases = computePackageReleases(changelog[i].tags, pkgs.map(({ name }) => name));
			if (packageReleases.length !== 0) {
				const releaseDate = dayjs(changelog[i].date).format('DD/MM/YYYY - HH:mm');
				const title = pkgs.length === 1 ? `${packageReleases[0].newVersion} (${releaseDate})` : releaseDate;
				let markdownTitle = title;
				if (lastCommitTag) {
					const compareLink = buildCompareLink(gitTarget, repositoryURL, lastCommitTag, packageReleases[0].tag);
					markdownTitle = pkgs.length === 1 ? `[${packageReleases[0].newVersion}](${compareLink}) (${releaseDate})` : `[${releaseDate}](${compareLink})`;
				}
				releases.push({
					title,
					markdownTitle,
					packages: packageReleases,
					changelog: releaseChangelog.reverse()
				});
				releaseChangelog = [];
				lastCommitTag = packageReleases[0].tag;
			}
		}
		if (filterCommit(changelog[i])) {
			releaseChangelog.push(changelog[i]);
		}
	}
	const packageReleases: Record<string, string> = {};
	for (const release of releases) {
		for (const pkg of release.packages) {
			if (packageReleases[pkg.name]) {
				pkg.oldVersion = packageReleases[pkg.name];
			}
			packageReleases[pkg.name] = pkg.newVersion;
		}
	}
	return releases.reverse();
}

type FilterPackage = (pkg: Package) => boolean;
type FilterCommit = (commit: Commit) => boolean;
type FilterReleaseCommit = (commit: Commit) => boolean;
type ComputePackageReleases = (tags: string[], pkgs: string[]) => PackageRelease[];

type LernaConventionalOptions = {
	gitTarget?: GitTarget;
	filterPackage?: FilterPackage;
	filterCommit?: FilterCommit;
	filterReleaseCommit?: FilterReleaseCommit;
	computePackageReleases?: ComputePackageReleases;
};
type LernaConventionalConfig = Required<Pick<LernaConventionalOptions, keyof LernaConventionalOptions>> & LernaConventionalOptions;

const lernaConventionalDefaultOptions: LernaConventionalConfig = {
	gitTarget: 'github',
	filterPackage: (pkg) => !pkg.private,
	filterCommit: (commit) => !['chore: release', 'chore: changelog'].includes(commit.message),
	filterReleaseCommit: (commit) => commit.message === 'chore: release',
	computePackageReleases: (tags, pkgs) => {
		const packageReleases: PackageRelease[] = [];
		for (const tag of tags) {
			for (const pkg of pkgs) {
				if (tag.startsWith(`${pkg}@`)) {
					packageReleases.push({
						name: pkg,
						tag,
						newVersion: tag.replace(`${pkg}@`, '')
					});
				}
			}
		}
		return packageReleases;
	}
};

function computeLernaConventionalConfig (options?: LernaConventionalOptions): LernaConventionalConfig {
  return mergeAll([lernaConventionalDefaultOptions, options]);
}

export function lernaConventional (userOptions?: LernaConventionalOptions): () => Promise<Strategy> {
	const { gitTarget, filterPackage, filterCommit, filterReleaseCommit, computePackageReleases } = computeLernaConventionalConfig(userOptions);
	return async (): Promise<Strategy> => {
		const pkgPath = path.resolve(process.cwd(), 'package.json');
		const lernaConfigPath = path.resolve(process.cwd(), 'lerna.json');
		if (fs.existsSync(pkgPath) && fs.existsSync(lernaConfigPath)) {
			const lernaConfig = JSON.parse(fs.readFileSync(lernaConfigPath, 'utf8'));
			const pkgs = getWorkspacePackages(pkgPath).filter(filterPackage);
			let changelogTemplate: string;
			let releaseTemplate: string;
			if (lernaConfig.version === 'independent') {
				changelogTemplate = lernaConventionalChangelogDate;
				releaseTemplate = lernaConventionalReleaseDate;
			} else if (pkgs.length > 0) {
				changelogTemplate = lernaConventionalChangelogPackage;
				releaseTemplate = lernaConventionalReleasePackage;
			} else {
				throw new Error('Could not find any workspace');
			}
			return {
				gitTarget,
				computeChangelogContent (repositoryURL: string, changelog: Changelog) {
					const releases: Release[] = computeReleases(gitTarget, repositoryURL, computeConventionalChangelog(changelog), pkgs, filterCommit, filterReleaseCommit, computePackageReleases);
					return eta.renderString(changelogTemplate, {
						repositoryURL,
						commitURL: getCommitURL(gitTarget, repositoryURL),
						releases,
						CONVENTIONAL_TYPES,
						CONVENTIONAL_EMOJIS,
						CONVENTIONAL_LABELS
					});
				},
				computeReleases (gitTarget: GitTarget, repositoryURL: string, changelog: Changelog) {
					return computeReleases(gitTarget, repositoryURL, computeConventionalChangelog(changelog), pkgs, filterCommit, filterReleaseCommit, computePackageReleases);
				},
				computeReleaseContent (repositoryURL: string, release: Release) {
					return eta.renderString(releaseTemplate, {
						repositoryURL,
						commitURL: getCommitURL(gitTarget, repositoryURL),
						release,
						CONVENTIONAL_TYPES,
						CONVENTIONAL_EMOJIS,
						CONVENTIONAL_LABELS
					});
				}
			};
		}
		throw new Error('Could not find any package.json');
	};
}
