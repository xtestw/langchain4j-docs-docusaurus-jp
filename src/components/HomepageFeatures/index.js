import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
    {
        title: '轻松与大语言模型和向量存储交互',
        Svg: require('@site/static/img/llm-logos.svg').default,
        description: (
            <>
                所有主要的商业和开源大语言模型及向量存储都可以通过统一的 API 轻松访问，使您能够构建聊天机器人、智能助手等应用。
            </>
        ),
    },
    {
        title: '专为 Java 量身定制',
        Svg: require('@site/static/img/framework-logos.svg').default,
        description: (
            <>
                得益于 Quarkus 和 Spring Boot 集成，可以顺畅地整合到您的 Java 应用程序中。大语言模型和 Java 之间实现了双向集成：您可以从 Java 调用大语言模型，也可以让大语言模型反过来调用您的 Java 代码。
            </>
        ),
    },
    {
        title: 'Agents, Tools, RAG',
        Svg: require('@site/static/img/functionality-logos.svg').default,
        description: (
            <>
                我们丰富的工具箱为常见的大语言模型操作提供了广泛的工具，从底层的提示模板、聊天记忆管理和输出解析，到高级模式如代理和检索增强生成（RAG）。
            </>
        ),
    }
];

function Feature({Svg, title, description}) {
    return (
        <div className={clsx('col col--4')}>
            <div className="text--center">
                <Svg className={styles.featureSvg} role="img"/>
            </div>
            <div className="text--center padding-horiz--md">
                <Heading as="h3">{title}</Heading>
                <p>{description}</p>
            </div>
        </div>
    );
}

export default function HomepageFeatures() {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
