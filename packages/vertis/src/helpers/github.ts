// Helpers
import { Octokit, RequestError } from 'octokit';
// Constants
const octokit = new Octokit({
	auth: process.env.GH_TOKEN
});

function getGithubRepositoryData (repositoryURL: string) {
	const res = /(git@|https?:\/\/)([a-zA-Z0-9.\-_]+)(\/|:)([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)/.exec(repositoryURL);
	if (!res) {
		throw new Error('Could get data from repository URL.');
	}
	return {
		owner: res[4],
		repo: res[5]
	};
}

async function getGithubRelease (tag: string, owner: string, repo: string) {
	try {
		await octokit.request('GET /repos/{owner}/{repo}/releases/tags/{tag}', {
			owner,
			repo,
			tag,
			headers: {
				'X-GitHub-Api-Version': '2022-11-28'
			}
		});
		return {
			exists: true,
			tag
		};
	} catch (err) {
		if (err instanceof RequestError && err.status !== 404) {
			throw err;
		}
		return {
			exists: false,
			tag
		};
	}
}

export async function getGithubReleases (tags: string[], repositoryURL: string) {
	if (!process.env.GH_TOKEN) {
		throw new Error('GH_TOKEN must be provided.');
	}
	const { owner, repo } = getGithubRepositoryData(repositoryURL);
	return Promise.all(tags.map((tag) => getGithubRelease(tag, owner, repo)));
}

export async function postGithubRelease (tag: string, name: string, repositoryURL: string, body: string) {
	if (!process.env.GH_TOKEN) {
		throw new Error('GH_TOKEN must be provided.');
	}
	const { owner, repo } = getGithubRepositoryData(repositoryURL);
	await octokit.request('POST /repos/{owner}/{repo}/releases', {
		owner,
		repo,
		tag_name: tag,
		name,
		body,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});
}
