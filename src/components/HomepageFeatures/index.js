import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
    {
        title: '大規模な言語モデルやベクトルストアと簡単に対話できます',
        Svg: require('@site/static/img/llm-logos.svg').default,
        description: (
            <>
              すべての主要な商用およびオープンソースの大規模言語モデルとベクトル ストアは、統合された API を通じて簡単にアクセスできるため、チャットボットやインテリジェント アシスタントなどのアプリケーションを構築できます。
            </>
        ),
    },
    {
        title: 'Java向けにカスタマイズ',
        Svg: require('@site/static/img/framework-logos.svg').default,
        description: (
            <>
    Quarkus と Spring Boot の統合により、Java アプリケーションにスムーズに統合できます。 Big Language Model と Java の間には双方向の統合があります。つまり、Java から Big Language Model を呼び出すことができ、Big Language Model は Java コードを呼び出すことができます。            </>
        ),
    },
    {
        title: 'Agents, Tools, RAG',
        Svg: require('@site/static/img/functionality-logos.svg').default,
        description: (
            <>
           当社の豊富なツールボックスには、低レベルのプロンプト テンプレート、チャット メモリ管理、出力解析から、代理生成や検索拡張生成 (RAG) などの高度なパターンまで、一般的な大規模言語モデル操作のための幅広いツールが用意されています。
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
