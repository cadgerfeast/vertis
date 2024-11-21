// Helpers
import type { Arguments } from 'yargs';
import c from 'chalk';
import { getConfig } from '../helpers/config.js';
import { git, getRemoteGitURL } from '../helpers/git.js';
import { getGithubReleases, postGithubRelease } from '../helpers/github.js';
import { Changelog } from '../index.js';
import { logger } from '../helpers/logger.js';
// Types
interface Options {
  help?: boolean;
  tags?: string;
}

const help = [
  'Usage:',
  `  vertis release ${c.yellow('{args}')}`,
  '',
  `${c.yellow('Arguments')}:`,
  `  ${c.yellow('--help')}: Shows the help this ${c.cyan('command')}.`,
  `  ${c.yellow('--tags')}: Tags to create a release from. This accepts a array of strings separated by comma or "*" for all. (defaults to only latest tag)`
].join('\n');

export type ReleaseOptions = {
  tags?: string[]|'*';
};

export async function release ({ tags }: ReleaseOptions) {
  const repositoryURL = await getRemoteGitURL();
  const data = await git.log();
	const config = await getConfig();
  const { gitTarget, computeReleaseContent, computeReleases } = await config.strategy(config);
  logger.debug(`Generating ${c.white(`"${gitTarget}"`)} release.`);
  const changelog: Changelog = data.all.map((commit) => ({
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
  const releases = computeReleases(gitTarget, repositoryURL, changelog);
  const releaseTags: string[] = [];
  if (releases.length > 0) {
    if (!tags) {
      releaseTags.push(releases[0].packages[0].tag);
    } else {
      if (tags === '*') {
        releaseTags.push(...releases.flatMap(({ packages }) => packages[0].tag));
      } else {
        const existingTags = releases.flatMap(({ packages }) => packages.map(({ tag }) => tag));
        for (const tag of tags) {
          if (!existingTags.includes(tag)) {
            logger.error(`${c.white(`"${tag}"`)} tag does not exist.`);
            process.exit(1);
          }
        }
        releaseTags.push(...tags);
      }
    }
		switch (gitTarget) {
			case 'github': {
				try {
					const githubReleases = await getGithubReleases(releaseTags, repositoryURL);
					for (const githubRelease of githubReleases.reverse()) {
						if (githubRelease.exists) {
							logger.warn(`Release already exists for ${c.white(`"${githubRelease.tag}"`)}`);
						} else {
							logger.debug(`Publishing Github Release for ${c.white(`"${githubRelease.tag}"`)}.`);
							try {
								const release = releases.find(({ packages }) => packages.find(({ tag }) => githubRelease.tag === tag))!;
								const markdownContent = computeReleaseContent(repositoryURL, release);
								await postGithubRelease(githubRelease.tag, release.title, repositoryURL, markdownContent);
							} catch (err) {
								logger.error(`An error occurred while publishing new "${githubRelease.tag}" release from github: ${c.yellow(err)}`);
								process.exit(1);
							}
						}
					}
				} catch (err) {
					logger.error(`An error occurred while getting releases from github: ${c.yellow(err)}`);
				}
				break;
			}
			default: {
				logger.error(`${c.white(`"${gitTarget}"`)} is an unknown release target.`);
				process.exit(1);
			}
		}
  }
}

export default async (argv: Arguments<Options>) => {
  if (argv.help) {
    logger.pure(help);
  } else {
    let tags: string[]|'*'|undefined;
    if (argv.tags) {
      tags = argv.tags === '*' ? '*' : argv.tags.split(',');
    }
    await release({
      tags
    });
  }
};
