// Helpers
import { simpleGit } from 'simple-git';

export const git = simpleGit();

export async function getRemoteGitURL () {
	let repositoryURL = (await git.getConfig('remote.origin.url')).value;
  if (!repositoryURL) {
    throw new Error('Could not find valid github repository.');
  }
  if (repositoryURL.startsWith('git@')) {
    repositoryURL = repositoryURL.replace(':', '/').replace('git@', 'https://').replace('.git', '')
  }
	return repositoryURL;
}
