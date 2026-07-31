# Google Gen AI Embeddings（実験的）

https://github.com/googleapis/java-genai

この統合は公式の Google Gen AI Java SDK（`com.google.genai:google-genai`）を使用します。
**実験的（Experimental）** とマークされており、API と実装は将来のリリースで変更される可能性があります。

## Maven 依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-google-genai</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## API Key

API キーはこちらで無料取得できます：https://ai.google.dev/gemini-api/docs/api-key 。

## 利用可能なモデル

[利用可能な埋め込みモデル](https://ai.google.dev/gemini-api/docs/embeddings#model-versions)を参照してください。例：

* `gemini-embedding-001` — テキストのみ。タスクタイプと出力次元（128–3072）をサポート。
* `gemini-embedding-2` — ネイティブマルチモーダル。タスクタイプパラメータは使用しません（Gemini Embedding 2 でのタスク指示の仕組みは
  [Google AI Gemini Embeddings](/integrations/embedding-models/google-ai-gemini) を参照）。

## GoogleGenAiEmbeddingModel

### 基本的な使い方

```java
EmbeddingModel embeddingModel = GoogleGenAiEmbeddingModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-embedding-001")
    .build();

Response<Embedding> response = embeddingModel.embed("Hello, world!");
Embedding embedding = response.content();
```

### 埋め込みモデルの設定

```java
EmbeddingModel embeddingModel = GoogleGenAiEmbeddingModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleGenAiEmbeddingModel.TaskTypeEnum.RETRIEVAL_DOCUMENT) // default task type
    .outputDimensionality(768)      // reduce the embedding size (for models that support it)
    .titleMetadataKey("title")      // metadata key used as the document title for RETRIEVAL_DOCUMENT
    .maxRetries(3)
    .timeout(Duration.ofSeconds(30))
    .build();
```

## リクエスト/レスポンス API と機能

便利メソッドやビルダーレベルの `taskType(...)` に加え、`GoogleGenAiEmbeddingModel` は呼び出しごとのパラメータを持つリクエスト/レスポンス API をサポートします：

- **入力タイプ**：`EmbeddingInputType.QUERY` / `DOCUMENT` は SDK の `RETRIEVAL_QUERY` /
  `RETRIEVAL_DOCUMENT` タスクタイプにマップされるため、モデルインスタンスを 2 つ用意しなくてもクエリとドキュメントを区別して埋め込めます（`gemini-embedding-001` などタスクタイプ対応モデル）。
- **次元**：呼び出しごとの `dimensions(...)` は、出力サイズ縮小をサポートするモデルでビルダーの `outputDimensionality` を上書きします。
- **マルチモーダル**（`gemini-embedding-2`）：インターリーブされたテキスト + 画像を単一埋め込みにネイティブ変換。
  以前のモデル（例：`gemini-embedding-001`）はテキストのみ。画像は base64（`ImageContent`）で提供する必要があります。
- **リスナー**：`GoogleGenAiEmbeddingModel.builder().listeners(...)` で設定し、リクエスト・レスポンス・エラーを観測。

```java
EmbeddingResponse response = embeddingModel.embed(EmbeddingRequest.builder()
    .input("What is the capital of France?")
    .inputType(EmbeddingInputType.QUERY) // embed as a query
    .dimensions(256)                     // reduce output dimensionality
    .build());

List<Embedding> embeddings = response.embeddings();
```

マルチモーダルの例（Gemini Embedding 2 — テキストと画像を 1 つの埋め込みに融合）：

```java
EmbeddingModel embeddingModel = GoogleGenAiEmbeddingModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-embedding-2")
    .build();

EmbeddingResponse response = embeddingModel.embed(EmbeddingRequest.builder()
    .input(TextContent.from("a photo of a cat"), ImageContent.from(base64Image, "image/png"))
    .build());

Embedding embedding = response.embeddings().get(0);
```

リクエスト/レスポンス API については [Embedding Model](/tutorials/rag#embedding-model)、リスナーについては
[Observability](/tutorials/observability) を参照してください。

## 詳細

Gemini 埋め込みモデルの詳細は
[ドキュメント](https://ai.google.dev/gemini-api/docs/embeddings)を参照してください。
