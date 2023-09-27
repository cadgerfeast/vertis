// Helpers
import { defineConfig } from 'vitepress';

export default defineConfig({
	title: 'Vertis',
	cleanUrls: true,
	srcDir: './src',
	head: [
		['link', { rel: 'icon', href: '/favicon.svg'}],
	],
	themeConfig: {
		logo: '/favicon.svg',
		nav: [
			{
				text: 'Guide',
				link: '/guide/what-is-vertis',
				activeMatch: '/guide/'
			},
			{
				text: 'Links',
				items: [
					{
						text: 'Contributing',
						link: 'https://github.com/cadgerfeast/vertis/blob/master/CONTRIBUTING.md'
					}
				]
			}
		],
		socialLinks: [
      { icon: 'github', link: 'https://github.com/cadgerfeast/vertis' }
    ],
		sidebar: {
			'/guide/': [
				{
					text: 'Introduction',
					collapsed: false,
					items: [
						{ text: 'What is Vertis?', link: '/guide/what-is-vertis' },
						{ text: 'Getting Started', link: '/guide/getting-started' }
					]
				}
			]
		},
		search: {
			provider: 'local'
		}
	}
});
