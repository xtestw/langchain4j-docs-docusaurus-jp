---
sidebar_position: 3
---

# Jina

- [Jina Rerankerドキュメント](https://jina.ai/reranker)
- [Jina Reranker API](https://api.jina.ai/redoc#tag/rerank)


### 紹介

リランカーは、検索の初期結果セット（多くの場合、埋め込み/トークンベースの検索によって提供される）を取得し、ユーザーの意図により密接に一致するように再評価する高度なAIモデルです。
用語の表面的なマッチングを超えて、検索クエリとドキュメントの内容の間のより深い相互作用を考慮します。


### Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-jina</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

### 使用方法

```java


ScoringModel scoringModel = JinaScoringModel.builder()
    .apiKey(System.getenv("JINA_API_KEY"))
    .modelName("jina-reranker-v2-base-multilingual")
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
