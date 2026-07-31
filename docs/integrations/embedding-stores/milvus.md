---
sidebar_position: 14
---

# Milvus

[Milvus](https://milvus.io/) はオープンソースのベクトルデータベースです。LangChain4j はこれを
`EmbeddingStore` として使い、埋め込みを永続化して類似度検索を実行できます。

## 2 つの Milvus モジュール

現在 **2 つ** の独立した Milvus 連携モジュールがあり、併用可能です。

| モジュール | Milvus Java SDK | 機能 | ステータス |
|---|---|---|---|
| `langchain4j-milvus` | v1（`MilvusServiceClient`） | 密ベクトル検索 | レガシー。非推奨の v1 SDK 上に構築。 |
| `langchain4j-milvus-v2` | v2（`MilvusClientV2`） | 密 **+ 疎 + ハイブリッド** 検索（組み込み BM25 含む） | 現行。新規プロジェクト推奨。 |

:::note 移行期の命名——LangChain4j 2.0 で変更予定
`-v2` サフィックスは **Milvus SDK のバージョン** を指し、本モジュール自体のバージョンではありません。一時的な命名です。

**LangChain4j 2.0** では、レガシーの `langchain4j-milvus` モジュールは **削除** され、`langchain4j-milvus-v2`
は **`langchain4j-milvus` にリネーム** されます（Maven artifact、`...milvus.v2` パッケージ、`MilvusV2*`
クラス名からいずれも `v2` が外れます）。

今 `langchain4j-milvus-v2` を採用する場合、2.0 へのアップグレード時に Maven
座標、import、クラス名の更新が必要になります。移行ガイドは 2.0 リリース時に提供されます。

**新規プロジェクトでは `langchain4j-milvus-v2` を使用してください。**
:::

---

## `langchain4j-milvus-v2`（推奨）

現行の Milvus Java SDK v2 上に構築されています。密ベクトル検索、疎ベクトル検索、およびハイブリッド
（密 + 疎）検索をサポートします——Milvus 組み込みの BM25 全文疎ベクトルも含みます。

### Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-milvus-v2</artifactId>
    <version>1.19.0-beta29</version>
</dependency>
```

### API

- `MilvusV2EmbeddingStore`

### 基本的な使い方——密ベクトル検索

標準の `EmbeddingStore` の使い方です。検索モードのデフォルトは `VECTOR`（密のみ）です。

```java
MilvusV2EmbeddingStore store = MilvusV2EmbeddingStore.builder()
        .uri("http://localhost:19530")        // or .host("localhost").port(19530)
        .collectionName("my_collection")
        .dimension(384)                        // required when a new collection is created
        .build();

store.add(embedding, textSegment);

EmbeddingSearchResult<TextSegment> result = store.search(
        EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(5)
                .build());
```

### ハイブリッド検索（密 + 疎）

ハイブリッド検索は密ベクトル検索と疎ベクトル検索を組み合わせ、再ランカー
（デフォルトは Reciprocal Rank Fusion）で結果を統合します。`searchMode(HYBRID)` で有効化します。

疎ベクトルの生成方法は `sparseMode` で選びます：

- **`BM25`（デフォルト）** — Milvus がテキストから疎ベクトルを自動計算します。テキストを渡せば十分です。
- **`CUSTOM`** — 疎ベクトルを自分で渡します（例：BGE-M3 モデル）。

#### オプション A — 組み込み BM25（テキスト → 疎、Milvus が計算）

```java
MilvusV2EmbeddingStore store = MilvusV2EmbeddingStore.builder()
        .uri("http://localhost:19530")
        .collectionName("bm25_collection")
        .dimension(384)
        .searchMode(MilvusV2EmbeddingStore.SearchMode.HYBRID)
        .sparseMode(MilvusV2EmbeddingStore.MilvusSparseMode.BM25)   // default
        .build();

// Insert: only dense embeddings are needed; Milvus builds the BM25 sparse index from the text.
store.addAll(ids, denseEmbeddings, textSegments);

// Search: provide the dense query embedding and the query text (used for BM25).
MilvusV2EmbeddingSearchRequest request = MilvusV2EmbeddingSearchRequest.milvusBuilder()
        .queryEmbedding(queryDenseEmbedding)
        .query("full-text keywords here")
        .maxResults(10)
        .build();

EmbeddingSearchResult<TextSegment> result = store.search(request);
```

#### オプション B — カスタム疎ベクトル（例：BGE-M3）

```java
MilvusV2EmbeddingStore store = MilvusV2EmbeddingStore.builder()
        .uri("http://localhost:19530")
        .collectionName("hybrid_collection")
        .dimension(384)
        .searchMode(MilvusV2EmbeddingStore.SearchMode.HYBRID)
        .sparseMode(MilvusV2EmbeddingStore.MilvusSparseMode.CUSTOM) // you provide sparse vectors
        .build();

// Insert both dense and sparse embeddings.
List<SparseEmbedding> sparseEmbeddings = List.of(
        new SparseEmbedding(new long[]{1L, 42L, 300L}, new float[]{0.8f, 0.5f, 0.3f}),
        new SparseEmbedding(new long[]{7L, 99L},        new float[]{0.6f, 0.4f}));
store.addAllHybrid(ids, denseEmbeddings, sparseEmbeddings, textSegments);

// Search with a dense query embedding and a sparse query embedding.
MilvusV2EmbeddingSearchRequest request = MilvusV2EmbeddingSearchRequest.milvusBuilder()
        .queryEmbedding(queryDenseEmbedding)
        .sparseEmbedding(querySparseEmbedding)
        .maxResults(10)
        .build();

EmbeddingSearchResult<TextSegment> result = store.search(request);
```

:::note
検索モードは **コレクションスキーマ** の属性であり、ストア（およびコレクション）作成時に一度だけ設定します。
`HYBRID` コレクションは密と疎の両方のベクトルフィールドを持ち、`VECTOR` コレクションは密フィールドのみです。
両者は互換性がなく——モード切替には新しいコレクションが必要です。
:::

### Zilliz Cloud への接続

```java
MilvusV2EmbeddingStore store = MilvusV2EmbeddingStore.builder()
        .uri("https://xxx.api.gcp-us-west1.zillizcloud.com")
        .token("your-api-key")
        .collectionName("my_collection")
        .dimension(384)
        .build();
```

`.milvusClient(client)` で独自の `MilvusClientV2` インスタンスを渡すこともできます。

### 互換性

- Milvus Server **2.5.x 以降** を推奨（BM25 全文検索は 2.5+、ハイブリッド検索は 2.4+ が必要）。
- Java 17+

---

## `langchain4j-milvus`（レガシー）

Milvus Java SDK v1 上に構築されています。密ベクトル検索のみサポートします。LangChain4j 2.0 で削除予定です
（上記の注記を参照）。新規プロジェクトでは `langchain4j-milvus-v2` を優先してください。

### Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-milvus</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

### API

- `MilvusEmbeddingStore`

### 作成方法

`MilvusEmbeddingStore` の作成方法は 2 通りあります：

1. host、port、認証情報からストア内部で `MilvusServiceClient` を作成させる：

```java
MilvusEmbeddingStore store = MilvusEmbeddingStore.builder()
    .host("localhost")                         // Host for Milvus instance
    .port(19530)                               // Port for Milvus instance
    .collectionName("example_collection")      // Name of the collection
    .dimension(128)                            // Dimension of vectors
    .indexType(IndexType.FLAT)                 // Index type
    .metricType(MetricType.COSINE)             // Metric type
    .username("username")                      // Username for Milvus
    .password("password")                      // Password for Milvus
    .consistencyLevel(ConsistencyLevelEnum.EVENTUALLY)  // Consistency level
    .autoFlushOnInsert(true)                   // Auto flush after insert
    .idFieldName("id")                         // ID field name
    .textFieldName("text")                     // Text field name
    .metadataFieldName("metadata")             // Metadata field name
    .vectorFieldName("vector")                 // Vector field name
    .build();
```

2. 既存の `MilvusServiceClient` を渡す：

```java
// Set up a custom MilvusServiceClient
MilvusServiceClient customMilvusClient = new MilvusServiceClient(
    ConnectParam.newBuilder()
        .withHost("localhost")
        .withPort(19530)
        .build()
);

// Use the custom client in the builder
MilvusEmbeddingStore store = MilvusEmbeddingStore.builder()
    .milvusClient(customMilvusClient)          // Use an existing Milvus client
    .collectionName("example_collection")      // Name of the collection
    .dimension(128)                            // Dimension of vectors
    .indexType(IndexType.FLAT)                 // Index type
    .metricType(MetricType.COSINE)             // Metric type
    .consistencyLevel(ConsistencyLevelEnum.EVENTUALLY)  // Consistency level
    .autoFlushOnInsert(true)                   // Auto flush after insert
    .idFieldName("id")                         // ID field name
    .textFieldName("text")                     // Text field name
    .metadataFieldName("metadata")             // Metadata field name
    .vectorFieldName("vector")                 // Vector field name
    .build();
```

---

## 例

- [MilvusEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/milvus-example/src/main/java/MilvusEmbeddingStoreExample.java)
