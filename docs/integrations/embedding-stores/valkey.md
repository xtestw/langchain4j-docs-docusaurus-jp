---
sidebar_position: 31
---

# Valkey

https://valkey.io/


## Maven 依存関係

プレーン Java または Spring Boot アプリケーションで Valkey を LangChain4j と一緒に使用できます。

### プレーン Java

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-valkey</artifactId>
    <version>${latest version here}</version>
</dependency>
```

### Spring Boot

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-valkey-spring-boot-starter</artifactId>
    <version>${latest version here}</version>
</dependency>
```

または BOM を使って依存関係を一貫して管理できます：

```xml
<dependencyManagement>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-community-bom</artifactId>
        <version>${latest version here}</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
</dependencyManagement>
```


## 概要

`langchain4j-community-valkey` モジュールは、Valkey の組み込みベクトル検索機能（Valkey 8+）を使って
[Valkey](https://valkey.io/) を埋め込みストアとして統合します。

公式の [valkey-glide](https://github.com/valkey-io/valkey-glide) クライアントを使って Valkey サーバーに接続します。
埋め込み、テキスト、メタデータは構造化 JSON ドキュメントとして保存され、HNSW インデックスによりサブミリ秒の類似度検索を実現します。

### 前提条件

Valkey 9.1+ が必要です。`valkey-bundle` イメージには、ベクトルインデックスに必要な JSON と Search モジュールが含まれます。

```bash
docker run -d --name valkey -p 6379:6379 valkey/valkey-bundle:latest
```


## API

- `ValkeyEmbeddingStore`

### ValkeyEmbeddingStore の作成

```java
import dev.langchain4j.community.store.embedding.valkey.ValkeyEmbeddingStore;
import glide.api.GlideClient;
import glide.api.models.configuration.GlideClientConfiguration;
import glide.api.models.configuration.NodeAddress;

// 1. Create a GlideClient connection
GlideClientConfiguration config = GlideClientConfiguration.builder()
        .address(NodeAddress.builder().host("localhost").port(6379).build())
        .build();

GlideClient client = GlideClient.createClient(config).get();

// 2. Build the embedding store
ValkeyEmbeddingStore embeddingStore = ValkeyEmbeddingStore.builder()
        .client(client)
        .dimension(384)          // Must match your embedding model's output dimension
        .indexName("my-index")   // Optional, defaults to "embedding-index"
        .prefix("docs:")         // Optional, defaults to "embedding:"
        .build();
```

`build()` 時に、ストアは Valkey にインデックスが存在するかを確認します。なければ、HNSW インデックスと COSINE 距離メトリック（デフォルト）で作成します。

### 設定オプション

| Parameter | Description | Default |
|-----------|-------------|---------|
| `client` | `GlideClient` インスタンス（必須） | — |
| `dimension` | 埋め込みベクトル次元（インデックスが存在しない場合は必須） | — |
| `indexName` | Valkey 検索インデックス名 | `"embedding-index"` |
| `prefix` | 保存される埋め込みのキー接頭辞（末尾は `:` にする） | `"embedding:"` |
| `metadataKeys` | Tag フィールドとして永続化するメタデータキーのコレクション | — |
| `metadataConfig` | カスタムフィールド型のためのメタデータキーから `FieldInfo` へのマップ | — |
| `operationTimeoutSeconds` | 各 Valkey 操作のタイムアウト（秒） | `60` |

### 距離メトリック

Valkey は `MetricType` 列挙型経由で 3 つの距離メトリックをサポートします：

- `COSINE` — コサイン類似度（デフォルト）
- `IP` — 内積
- `L2` — ユークリッド距離

### 埋め込みの保存と検索

```java
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;

import java.util.List;

EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();

// Batch ingest
List<TextSegment> docs = List.of(
        TextSegment.from("Valkey is a high-performance in-memory data store."),
        TextSegment.from("Vector search finds similar items by embedding distance."),
        TextSegment.from("HNSW is an algorithm for approximate nearest neighbors.")
);
List<Embedding> embeddings = embeddingModel.embedAll(docs).content();
List<String> ids = embeddingStore.addAll(embeddings, docs);

// Search
Embedding queryEmbedding = embeddingModel.embed("How does similarity search work?").content();
EmbeddingSearchResult<TextSegment> results = embeddingStore.search(
        EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(3)
                .minScore(0.5)
                .build()
);

for (EmbeddingMatch<TextSegment> match : results.matches()) {
    System.out.printf("%.3f: %s%n", match.score(), match.embedded().text());
}
```

### メタデータフィルタリング

Valkey はメタデータに対して次のフィルタ型をサポートします：

- **数値フィールド**：`eq`、`neq`、`gt`、`gte`、`lt`、`lte`
- **Tag/Text フィールド**：`eq`、`neq`、`in`、`notIn`

メタデータフィルタリングを有効にするには、ストア構築時にメタデータフィールドを設定します。単純なタグベースのフィルタリングには `metadataKeys` を使います：

```java
ValkeyEmbeddingStore store = ValkeyEmbeddingStore.builder()
        .client(client)
        .dimension(384)
        .metadataKeys(List.of("category", "author"))
        .build();
```

型付きフィールド（例：数値 vs. タグ）には `metadataConfig` を使います：

```java
import glide.api.models.commands.FT.FTCreateOptions.FieldInfo;
import glide.api.models.commands.FT.FTCreateOptions.NumericField;
import glide.api.models.commands.FT.FTCreateOptions.TagField;

Map<String, FieldInfo> metadataConfig = Map.of(
        "category", new FieldInfo("$.category", "category", new TagField(',', true)),
        "year", new FieldInfo("$.year", "year", new NumericField())
);

ValkeyEmbeddingStore store = ValkeyEmbeddingStore.builder()
        .client(client)
        .dimension(384)
        .indexName("filtered-docs")
        .prefix("filtered:")
        .metadataConfig(metadataConfig)
        .build();
```

その後、検索リクエストでフィルタを使います：

```java
import static dev.langchain4j.store.embedding.filter.MetadataFilterBuilder.metadataKey;

// TAG filter
Filter securityFilter = metadataKey("category").isEqualTo("security");

// NUMERIC filter
Filter recentFilter = metadataKey("year").isGreaterThanOrEqualTo(2025);

// Combined AND filter
Filter combined = metadataKey("category").isEqualTo("security")
        .and(metadataKey("year").isGreaterThanOrEqualTo(2025));

// OR filter
Filter either = metadataKey("category").isEqualTo("security")
        .or(metadataKey("category").isEqualTo("performance"));

EmbeddingSearchResult<TextSegment> results = store.search(
        EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(5)
                .filter(combined)
                .build()
);
```


## 例

- [ValkeyEmbeddingStoreIT](https://github.com/langchain4j/langchain4j-community/blob/main/embedding-stores/langchain4j-community-valkey/src/test/java/dev/langchain4j/community/store/embedding/valkey/ValkeyEmbeddingStoreIT.java)
