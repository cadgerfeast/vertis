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

export { defineConfig } from './helpers/config.js';

export { generate } from './api/generate.js';
