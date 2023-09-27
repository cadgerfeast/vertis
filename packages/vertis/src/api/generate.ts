// Helpers
import type { Arguments } from 'yargs';
import c from 'chalk';
// Types
interface Options {
  help?: boolean;
  h?: boolean;
}

const help = [
  'Usage:',
  `  vertis init ${c.green('(path)')} ${c.yellow('{args}')}`,
  '',
  `${c.yellow('Arguments')}:`,
  `  ${c.yellow('--help/-h')}: Shows the help this ${c.cyan('command')}.`
].join('\n');

export async function generate (dir: string = process.cwd()) {
	console.info('TODO: generate');
  console.info(dir);
}

export default async (argv: Arguments<Options>) => {
  if (argv.h || argv.help) {
    console.info(help);
  } else {
    await generate();
  }
};
