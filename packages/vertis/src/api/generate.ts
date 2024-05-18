// Helpers
import type { Arguments } from 'yargs';
import * as path from 'path';
import c from 'chalk';
import * as fs from '../helpers/fs.js';
import { getConfig } from '../helpers/config.js';
import { git, getRemoteGitURL } from '../helpers/git.js';
import { Changelog } from '../index.js';
import { logger } from '../helpers/logger.js';
// Types
interface Options {
  help?: boolean;
  from?: string;
  to?: string;
}

const help = [
  'Usage:',
  `  vertis generate ${c.green('(filePath)')} ${c.yellow('{args}')}`,
  '',
  `${c.yellow('Arguments')}:`,
  `  ${c.yellow('--help')}: Shows the help this ${c.cyan('command')}.`,
  `  ${c.yellow('--from')}: Specify the "from" delimiter (defaults to initial commit).`,
  `  ${c.yellow('--to')}: Specify the "to" delimiter (defaults to latest commit).`
].join('\n');

export type GenerateOptions = {
  from?: string;
  to?: string;
  filePath?: string;
}

export async function generate ({ from, to, filePath }: GenerateOptions) {
  const repositoryURL = await getRemoteGitURL();
  const data = await git.log();
  let fromHash: string = data.all[data.all.length - 1].hash;
  let toHash: string = data.all[0].hash;
  if (from) {
    const _fromHash = data.all.find(({ refs }) => refs.includes(`tag: ${from}`));
    if (!_fromHash) {
      logger.error(`Could not find ${c.yellow(`from=${from}`)} tag.`);
      process.exit(1);
    }
    fromHash = _fromHash.hash;
  }
  if (to) {
    const _toHash = data.all.find(({ refs }) => refs.includes(`tag: ${to}`));
    if (!_toHash) {
      logger.error(`Could not find ${c.yellow(`to=${to}`)} tag.`);
      process.exit(1);
    }
    toHash = _toHash.hash;
  }
  logger.debug(`Generating changelog between ${c.white(`"${fromHash.slice(0, 7)}"`)} and ${c.white(`"${toHash.slice(0, 7)}"`)}`);
  const changelog: Changelog = data.all.slice(data.all.findIndex(({ hash }) => hash === toHash), data.all.findIndex(({ hash }) => hash === fromHash) + 1).map((commit) => ({
    hash: commit.hash,
    message: commit.message,
    description: commit.body,
    date: new Date(commit.date),
    tags: commit.refs.split(',').filter((ref) => ref.includes('tag:')).map((ref) => ref.replace('tag:', '').trim()),
    author: {
      name: commit.author_name,
      email: commit.author_email
    }
  }));
  const config = await getConfig();
  const { computeChangelogContent } = await config.strategy();
  let changelogPath = 'CHANGELOG.md';
  if (filePath) {
    changelogPath = filePath.slice(-3) === '.md' ? filePath : `${filePath}/CHANGELOG.md`;
  }
  changelogPath = path.resolve(process.cwd(), changelogPath);
  logger.debug(`Generating changelog in: ${c.white(`"${path.normalize(changelogPath)}"`)}`);
  fs.ensureFileSync(changelogPath);
  fs.writeFileSync(changelogPath, computeChangelogContent(repositoryURL, changelog));
}

export default async (argv: Arguments<Options>) => {
  if (argv.help) {
    logger.pure(help);
  } else {
    await generate({
      from: argv.from,
      to: argv.to,
      filePath: argv._[1]?.toString()
    });
  }
};
