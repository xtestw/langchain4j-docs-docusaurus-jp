// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'LangChain4j 日本語ドキュメント',
    tagline: 'Java アプリケーションでビッグモデル機能を有効にするための公式日本語ガイド',
    favicon: 'img/favicon.ico',
    onBrokenLinks: 'warn', // ideally this should have a stricter value set - 'throw'
    onBrokenMarkdownLinks: 'warn', // ideally this should have a stricter value set - 'throw'
    onDuplicateRoutes: 'warn', // ideally this should have a stricter value set - 'throw'

    // Set the production url of your site here
    url: 'https://docs-jp.langchain4j.info/',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'LangChain4j', // Usually your GitHub org/user name.
    projectName: 'LangChain4j', // Usually your repo name.

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'zh-Hans',
        locales: ['zh-Hans'],
        localeConfigs: {
            'zh-Hans': {
                htmlLang: 'zh-Hans',
            },
        },
    },

    // 脚本应该在这里，作为根级别配置
    scripts: [
        {
            src: '/structured-data.js',
            async: true,
        },
        {
            src: 'https://www.googletagmanager.com/gtag/js?id=G-46M4FH02G5',
            async: true,
        },
        {
            src: '/js/gtag.js',
        },
    ],

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    path: 'docs',
                    routeBasePath: '', // change this to any URL route you'd want. For example: `home` - if you want /home/intro.
                    sidebarPath: './sidebars.js',
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/langchain4j/langchain4j/blob/main/docs',
                },
                blog: {
                    showReadingTime: true,
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/langchain4j/langchain4j/blob/main/docs',
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
                gtag: {
                    trackingID: 'G-46M4FH02G5',
                    anonymizeIP: true,
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            // Replace with your project's social card
            image: 'img/docusaurus-social-card.jpg',
            docs: {
                sidebar: {
                    hideable: true,
                    autoCollapseCategories: true,
                },
            },
            navbar: {
                title: 'LangChain4j',
                logo: {
                    alt: 'LangChain4j Logo',
                    src: 'img/logo.svg',
                },
                items: [
                    {
                        type: 'docSidebar',
                        sidebarId: 'tutorialSidebar',
                        position: 'left',
                        label: '導入',
                    },
                    { to: '/get-started', label: 'クイックスタート', position: 'left' },
                    { to: '/category/チュートリアル', label: 'チュートリアル', position: 'left' },
                    { to: '/category/統合された', label: '統合された', position: 'left' },
                    { to: '/useful-materials', label: '役立つ情報', position: 'left' },
                    {
                        href: 'https://github.com/langchain4j/langchain4j-examples',
                        label: 'Examples',
                        position: 'left',
                    },
                    {
                        href: 'https://chat.langchain4j.dev/',
                        label: 'Docu chatbot',
                        position: 'left',
                    },
                    {
                        href: 'https://docs.langchain4j.dev/apidocs/index.html',
                        label: 'Javadoc',
                        position: 'left'
                    },
                    {
                        href: 'https://github.com/langchain4j/langchain4j',
                        label: 'GitHub',
                        position: 'right',
                    },
                    {
                        href: 'https://twitter.com/langchain4j',
                        label: 'Twitter',
                        position: 'right',
                    },
                    {
                        href: 'https://discord.com/invite/JzTFvyjG6R',
                        label: 'Discord',
                        position: 'right',
                    },
                ],
            },
            footer: {
                style: 'dark',
                links: [
                    {
                        title: 'Docs',
                        items: [
                            {
                                label: '導入',
                                to: '/intro',
                            },
                            {
                                label: 'クイックスタート',
                                to: '/get-started',
                            },
                            {
                                label: 'チュートリアル',
                                to: '/category/チュートリアル',
                            },
                            {
                                label: '統合された',
                                to: '/category/統合された',
                            },
                            {
                                label: '役立つ情報',
                                to: '/useful-materials',
                            },
                            {
                                label: 'Examples',
                                href: 'https://github.com/langchain4j/langchain4j-examples',
                            },
                            {
                                label: 'Documentation chatbot (experimental)',
                                href: 'https://chat.langchain4j.dev/',
                            },
                            {
                                label: 'Javadoc',
                                href: 'https://docs.langchain4j.dev/apidocs/index.html',
                            },
                        ],
                    },
                    {
                        title: 'Community',
                        items: [
                            {
                                label: 'GitHub',
                                href: 'https://github.com/langchain4j/langchain4j',
                            },
                            {
                                label: 'Twitter',
                                href: 'https://twitter.com/langchain4j',
                            },
                            {
                                label: 'Discord',
                                href: 'https://discord.com/invite/JzTFvyjG6R',
                            },
                            {
                                label: 'Stack Overflow',
                                href: 'https://stackoverflow.com/questions/tagged/langchain4j',
                            },
                        ],
                    },
                ],
                copyright: `LangChain4j Documentation ${new Date().getFullYear()}. Built with Docusaurus.`,
            },
            prism: {
                theme: prismThemes.github,
                darkTheme: prismThemes.dracula,
                additionalLanguages: ['java'],
            },
            metadata: [
                {name: 'og:type', content: 'website'},
                {name: 'og:title', content: 'LangChain4j 日本語ドキュメント - 大規模モデル機能で Java アプリケーションを強化する'},
                {name: 'og:description', content: 'LangChain4j の日本語ドキュメントは、開発者が大規模な言語モデルを Java アプリケーションに簡単に統合できるようにする強力な Java フレームワークの公式中国語ガイドです。'},
                {name: 'og:image', content: 'https://docs-jp.langchain4j.info/img/og-image.jpg'},
                {name: 'twitter:card', content: 'summary_large_image'},
                {name: 'twitter:title', content: 'LangChain4j 日本語ドキュメント - 大規模モデル機能で Java アプリケーションを強化する'},
                {name: 'twitter:description', content: 'LangChain4j の日本語ドキュメントは、開発者が大規模な言語モデルを Java アプリケーションに簡単に統合できるようにする強力な Java フレームワークの公式中国語ガイドです。'},
                {name: 'twitter:image', content: 'https://docs-jp.langchain4j.info/img/twitter-image.jpg'},
                {name: 'keywords', content: 'LangChain4j, 中文文档, Java, 大语言模型, LLM, AI, 人工智能, 机器学习, 自然语言处理'},
                {name: 'description', content: 'LangChain4j の日本語ドキュメントは、開発者が大規模な言語モデルを Java アプリケーションに簡単に統合できるようにする強力な Java フレームワークの公式中国語ガイドです。'},
            ],
        }),
    markdown: {
        mermaid: true,
    },
    themes: ['@docusaurus/theme-mermaid'],
    plugins: [
        // require.resolve("docusaurus-lunr-search"),
        // [
        //     '@docusaurus/plugin-sitemap',
        //     {
        //         changefreq: 'weekly',
        //         priority: 0.5,
        //     },
        // ],
        // 暂时注释掉 robots 插件
        /*
        [
            '@docusaurus/plugin-robots',
            {
                host: 'https://docs-jp.langchain4j.info',
                sitemap: 'https://docs-jp.langchain4j.info/sitemap.xml',
                policy: [
                    { userAgent: '*', allow: '/' },
                ],
            },
        ],
        */
    ]
};

export default config;
