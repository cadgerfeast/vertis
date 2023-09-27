// Helpers
import yargs, { Arguments } from 'yargs';
import { hideBin } from 'yargs/helpers';
import c from 'chalk';
// Commands
import generate from './api/generate.js';
// Types
interface Options {
  help?: boolean;
  h?: boolean;
  version?: boolean;
  v?: boolean;
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
  '',
  `${c.yellow('Arguments')}:`,
  `  ${c.yellow('--help/-h')}: Shows the help for a ${c.cyan('command')}.`,
  `  ${c.yellow('--version/-v')}: Shows Vertis version in use.`
].join('\n');

(async () => {
  const argv: Arguments<Options> = await yargs(hideBin(process.argv)).help(false).argv;
  if (argv._.length === 0) {
    if (argv.v || argv.version) {
      console.info(__VERSION__);
    } else {
      console.info(help);
    }
  } else if (argv._.length === 1 && argv._[0] === 'help') {
    console.info(help);
  } else if (argv._.length === 1 && argv._[0] === 'version') {
    console.info(__VERSION__);
  } else if (argv._.length === 1 && argv._[0] === 'generate') {
    generate(argv);
  } else {
    console.error(c.red(`Command ${c.yellow(argv._[0].toString())} does not exist.`));
  }
})();
