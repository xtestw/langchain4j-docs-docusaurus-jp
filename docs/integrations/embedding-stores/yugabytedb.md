---
sidebar_position: 25
---

# YugabyteDB

[YugabyteDB](https://www.yugabyte.com/) は、PostgreSQL 互換性を備え、複数リージョンにわたる水平スケーラビリティと高可用性を提供する分散 SQL データベースです。`pgvector` 拡張によるネイティブなベクトル検索機能により、分散環境でのベクトル埋め込みの保存とクエリに適しています。

## Maven 依存関係

:::note
YugabyteDB サポートは `langchain4j-community` の一部であるため、バージョン `1.18.1-beta28` 以降で利用可能になります。
:::

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-yugabytedb</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```


## API

YugabyteDB 統合は主に次の 3 つのクラスを提供します。

### `YugabyteDBEmbeddingStore`

ベクトル埋め込みの保存と検索を行うメインのインターフェースです。LangChain4j の `EmbeddingStore` インターフェースを実装し、次のメソッドを提供します。
- 埋め込みの追加（単一またはバッチ）
- 類似埋め込みの検索
- 埋め込みの削除
- メタデータによるフィルタリング

### `YugabyteDBEngine`

HikariCP を使用してデータベース接続とコネクションプーリングを管理します。このクラスは次を行います。
- JDBC 接続設定の処理
- コネクションプール設定の管理（最大プールサイズ、タイムアウトなど）
- PostgreSQL JDBC ドライバーと YugabyteDB Smart Driver の両方をサポート
- SSL/TLS 設定オプションの提供

### `YugabyteDBSchema`

次を含むデータベーススキーマ設定を定義します。
- テーブル名とカラム名
- ベクトルインデックスの種類（HNSW または NoIndex）
- 距離メトリクス（COSINE、EUCLIDEAN、DOT_PRODUCT）
- メタデータ保存設定
- テーブル作成設定

## 使用例

### 基本的な YugabyteDBEmbeddingStore

`YugabyteDBEmbeddingStore` インスタンスの作成方法は次のとおりです。

```java
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .<builderParameters>
    .build();
```

`<builderParameters>` には `dimension` と `engine` が必須で、その他はオプションです。

## パラメータ概要

### YugabyteDBEngine パラメータ

| パラメータ | 説明 | デフォルト値 | 必須/オプション |
| --- | --- | --- | --- |
| `host` | YugabyteDB サーバーのホスト名 | `localhost` | engine builder 使用時は必須 |
| `port` | YugabyteDB サーバーのポート番号 | `5433` | engine builder 使用時は必須 |
| `database` | 接続するデータベース名 | `yugabyte` | engine builder 使用時は必須 |
| `username` | データベース認証用ユーザー名 | `yugabyte` | engine builder 使用時は必須 |
| `password` | データベース認証用パスワード | `""`（空） | engine builder 使用時は必須 |
| `schema` | データベーススキーマ名 | `public` | オプション |
| `usePostgreSQLDriver` | YugabyteDB Smart Driver の代わりに PostgreSQL JDBC ドライバーを使用 | `false` | オプション |
| `useSsl` | データベース接続で SSL/TLS を有効化 | `false` | オプション |
| `sslMode` | SSL モード設定 | `disable` | オプション |
| `maxPoolSize` | プール内の最大接続数 | `10` | オプション |
| `minPoolSize` | プール内の最小アイドル接続数 | `5` | オプション |
| `connectionTimeout` | 接続タイムアウト（ミリ秒） | `10000` | オプション |
| `idleTimeout` | アイドルタイムアウト（ミリ秒） | `300000` | オプション |
| `maxLifetime` | 接続の最大生存時間（ミリ秒） | `900000` | オプション |
| `applicationName` | 接続識別用のアプリケーション名 | `langchain4j-yugabytedb` | オプション |

### YugabyteDBEmbeddingStore パラメータ

| パラメータ | 説明 | デフォルト値 | 必須/オプション |
| --- | --- | --- | --- |
| `engine` | データベース接続用の `YugabyteDBEngine` インスタンス | なし | **必須** |
| `dimension` | 埋め込みベクトルの次元数。使用する埋め込みモデルと一致させる必要があります。動的に設定するには `embeddingModel.dimension()` を使用します。 | なし | **必須** |
| `tableName` | 埋め込み保存用のデータベーステーブル名 | `langchain4j_embeddings` | オプション |
| `schemaName` | データベーススキーマ名 | `public` | オプション |
| `idColumn` | ID カラム名 | `id` | オプション |
| `contentColumn` | コンテンツ/テキストカラム名 | `content` | オプション |
| `embeddingColumn` | 埋め込みベクトルカラム名 | `embedding` | オプション |
| `metadataColumn` | メタデータカラム名 | `metadata` | オプション |
| `metricType` | 類似度検索の距離メトリクス：`COSINE`、`EUCLIDEAN`、または `DOT_PRODUCT` | `COSINE` | オプション |
| `vectorIndex` | ベクトルインデックス設定（下記のインデックス設定を参照） | デフォルト設定の `HNSWIndex` | オプション |
| `createTableIfNotExists` | 埋め込みテーブルを自動作成するかどうか | `true` | オプション |
| `metadataStorageConfig` | 埋め込みに関連するメタデータ処理用の設定オブジェクト。次の 3 つの保存モードをサポートします：<br/>• `COMBINED_JSONB`：クエリ最適化向けに JSONB 形式で動的メタデータを保存（推奨）<br/>• `COMBINED_JSON`：JSON として動的メタデータを保存<br/>• `COLUMN_PER_KEY`：メタデータキーを事前に把握している場合の静的メタデータ向け | `COMBINED_JSONB` | オプション |

### インデックス設定

#### HNSW インデックスパラメータ

| パラメータ | 説明 | デフォルト値 | 必須/オプション |
| --- | --- | --- | --- |
| `m` | レイヤーあたりの最大接続数。値が高いほど再現率が上がりますが、メモリ使用量も増えます | `16` | オプション |
| `efConstruction` | 構築時の動的候補リストのサイズ。値が高いほどインデックス品質が上がりますが、構築は遅くなります | `64` | オプション |
| `metricType` | 距離メトリクス：`COSINE`、`EUCLIDEAN`、または `DOT_PRODUCT` | `COSINE` | オプション |
| `name` | カスタムインデックス名 | 自動生成 | オプション |

#### NoIndex

インデックスなしのシーケンシャルスキャンには `new NoIndex()` を使用します。小規模データセット（< 10,000 ベクトル）や正確な結果が必要な場合に最適です。

### 基本的な使い方

```java
// Create engine first
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .usePostgreSQLDriver(true) // Use PostgreSQL JDBC driver
    .build();

// Minimal configuration
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .build();

// Custom configuration
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(768)
    .tableName("my_embeddings")
    .metricType(MetricType.EUCLIDEAN)
    .build();
```

### YugabyteDBEngine の使用

接続設定をより細かく制御するには、`YugabyteDBEngine` を使用します。

```java
// Create engine with custom settings
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .maxPoolSize(20)
    .minPoolSize(5)
    .connectionTimeout("30000")
    .idleTimeout("300000")
    .maxLifetime("900000")
    .useSsl(false)
    .usePostgreSQLDriver(false) // Use YugabyteDB Smart Driver
    .build();

// Use engine in embedding store
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .tableName("embeddings")
    .build();
```

### ベクトルインデックス設定

YugabyteDB は類似度検索の最適化のため、異なるベクトルインデックスタイプをサポートします。

#### HNSW インデックス（推奨）

```java
// Create engine
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .build();

// HNSW index with custom parameters
HNSWIndex hnswIndex = HNSWIndex.builder()
    .m(16)                    // Maximum connections per layer
    .efConstruction(64)       // Construction quality
    .metricType(MetricType.COSINE)
    .name("my_hnsw_index")
    .build();

YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .vectorIndex(hnswIndex)
    .build();
```

#### インデックスなし（シーケンシャルスキャン）

```java
// Create engine
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .build();

// No index for exact search (slower but exact)
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .vectorIndex(new NoIndex()) // Sequential scan
    .build();
```

### 埋め込みの追加と検索

```java
// Create engine first
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .build();

// Create embedding store
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .build();

// Add embeddings
TextSegment segment1 = TextSegment.from("YugabyteDB is a distributed SQL database");
Embedding embedding1 = embeddingModel.embed(segment1).content();
String id1 = store.add(embedding1, segment1);

TextSegment segment2 = TextSegment.from("PostgreSQL compatibility with horizontal scalability");
Embedding embedding2 = embeddingModel.embed(segment2).content();
String id2 = store.add(embedding2, segment2);

// Search embeddings
Embedding queryEmbedding = embeddingModel.embed("What is YugabyteDB?").content();
EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
    .queryEmbedding(queryEmbedding)
    .maxResults(5)
    .minScore(0.7)
    .build();

List<EmbeddingMatch<TextSegment>> matches = store.search(request).matches();
matches.forEach(match -> {
    System.out.println("Score: " + match.score());
    System.out.println("Text: " + match.embedded().text());
});
```

### メタデータ保存設定

YugabyteDB は異なるメタデータ保存モードをサポートします。

```java
// Create engine
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .build();

// JSONB storage (recommended for PostgreSQL compatibility)
MetadataStorageConfig jsonbConfig = MetadataStorageConfig.builder()
    .storageMode(MetadataStorageMode.COMBINED_JSONB)
    .build();

// JSON storage
MetadataStorageConfig jsonConfig = MetadataStorageConfig.builder()
    .storageMode(MetadataStorageMode.COMBINED_JSON)
    .build();

// Column-per-key storage
MetadataStorageConfig columnConfig = MetadataStorageConfig.builder()
    .storageMode(MetadataStorageMode.COLUMN_PER_KEY)
    .build();

YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .metadataStorageConfig(jsonbConfig)
    .build();
```

### ドライバー設定

YugabyteDB は PostgreSQL JDBC ドライバーと YugabyteDB Smart Driver の両方をサポートします。

```java
// PostgreSQL JDBC Driver (standard SQL compatibility)
YugabyteDBEngine postgresEngine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .usePostgreSQLDriver(true)
    .build();

YugabyteDBEmbeddingStore postgresStore = YugabyteDBEmbeddingStore.builder()
    .engine(postgresEngine)
    .dimension(384)
    .build();

// YugabyteDB Smart Driver (advanced distributed features)
YugabyteDBEngine smartEngine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .usePostgreSQLDriver(false) // Default: use Smart Driver
    .build();

YugabyteDBEmbeddingStore smartStore = YugabyteDBEmbeddingStore.builder()
    .engine(smartEngine)
    .dimension(384)
    .build();
```


## インデックスタイプ

### HNSW（ybhnsw）— 推奨

- **最適な用途**：ほとんどのユースケース、特に大規模データセット
- **パフォーマンス**：高い再現率を伴う高速な近似類似度検索
- **パラメータ**：
  - `m`（デフォルト：16）：レイヤーあたりの最大接続数
  - `efConstruction`（デフォルト：64）：構築品質

### NoIndex — シーケンシャルスキャン

- **最適な用途**：小規模データセット（< 10,000 ベクトル）、または正確な結果が必要な場合
- **パフォーマンス**：正確な検索ですが、データセットの成長に伴い遅くなります

## 既知の制限

- ベクトル操作には YugabyteDB で `pgvector` 拡張を有効にする必要があります
- 同一テーブル内のすべての埋め込みでベクトル次元は一致している必要があります
- HNSW インデックスパラメータ（`m`、`efConstruction`）はパフォーマンスとメモリ使用量の両方に影響します
- シーケンシャルスキャン（NoIndex）は小規模データセット（< 10,000 ベクトル）にのみ推奨されます

## パフォーマンスの考慮事項

- **HNSW インデックス**：大規模データセットの本番利用に最適で、高速な近似検索を提供します
- **NoIndex**：小規模データセット、または正確な結果が必要な場合にのみ適します
- **コネクションプーリング**：ワークロードに応じて `maxPoolSize` と `minPoolSize` を設定してください
- **ドライバーの選択**：互換性向上のため、YugabyteDB は PostgreSQL JDBC ドライバーを推奨しています

## 例

- [YugabyteDBEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/yugabytedb-example/src/main/java/YugabyteDBEmbeddingStoreExample.java) - Testcontainers を使った基本例
- [YugabyteDBEmbeddingStoreWithMetadataExample](https://github.com/langchain4j/langchain4j-examples/blob/main/yugabytedb-example/src/main/java/YugabyteDBEmbeddingStoreWithMetadataExample.java) - JSONB 保存によるメタデータフィルタリング
- [YugabyteDBWithPostgreSQLDriverExample](https://github.com/langchain4j/langchain4j-examples/blob/main/yugabytedb-example/src/main/java/YugabyteDBWithPostgreSQLDriverExample.java) - PostgreSQL JDBC ドライバーの使用
- [YugabyteDBWithSmartDriverExample](https://github.com/langchain4j/langchain4j-examples/blob/main/yugabytedb-example/src/main/java/YugabyteDBWithSmartDriverExample.java) - YugabyteDB Smart Driver の使用
