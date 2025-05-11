---
sidebar_position: 7
---

# Google Vertex AI

## はじめに

始めるには、[Vertex AI Gemini統合チュートリアル](../language-models/google-vertex-ai-gemini)の「はじめに」セクションに記載されている手順に従って、
Google Cloud Platformアカウントを作成し、Vertex AI APIにアクセスできる新しいプロジェクトを設定してください。

## 依存関係の追加

プロジェクトの`pom.xml`に以下の依存関係を追加してください：

```xml
<dependency>
  <groupId>dev.langchain4j</groupId>
  <artifactId>langchain4j-vertex-ai</artifactId>
  <version>1.0.0-beta4</version>
</dependency>
```

またはプロジェクトの`build.gradle`に：

```groovy
implementation 'dev.langchain4j:langchain4j-vertex-ai:1.0.0-beta4'
```

## 埋め込みモデルの作成

### 認証

Vertex AIを使用するには、Google Cloud認証情報を設定する必要があります。
これを行うには、いくつかの方法があります：

1. 環境変数を使用する：
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

2. コードで明示的に認証情報を設定する：
```java
GoogleCredentials credentials = GoogleCredentials.fromStream(new FileInputStream("/path/to/your/service-account-key.json"));
```

### 埋め込みモデルの作成

```java
VertexAiEmbeddingModel embeddingModel = VertexAiEmbeddingModel.builder()
    .endpoint("us-central1-aiplatform.googleapis.com:443")
    .project("your-gcp-project-id")
    .location("us-central1")
    .publisher("google")
    .modelName("textembedding-gecko@001")
    .taskType(VertexAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .outputDimensionality(512) // 異なる出力ベクトル次元をサポートするモデル用
    .build();
```

## 埋め込みタスクタイプ

埋め込みモデルはさまざまなユースケースに使用できます。
より良い埋め込み値を得るために、以下のような_タスク_を指定できます：

* `RETRIEVAL_QUERY`
* `RETRIEVAL_DOCUMENT`
* `SEMANTIC_SIMILARITY`
* `CLASSIFICATION`
* `CLUSTERING`
* `QUESTION_ANSWERING`
* `FACT_VERIFICATION`
* `CODE_RETRIEVAL_QUERY`

[サポートされているモデルのリスト](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/task-types)を参照してください。

### 参考文献

[Vertex AI埋め込みモデルに関するGoogleコードラボ](https://codelabs.developers.google.com/codelabs/genai-chat-java-palm-langchain4j)

[利用可能な安定版埋め込みモデル](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/text-embeddings#model_versions)

[最新の埋め込みモデルバージョン](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versioning#palm-latest-models)
