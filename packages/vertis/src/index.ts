export const version = __VERSION__;

export type Commit = {
	hash: string;
	message: string;
	description: string;
	date: Date;
	tags: string[];
	author: {
		name: string;
		email: string;
	};
};

export type Changelog = Commit[];

export type Release = {
	title: string;
	markdownTitle: string;
	packages: PackageRelease[];
	changelog: Changelog;
};

export type Package = {
	name: string;
	private?: boolean;
};

export type PackageRelease = {
	name: string;
	tag: string;
	newVersion: string;
	oldVersion?: string;
};

export { defineConfig, type VertisConfig } from './helpers/config.js';

export { generate, type GenerateOptions } from './api/generate.js';
export { release, type ReleaseOptions } from './api/release.js';
