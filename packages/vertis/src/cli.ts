// Helpers
import yargs, { Arguments } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { logger } from './helpers/logger.js';
import c from 'chalk';
// Commands
import generate from './api/generate.js';
import release from './api/release.js';
// Types
interface Options {
  help?: boolean;
  version?: boolean;
}

const help = [
  `${c.green(`Vertis v${__VERSION__} in use.`)}`,
  '',
  'Usage:',
  `  Vertis ${c.cyan('[cmd]')} ${c.yellow('{args}')}`,
  '',
  `${c.cyan('Commands')}:`,
  `  ${c.cyan('help')}: Show those helpful notes.`,
  `  ${c.cyan('version')}: Shows Vertis version in use.`,
  `  ${c.cyan('generate')}: Generates a changelog.`,
  `  ${c.cyan('release')}: Creates a release.`,
  '',
  `${c.yellow('Arguments')}:`,
  `  ${c.yellow('--help')}: Shows the help for a ${c.cyan('command')}.`,
  `  ${c.yellow('--version')}: Shows Vertis version in use.`
].join('\n');

(async () => {
  const argv: Arguments<Options> = await yargs(hideBin(process.argv)).help(false).argv;
  if (argv._.length === 0) {
    if (argv.version) {
      logger.pure(__VERSION__);
    } else {
      logger.pure(help);
    }
  } else if (argv._.length === 1 && argv._[0] === 'help') {
    logger.pure(help);
  } else if (argv._.length === 1 && argv._[0] === 'version') {
    logger.pure(__VERSION__);
  } else if (argv._[0] === 'generate') {
    generate(argv);
  } else if (argv._[0] === 'release') {
    release(argv);
  } else {
    logger.error(`Command ${c.yellow(argv._[0].toString())} does not exist.`);
  }
})();
