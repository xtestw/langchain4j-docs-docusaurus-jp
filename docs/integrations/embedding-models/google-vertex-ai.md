---
sidebar_position: 7
---

# Google Vertex AI

## はじめに

始めるには、[Vertex AI Gemini 統合チュートリアル](../language-models/google-vertex-ai-gemini) の「はじめに」セクションの手順に従い、
Google Cloud Platform アカウントを作成し、Vertex AI API にアクセスできる新しいプロジェクトを用意してください。

## 依存関係の追加

プロジェクトの `pom.xml` に次の依存関係を追加します：

```xml
<dependency>
  <groupId>dev.langchain4j</groupId>
  <artifactId>langchain4j-vertex-ai</artifactId>
  <version>1.18.1-beta28</version>
</dependency>
```

またはプロジェクトの `build.gradle`：

```groovy
implementation 'dev.langchain4j:langchain4j-vertex-ai:1.18.1-beta28'
```

### サンプルコードを試す：

[Vertex AI Embedding Model の使用例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/embedding/model/VertexAiEmbeddingModelExample.java)

`PROJECT_ID` フィールドは、新しい Google Cloud プロジェクト作成時に設定した変数を表します。

```java
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.vertexai.VertexAiEmbeddingModel;

public class VertexAiEmbeddingModelExample {
    
    private static final String PROJECT_ID = "YOUR-PROJECT-ID";
    private static final String MODEL_NAME = "textembedding-gecko@latest";

    public static void main(String[] args) {

        EmbeddingModel embeddingModel = VertexAiEmbeddingModel.builder()
                .project(PROJECT_ID)
                .location("us-central1")
                .endpoint("us-central1-aiplatform.googleapis.com:443")
                .publisher("google")
                .modelName(MODEL_NAME)
                .build();

        Response<Embedding> response = embeddingModel.embed("Hello, how are you?");
        
        Embedding embedding = response.content();

        int dimension = embedding.dimension(); // 768
        float[] vector = embedding.vector(); // [-0.06050122, -0.046411075, ...

        System.out.println(dimension);
        System.out.println(embedding.vectorAsList());
    }
}
```

### 利用可能な埋め込みモデル

|English models|Multilingual models|
|---|---|
|`textembedding-gecko@001`|`textembedding-gecko-multilingual@001`|
|`textembedding-gecko@003`|`text-multilingual-embedding-002`|
|`text-embedding-004`|   |

[多言語モデルでサポートされる言語一覧](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-text-embeddings#language_coverage_for_textembedding-gecko-multilingual_models)

`@latest` サフィックス付きのモデル名は、そのモデルの最新バージョンを指します。

デフォルトでは、ほとんどの埋め込みモデルは 768 次元のベクトル埋め込みを出力します（設定可能なより低い次元を受け付ける "Matryoshka" モデルを除く）。
API は埋め込むセグメントあたり最大 2,048 入力トークンを受け付けます。
最大 250 個のテキストセグメントを送信できます。
同時に 250 を超えるセグメントの埋め込みを要求すると、`VertexAiEmbeddingModel` クラスは自動的・透過的にリクエストをバッチ分割します。
埋め込み API は呼び出しあたり合計 20,000 トークン（全セグメント）に制限されています。その上限に達すると、`VertexAiEmbeddingModel` は再びリクエストをバッチ化して制限を回避します。

### 埋め込みモデルの設定

```java
EmbeddingModel embeddingModel = VertexAiEmbeddingModel.builder()
    .project(PROJECT_ID)
    .location("us-central1")
    .endpoint("us-central1-aiplatform.googleapis.com:443") // optional
    .publisher("google")
    .modelName(MODEL_NAME)
    .maxRetries(2)             // 2 by default
    .maxSegmentsPerBatch(250)  // up to 250 segments per batch
    .maxTokensPerBatch(2048)   // up to 2048 tokens per segment
    .taskType()                // see below for the different task types
    .titleMetadataKey()        // for the RETRIEVAL_DOCUMENT task, you can specify a title  
                               // for the text segment to identify its document origin
    .autoTruncate(false)       // false by default: truncates segments longer than 2,048 input tokens
    .outputDimensionality(512) // for models that support different output vector dimensions
    .credentials(credentials)  // custom Google Cloud credentials    
    .build();
```

## 埋め込みタスクタイプ

埋め込みモデルはさまざまなユースケースに使えます。
より良い埋め込み値を得るために、次のいずれかの _タスク_ を指定できます：

* `RETRIEVAL_QUERY`
* `RETRIEVAL_DOCUMENT`
* `SEMANTIC_SIMILARITY`
* `CLASSIFICATION`
* `CLUSTERING`
* `QUESTION_ANSWERING`
* `FACT_VERIFICATION`
* `CODE_RETRIEVAL_QUERY`

[サポートされるモデル](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/task-types)の一覧を参照してください。

### 参考

[Vertex AI Embedding Model の Google Codelab](https://codelabs.developers.google.com/codelabs/genai-chat-java-palm-langchain4j)

[利用可能な安定版 Embedding Models](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/text-embeddings#model_versions)

[最新の Embedding Models バージョン](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versioning#palm-latest-models)
