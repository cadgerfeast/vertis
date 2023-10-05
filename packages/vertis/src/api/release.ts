// Helpers
import type { Arguments } from 'yargs';
import c from 'chalk';
import { simpleGit } from 'simple-git';
import { getConfig } from '../helpers/config.js';
// Constants
const git = simpleGit();
// Types
interface Options {
  help?: boolean;
  from?: string;
  to?: string;
}

const help = [
  'Usage:',
  `  vertis release ${c.yellow('{args}')}`,
  '',
  `${c.yellow('Arguments')}:`,
  `  ${c.yellow('--help')}: Shows the help this ${c.cyan('command')}.`
].join('\n');

type ReleaseOptions = {}

export async function release ({}: ReleaseOptions) {
  let repositoryURL = (await git.getConfig('remote.origin.url')).value;
  if (!repositoryURL) {
    throw new Error('Could not find valid github repository.');
  }
  if (repositoryURL.startsWith('git@')) {
    repositoryURL = repositoryURL.replace(':', '/').replace('git@', 'https://').replace('.git', '')
  }
	const config = await getConfig();
  console.debug(c.gray(`Generating ${c.white(`"${config.releaseTarget}"`)} release.`));
}

export default async (argv: Arguments<Options>) => {
  if (argv.help) {
    console.info(help);
  } else {
    await release({});
  }
};
