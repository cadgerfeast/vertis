// Helpers
import { mergeAll } from 'remeda';
import { loadConfig,  } from 'c12';
import { Strategy, lernaConventional } from '../strategy.js';

type AutoLink = {
  keyPrefix: string;
  url: string;
};

export type DefineStrategy = (config: VertisConfig) => Promise<Strategy>;
type VertisOptions = {
  autoLinks?: AutoLink[];
	strategy?: DefineStrategy;
};
export type VertisConfig = Required<Pick<VertisOptions, keyof VertisOptions>> & VertisOptions;

export function defineConfig (options: VertisOptions): VertisOptions {
	return options;
}

export function mergeConfig (...configs: VertisConfig[]): VertisConfig {
	return mergeAll(configs) as VertisConfig;
}

const defaultConfig: VertisConfig = {
  autoLinks: [],
	strategy: lernaConventional()
};

export async function getConfig (dir: string = process.cwd()): Promise<VertisConfig> {
  const res = await loadConfig<VertisConfig>({ name: 'vertis', cwd: dir });
	return mergeConfig(defaultConfig, res.config);
}
