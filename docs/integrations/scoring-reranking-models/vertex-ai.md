---
sidebar_position: 4
---

# Google Cloud Vertex AI ランキングAPI

- [Google Cloud Vertex AI ランキングドキュメント](https://cloud.google.com/generative-ai-app-builder/docs/ranking)
- [Google Cloud Vertex AI ランキングAPI説明](https://cloud.google.com/generative-ai-app-builder/docs/reference/rest/v1/projects.locations.rankingConfigs/rank)


### 紹介

Google Cloud Vertex AI ランキングAPIは、特定のクエリに対して取得されたドキュメントの関連性を洗練することで検索結果を強化する強力なツールです。
従来の検索方法とは異なり、高度な機械学習アルゴリズムを活用してクエリとドキュメントの両方の意味的コンテキストを理解し、より正確で関連性の高い結果を提供します。
クエリと各ドキュメント間の意味的関係を分析することで、APIは計算された関連性スコアに基づいて候補ドキュメントを並べ替え、最も関連性の高い結果が検索結果ページの上部に表示されるようにします。

### Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-vertex-ai</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

### 使用方法

モデルを設定するには、以下を指定する必要があります：
* Google CloudプロジェクトのプロジェクトID
* プロジェクト番号
* ロケーション（例：`us-central1`、`europe-west1`）
* 使用したいモデル

> 注：プロジェクト番号はGoogle Cloudコンソールで確認するか、`gcloud projects describe your-project-id`を実行して確認できます。

`score(text, query)`および`score(segment, query)`メソッドを使用して、
単一の文字列または`TextSegment`をクエリに対してスコアリングできます。

`scoreAll(segments, query)`メソッドを使用して、
複数の文字列または`TextSegment`をクエリに対してスコアリングすることも可能です：

```java
VertexAiScoringModel scoringModel = VertexAiScoringModel.builder()
    .projectId(System.getenv("GCP_PROJECT_ID"))
    .projectNumber(System.getenv("GCP_PROJECT_NUM"))
    .projectLocation(System.getenv("GCP_LOCATION"))
    .model("semantic-ranker-512")
    .build();

Response<List<Double>> score = scoringModel.scoreAll(Stream.of(
        "空が青く見えるのは、レイリー散乱と呼ばれる現象によるものです。" +
            "太陽光は虹のすべての色で構成されています。青い光は他の色よりも波長が短く、" +
            "そのため散乱しやすくなっています。",

        "一日を覆うキャンバス、\n" +
            "太陽の光が踊り遊ぶ場所。\n" +
            "青、散乱した光の色合い、\n" +
            "優しいささやき、柔らかく明るい。"
        ).map(TextSegment::from).collect(Collectors.toList()),
    "なぜ空は青いのですか？");

// [0.8199999928474426, 0.4300000071525574]
```

特定の`title`キーを持つ`TextSegment`を渡すと、ランカーモデルはこのメタデータを計算に考慮することができます。
カスタムタイトルキーを指定するには、`titleMetadataKey()`ビルダーメソッドを使用できます。

`AiServices`とその`contentAgregator()`メソッドでスコアリングモデルを使用できます。
このメソッドはスコアリングモデルを指定できる`ContentAggregator`クラスを取ります：

```java
VertexAiScoringModel scoringModel = VertexAiScoringModel.builder()
    .projectId(System.getenv("GCP_PROJECT_ID"))
    .projectNumber(System.getenv("GCP_PROJECT_NUM"))
    .projectLocation(System.getenv("GCP_LOCATION"))
    .model("semantic-ranker-512")
    .build();

ContentAggregator contentAggregator = ReRankingContentAggregator.builder()
    .scoringModel(scoringModel)
    ... 
    .build();

RetrievalAugmentor retrievalAugmentor = DefaultRetrievalAugmentor.builder()
    ...
    .contentAggregator(contentAggregator)
    .build();

return AiServices.builder(Assistant.class)
    .chatModel(...)
    .retrievalAugmentor(retrievalAugmentor)
    .build();
```
