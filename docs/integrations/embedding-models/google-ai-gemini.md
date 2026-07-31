# Google AI Gemini 埋め込み

https://ai.google.dev/gemini-api/docs/embeddings

## 目次

- [Maven 依存関係](#maven-dependency)
- [API Key](#api-key)
- [利用可能なモデル](#models-available)
- [GoogleAiEmbeddingModel](#googleaiembeddingmodel)
    - [基本的な使い方](#basic-usage)
    - [複数テキストの埋め込み](#embedding-multiple-texts)
    - [埋め込みモデルの設定](#configuring-the-embedding-model)
    - [タスクタイプ](#task-types)
    - [ドキュメントタイトル用のメタデータ](#using-metadata-for-document-titles)
    - [出力次元](#output-dimensionality)
    - [バッチ処理](#batch-processing)
- [バッチ埋め込み処理](#batch-embedding-processing)
    - [GoogleAiGeminiBatchEmbeddingModel](#googleaigeminibatchembeddingmodel)
    - [バッチ埋め込みジョブの作成](#creating-batch-embedding-jobs)
    - [バッチレスポンスの処理](#handling-batch-responses)
    - [結果のポーリング](#polling-for-results)
    - [バッチジョブの管理](#managing-batch-jobs)
    - [ファイルベースのバッチ処理](#file-based-batch-processing)

## Maven 依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-google-ai-gemini</artifactId>
    <version>1.18.1</version>
</dependency>
```

## API Key

API キーはこちらで無料取得できます：https://ai.google.dev/gemini-api/docs/api-key 。

## 利用可能なモデル

ドキュメント内の[利用可能なモデル](https://ai.google.dev/gemini-api/docs/embeddings#model-versions)一覧を確認してください。

* `gemini-embedding-001`
    * 入力トークン上限：2,048
    * 出力次元サイズ：柔軟、サポート：128 - 3072、推奨：768、1536、3072

## GoogleAiEmbeddingModel

`GoogleAiEmbeddingModel` を使うと、Google AI Gemini の埋め込みモデルでテキストから埋め込みを生成できます。

### 基本的な使い方

```java
EmbeddingModel embeddingModel = GoogleAiEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .build();

Response<Embedding> response = embeddingModel.embed("Hello, world!");
Embedding embedding = response.content();
```

### 複数テキストの埋め込み

```java
List<TextSegment> segments = List.of(
    TextSegment.from("First document"),
    TextSegment.from("Second document"),
    TextSegment.from("Third document")
);

Response<List<Embedding>> response = embeddingModel.embedAll(segments);
List<Embedding> embeddings = response.content();
```

### 埋め込みモデルの設定

```java
EmbeddingModel embeddingModel = GoogleAiEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .outputDimensionality(768)
    .titleMetadataKey("title")
    .maxRetries(3)
    .timeout(Duration.ofSeconds(30))
    .logRequestsAndResponses(true)
    .build();
```

### タスクタイプ

`taskType` パラメータは特定のユースケース向けに埋め込みを最適化します。

- `RETRIEVAL_QUERY`：検索クエリ向け
- `RETRIEVAL_DOCUMENT`：検索対象ドキュメント向け（ドキュメント索引付けのデフォルト）
- `SEMANTIC_SIMILARITY`：テキスト類似度の測定向け
- `CLASSIFICATION`：テキスト分類タスク向け
- `CLUSTERING`：類似テキストのグループ化向け
- `QUESTION_ANSWERING`：Q&A システム向け
- `FACT_VERIFICATION`：事実確認アプリケーション向け

### ドキュメントタイトル用のメタデータ

`TaskType.RETRIEVAL_DOCUMENT` を使用する場合、メタデータ経由でドキュメントタイトルを指定できます。

```java
EmbeddingModel embeddingModel = GoogleAiEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .titleMetadataKey("title") // defaults to "title"
    .build();

TextSegment segment = TextSegment.from(
    "This is the document content",
    Metadata.from("title", "My Document Title")
);

Response<Embedding> response = embeddingModel.embed(segment);
```

### 出力次元

埋め込みサイズを小さくするために、出力次元を指定できます。

```java
EmbeddingModel embeddingModel = GoogleAiEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .outputDimensionality(256) // Reduce from default 768 dimensions
    .build();
```

### バッチ処理

複数セグメントを埋め込む際、モデルは最適なパフォーマンスのため、リクエストを自動的にバッチ処理します（1 バッチあたり最大 100 セグメント）。

**注意：** これは割引バッチ API ではなく、複数埋め込みを処理するための便利なメソッドです。

## バッチ埋め込み処理

`GoogleAiGeminiBatchEmbeddingModel` は、大量の埋め込みリクエストを非同期かつ低コスト（標準価格の 50%）で処理するインターフェースを提供します。緊急でない大規模埋め込みタスクに適しており、24 時間のターンアラウンド SLO があります。

### バッチ埋め込みジョブの作成

**インラインバッチ作成：**

```java
GoogleAiGeminiBatchEmbeddingModel batchModel = GoogleAiGeminiBatchEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .outputDimensionality(768)
    .build();

// Create batch of text segments
List<TextSegment> segments = List.of(
    TextSegment.from("First document to embed"),
    TextSegment.from("Second document to embed"),
    TextSegment.from("Third document to embed")
);

// Submit the batch (generic API)
BatchResponse<Response<Embedding>> response = batchModel.submit(new BatchRequest<>(segments));

// Or, to set a Gemini-specific display name and priority, use GeminiBatchRequest:
BatchResponse<Response<Embedding>> response = batchModel.submit(GeminiBatchRequest.from(
    segments,
    "Document Embeddings Batch", // display name
    0L                           // priority (optional, defaults to 0)
));
```

**ファイルベースのバッチ作成：**

より大きなバッチでは、アップロード済みファイルからバッチを作成できます。

```java
// First, upload a file with batch requests
GeminiFiles filesApi = GeminiFiles.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .build();

GeminiFile uploadedFile = filesApi.uploadFile(
    Paths.get("batch_embeddings.jsonl"),
    "Batch Embedding Requests"
);

// Wait for file to be active
while (uploadedFile.isProcessing()) {
    Thread.sleep(1000);
    uploadedFile = filesApi.getMetadata(uploadedFile.name());
}

// Create batch from file
BatchResponse<Response<Embedding>> response = batchModel.submit("My Embedding Batch Job", uploadedFile);
```

### バッチレスポンスの処理

`BatchResponse` は現在の `state()` に加え、リクエストごとの `results()`、および便利なビューである
`responses()` / `errors()` を公開します。`state()` で分岐します（`state().isTerminal()`
でバッチが進行中かどうかを判定）：

```java
BatchResponse<Response<Embedding>> response = batchModel.submit(new BatchRequest<>(segments));

if (!response.state().isTerminal()) {
    System.out.println("Batch is " + response.state());
    System.out.println("Batch ID: " + response.batchId());
} else if (response.state() == BatchState.SUCCEEDED) {
    System.out.println("Batch completed successfully!");
    for (Response<Embedding> embeddingResponse : response.responses()) {
        Embedding embedding = embeddingResponse.content();
        System.out.println("Embedding dimensions: " + embedding.dimension());
    }
} else {
    System.err.println("Batch " + response.state() + ": " + response.errors());
}
```

`responses()` と `errors()` は便利なビューであり、決して `null` にはなりません（報告する内容がない場合は空です）。

### 結果とリクエストの対応付け

`responses()` と `errors()` はフラットなビューのため、どの入力がどの結果を生んだかの対応が失われます。
各結果を元のセグメントに対応付ける必要がある場合は、代わりに `results()` を使います。これは
**送信したセグメントと同じ順序で**、リクエストごとに 1 つの `BatchItemResult` を返すため、
i 番目の結果は i 番目のセグメントに対応します。各結果は `response()` を持つ `BatchItemResult.Success`、
または `error()` を持つ `BatchItemResult.Failure` のいずれかです。

```java
List<BatchItemResult<Response<Embedding>>> results = response.results();
for (int i = 0; i < results.size(); i++) {
    BatchItemResult<Response<Embedding>> item = results.get(i);
    if (item.isSuccess()) {
        System.out.println("Segment #" + i + " -> " + item.response().content().dimension() + " dimensions");
    } else {
        BatchError error = item.error();
        System.err.println("Segment #" + i + " failed: " + error.code() + " - " + error.message());
    }
}
```

### 結果のポーリング

バッチ処理は非同期のため、結果をポーリングする必要があります。

```java
BatchResponse<Response<Embedding>> result = batchModel.submit(new BatchRequest<>(segments));
String batchId = result.batchId();

while (!result.state().isTerminal()) {
    Thread.sleep(5000); // Wait 5 seconds between polls
    result = batchModel.retrieve(batchId);
}

// Process final result
if (result.state() == BatchState.SUCCEEDED) {
    List<Response<Embedding>> embeddings = result.responses();
    System.out.println("Generated " + embeddings.size() + " embeddings");
} else {
    System.err.println("Batch did not succeed: " + result.state());
}
```

### バッチジョブの管理

**バッチジョブのキャンセル：**

```java
String batchId = // ... obtained from submit(...)

try {
    batchModel.cancel(batchId);
    System.out.println("Batch cancelled successfully");
} catch (HttpException e) {
    System.err.println("Failed to cancel batch: " + e.getMessage());
}
```

**バッチジョブの削除：**

```java
batchModel.deleteBatchJob(batchId);
System.out.println("Batch deleted successfully");
```

**バッチジョブの一覧：**

```java
// List first page of batch jobs
BatchPage<Response<Embedding>> page = batchModel.list(new BatchPagination(10, null));

for (BatchResponse<Response<Embedding>> batch : page.batches()) {
    System.out.println("Batch: " + batch);
}

// Get next page if available
if (page.nextPageToken() != null) {
    BatchPage<Response<Embedding>> nextPage = batchModel.list(new BatchPagination(10, page.nextPageToken()));
}
```

### ファイルベースのバッチ処理

高度なユースケースでは、バッチリクエストを JSONL ファイルに書き出してアップロードできます。

```java
// Create a JSONL file with batch requests
Path batchFile = Files.createTempFile("batch", ".jsonl");

try (JsonLinesWriter writer = new StreamingJsonLinesWriter(batchFile)) {
    List<BatchFileRequest<TextSegment>> fileRequests = List.of(
        new BatchFileRequest<>("segment-1", TextSegment.from("First document")),
        new BatchFileRequest<>("segment-2", TextSegment.from("Second document")),
        new BatchFileRequest<>("segment-3", TextSegment.from("Third document"))
    );
    
    batchModel.writeBatchToFile(writer, fileRequests);
}

// Upload the file
GeminiFiles filesApi = GeminiFiles.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .build();

GeminiFile uploadedFile = filesApi.uploadFile(batchFile, "Batch Embedding Requests");

// Create batch from file
BatchResponse<Response<Embedding>> response = batchModel.submit("File-Based Embedding Batch", uploadedFile);
```

### バッチ埋め込みでのメタデータ利用

`TaskType.RETRIEVAL_DOCUMENT` を使用する場合、メタデータ経由でドキュメントタイトルを含められます。

```java
GoogleAiGeminiBatchEmbeddingModel batchModel = GoogleAiGeminiBatchEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .titleMetadataKey("title")
    .build();

List<TextSegment> segments = List.of(
    TextSegment.from(
        "Content of first document",
        Metadata.from("title", "First Document Title")
    ),
    TextSegment.from(
        "Content of second document",
        Metadata.from("title", "Second Document Title")
    )
);

BatchResponse<Response<Embedding>> response = batchModel.submit(GeminiBatchRequest.from(
    segments, "Documents with Titles"));
```

### 設定

`GoogleAiGeminiBatchEmbeddingModel` は `GoogleAiEmbeddingModel` と同じ設定オプションをサポートします。

```java
GoogleAiGeminiBatchEmbeddingModel batchModel = GoogleAiGeminiBatchEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .outputDimensionality(768)
    .titleMetadataKey("title")
    .maxRetries(3)
    .timeout(Duration.ofSeconds(30))
    .logRequestsAndResponses(true)
    .build();
```

### 重要な制約

- **サイズ制限**：インライン API は合計リクエストサイズ 20 MB 以下をサポートします
- **バッチサイズ**：最適なパフォーマンスのため、1 バッチあたり最大 100 セグメント
- **コスト**：バッチ処理はリアルタイムリクエストと比べて 50% のコスト削減になります
- **ターンアラウンド**：24 時間の SLO ですが、多くの場合それより早く完了します
- **ユースケース**：ドキュメント索引付けやセマンティック検索向けの大規模埋め込み生成に最適です

### 例：完全なワークフロー

```java
GoogleAiGeminiBatchEmbeddingModel batchModel = GoogleAiGeminiBatchEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .outputDimensionality(768)
    .build();

// Prepare batch of text segments
List<TextSegment> segments = new ArrayList<>();
for (int i = 0; i < 500; i++) {
    segments.add(TextSegment.from(
        "Document content #" + i,
        Metadata.from("title", "Document " + i)
    ));
}

// Submit batch
BatchResponse<Response<Embedding>> result = batchModel.submit(GeminiBatchRequest.from(
    segments, "Large Document Collection", 0L));
String batchId = result.batchId();

// Poll for completion
int attempts = 0;
int maxAttempts = 720; // 1 hour with 5-second intervals
while (!result.state().isTerminal()) {
    if (attempts++ >= maxAttempts) {
        throw new RuntimeException("Batch processing timeout");
    }
    Thread.sleep(5000);
    result = batchModel.retrieve(batchId);
    System.out.println("Status: " + result.state());
}

// Process results
if (result.state() == BatchState.SUCCEEDED) {
    List<Response<Embedding>> embeddings = result.responses();
    System.out.println("Generated " + embeddings.size() + " embeddings");

    // Store embeddings in your vector database
    for (int i = 0; i < embeddings.size(); i++) {
        Embedding embedding = embeddings.get(i).content();
        System.out.println("Embedding " + i + " has " + embedding.dimension() + " dimensions");
        // vectorStore.add(embedding, segments.get(i));
    }
} else {
    System.err.println("Batch did not succeed: " + result.state());
}
```

## リクエスト/レスポンス API と機能

上記の builder レベルの `taskType(...)` に加え、`GoogleAiEmbeddingModel` は呼び出しごとのパラメータ付きの
リクエスト/レスポンス API をサポートします。

- **呼び出しごとのパラメータ**：`input_type`（`EmbeddingInputType.QUERY` / `DOCUMENT`）により、2 つのモデルインスタンスを設定しなくても
  クエリとドキュメントを異なる方法で埋め込めます。`gemini-embedding-001` では
  Gemini の `RETRIEVAL_QUERY` / `RETRIEVAL_DOCUMENT` タスクタイプ経由で適用されます。Gemini Embedding 2 はタスクタイプ
  パラメータを受け付けないため、代わりにプロンプト指示として適用されます（クエリは `task: search result | query: ...`、
  ドキュメントは `title: none | text: ...`）。これは自動で行われます。
- **マルチモーダル**（`gemini-embedding-2-preview`、Gemini Embedding 2）：インターリーブされたテキスト + 画像を
  単一の埋め込みにネイティブ変換します。以前のモデル（例：`gemini-embedding-001`）はテキストのみです。画像は
  base64（`ImageContent`）で提供する必要があります。
- **リスナー**：`GoogleAiEmbeddingModel.builder().listeners(...)` で設定します。

リクエスト/レスポンス API とマルチモーダルの使い方は [埋め込みモデル](/tutorials/rag#embedding-model) を参照してください。

## 詳細情報

Google AI Gemini 埋め込みモデルについてさらに学ぶには、
[ドキュメント](https://ai.google.dev/gemini-api/docs/embeddings) を参照してください。
