// Helpers
import * as path from 'path';
import * as fs from 'fs';
import { mergeAll } from 'remeda';
import { Strategy, lernaConventional } from '../strategy.js';

export type ReleaseTarget = 'github';

type VertisConfig = {
	strategy: () => Promise<Strategy>;
	releaseTarget: ReleaseTarget;
};

type UserConfig = Partial<VertisConfig>;

export function defineConfig (config: UserConfig): UserConfig {
	return config;
}

export function mergeConfig (...configs: VertisConfig[]): VertisConfig {
	return mergeAll(configs) as VertisConfig;
}

const defaultConfig: VertisConfig = {
	strategy: lernaConventional(),
	releaseTarget: 'github'
};

export async function getConfig (dir: string = process.cwd()): Promise<VertisConfig> {
	const configFile = path.resolve(dir, 'vertis.config.js');
	let config: VertisConfig = defaultConfig;
	if (fs.existsSync(configFile)) {
		const userConfig = await import(`file://${configFile}`);
		config = mergeConfig(config, userConfig.default);
	}
	return config;
}
