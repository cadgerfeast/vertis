// Helpers
import { mergeAll } from 'remeda';
import { loadConfig,  } from 'c12';
import { Strategy, lernaConventional } from '../strategy.js';

type VertisConfig = {
	strategy: () => Promise<Strategy>;
};

type UserConfig = Partial<VertisConfig>;

export function defineConfig (config: UserConfig): UserConfig {
	return config;
}

export function mergeConfig (...configs: VertisConfig[]): VertisConfig {
	return mergeAll(configs) as VertisConfig;
}

const defaultConfig: VertisConfig = {
	strategy: lernaConventional()
};

export async function getConfig (dir: string = process.cwd()): Promise<VertisConfig> {
  const res = await loadConfig<VertisConfig>({ name: 'vertis', cwd: dir });
	return mergeConfig(defaultConfig, res.config);
}
