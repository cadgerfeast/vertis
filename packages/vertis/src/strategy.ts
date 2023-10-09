// Helpers
import * as path from 'path';
import * as fs from 'fs';
import { Eta } from 'eta';
import dayjs from 'dayjs'
import c from 'chalk';
import { globSync } from 'glob';
import { mergeAll } from 'remeda';
import { Changelog, Commit, Package, PackageRelease, Release } from './index.js';
// Templates
import lernaConventionalDate from './templates/lerna-conventional/date.eta?raw';
import lernaConventionalPackage from './templates/lerna-conventional/package.eta?raw';
// Constants
const eta = new Eta({ autoTrim: false });

export type Strategy = {
	computeChangelogContent: (repositoryUrl: string, changelog: Changelog) => string;
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

function computeReleases (repositoryURL: string, changelog: Changelog, pkgs: Package[] , filterReleaseCommit: FilterReleaseCommit, computePackageReleases: ComputePackageReleases): Release[] {
	const releases: Release[] = [];
	let releaseChangelog: Changelog = [];
	let lastCommitTag: string|null = null;
	for (let i = changelog.length - 1; i >= 0; i--) {
		if (filterReleaseCommit(changelog[i])) {
			const packageReleases = computePackageReleases(changelog[i].tags, pkgs.map(({ name }) => name));
			if (packageReleases.length !== 0) {
				const releaseDate = dayjs(changelog[i].date).format('DD/MM/YYYY - HH:mm');
				let title = pkgs.length === 1 ? `${packageReleases[0].newVersion} (${releaseDate})` : releaseDate;
				if (lastCommitTag) {
					const compareLink = `${repositoryURL}/compare/${lastCommitTag}...${packageReleases[0].tag}`;
					title = pkgs.length === 1 ? `[${packageReleases[0].newVersion}](${compareLink}) (${releaseDate})` : `[${releaseDate}](${compareLink})`;
				}
				releases.push({
					title,
					packages: packageReleases,
					changelog: releaseChangelog.reverse()
				});
				releaseChangelog = [];
				lastCommitTag = packageReleases[0].tag;
			}
		} else {
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
type FilterReleaseCommit = (commit: Commit) => boolean;
type ComputePackageReleases = (tags: string[], pkgs: string[]) => PackageRelease[];

type LernaConventionalOptions = {
	filterPackage: FilterPackage;
	filterReleaseCommit: FilterReleaseCommit;
	computePackageReleases: ComputePackageReleases;
};

const lernaConventionalDefaultOptions: LernaConventionalOptions = {
	filterPackage: (pkg) => !pkg.private,
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

export function lernaConventional (userOptions?: LernaConventionalOptions): () => Promise<Strategy> {
	const { filterPackage, filterReleaseCommit, computePackageReleases } = mergeAll([lernaConventionalDefaultOptions, userOptions]);
	return async (): Promise<Strategy> => {
		const pkgPath = path.resolve(process.cwd(), 'package.json');
		const lernaConfigPath = path.resolve(process.cwd(), 'lerna.json');
		if (fs.existsSync(pkgPath) && fs.existsSync(lernaConfigPath)) {
			const lernaConfig = JSON.parse(fs.readFileSync(lernaConfigPath, 'utf8'));
			const pkgs = getWorkspacePackages(pkgPath).filter(filterPackage);
			let template: string;
			if (lernaConfig.version === 'independent') {
				console.debug(c.gray(`Generating changelog for ${c.white(`"${pkgs.map(({ name }) => name).join(', ')}"`)}`));
				template = lernaConventionalDate;
			} else if (pkgs.length > 0) {
				console.debug(c.gray(`Generating ${c.white(`"${pkgs[0].name}"`)} package changelog.`));
				template = lernaConventionalPackage;
			} else {
				throw new Error('Could not find any workspace');
			}
			return {
				computeChangelogContent (repositoryURL: string, changelog: Changelog) {
					const releases: Release[] = computeReleases(repositoryURL, computeConventionalChangelog(changelog), pkgs, filterReleaseCommit, computePackageReleases);
					return eta.renderString(template, {
						repositoryURL,
						releases,
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
