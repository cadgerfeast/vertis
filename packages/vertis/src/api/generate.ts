// Helpers
import type { Arguments } from 'yargs';
import c from 'chalk';
import { simpleGit } from 'simple-git';
// Constants
const git = simpleGit();
// Types
interface Options {
  help?: boolean;
  h?: boolean;
}

const help = [
  'Usage:',
  `  vertis generate ${c.green('(from-tag,to-tag)')} ${c.yellow('{args}')}`,
  '',
  `${c.yellow('Arguments')}:`,
  `  ${c.yellow('--help/-h')}: Shows the help this ${c.cyan('command')}.`
].join('\n');

export async function generate (delimiter?: string) {
  const data = await git.log();
  let fromHash: string = data.all[data.all.length - 1].hash;
  let toHash: string = data.all[0].hash;
  if (delimiter) {
    const count = (delimiter.match(/,/g) || []).length;
    switch (count) {
      case 0: {
        // Changelog: "to"
        const _toHash = data.all.find(({ refs }) => refs.includes(`tag: ${delimiter}`));
        if (!_toHash) {
          console.error(c.red(`Could not find ${c.yellow(`to=${delimiter}`)} tag.`));
          process.exit(1);
        }
        toHash = _toHash.hash;
        break;
      }
      case 1: {
        // Changelog: "from,to"
        const [from, to] = delimiter.split(',');
        const _fromHash = data.all.find(({ refs }) => refs.includes(`tag: ${from}`));
        if (!_fromHash) {
          console.error(c.red(`Could not find ${c.yellow(`from=${from}`)} tag.`));
          process.exit(1);
        }
        fromHash = _fromHash.hash;
        const _toHash = data.all.find(({ refs }) => refs.includes(`tag: ${to}`));
        if (!_toHash) {
          console.error(c.red(`Could not find ${c.yellow(`to=${to}`)} tag.`));
          process.exit(1);
        }
        toHash = _toHash.hash;
        break;
      }
      default: {
        console.error(c.red(`Delimiter seems invalid, should have: ${c.white('"from-tag,to-tag"')} format.`));
        process.exit(1);
      }
    }
  }
  // Changelog: "*"
  console.debug(c.gray(`Generating changelog between ${c.white(`"${fromHash.slice(0, 7)}"`)} and ${c.white(`"${toHash.slice(0, 7)}"`)}`));
  // TODO Generate JSON
}

export default async (argv: Arguments<Options>) => {
  if (argv.h || argv.help) {
    console.info(help);
  } else {
    await generate(argv._[1]?.toString());
  }
};
