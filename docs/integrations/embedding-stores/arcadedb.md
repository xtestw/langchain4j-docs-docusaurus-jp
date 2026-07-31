---
sidebar_position: 30
---

# ArcadeDB

https://arcadedb.com/

ArcadeDB は、グラフ、ドキュメント、キーバリュー、時系列、ベクトルデータをサポートするマルチモデル NoSQL データベースです。組み込みの LSM_VECTOR インデックス（JVector/HNSW 駆動）を提供し、高性能な近似最近傍（ANN）ベクトル検索を実現します。

langchain4j 統合は 2 つの動作モードをサポートします：

- **リモートモード** — HTTP 経由で ArcadeDB サーバーに接続します。本番デプロイメントや共有インフラに適しています。
- **組み込みモード** — 同一 JVM 内で ArcadeDB をプロセス内実行します。サーバーや Docker コンテナは不要で、データベースはローカルファイルシステムに保存されます。テスト、デスクトップアプリケーション、または単一プロセスのワークロードに理想的です。

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-arcadedb</artifactId>
    <version>${latest version here}</version>
</dependency>
```

注意：これはコミュニティ統合モジュールです。プロジェクト構成に langchain4j-community リポジトリを追加する必要がある場合があります。

## API

- `ArcadeDBEmbeddingStore`

## 機能

- **2 つの動作モード**：リモート（ArcadeDB サーバーへの HTTP クライアント）または組み込み（ArcadeDB がプロセス内で動作、サーバー不要）
- **マルチモデルデータベース**：embedding を ArcadeDB のグラフモデル内の頂点として保存し、ドキュメント、キーバリュー、時系列データと共存可能
- **HNSW ベクトルインデックス**：ArcadeDB の LSM_VECTOR インデックス（JVector ベース）を使用した高速近似最近傍検索
- **メタデータフィルタリング**：比較演算子と論理演算子を使用してメタデータで検索結果をフィルタリング
- **永続ストレージ**：リモートと組み込みの両モードで、再起動後もデータが保持される
- **自動スキーマ作成**：初回使用時に頂点タイプ、プロパティ、ベクトルインデックスを自動作成
- **複数の類似度関数**：COSINE（デフォルト）、EUCLIDEAN、SQUARED_EUCLIDEAN 距離メトリクスをサポート（リモートモード）
- **バッチ操作**：1 回の呼び出しで複数の embedding を追加
- **柔軟な削除**：ID 別、フィルター別、またはすべてクリアして embedding を削除

## 基本的な使い方

### リモートモード

リモートモードは稼働中の ArcadeDB サーバーに接続します。ローカルで起動するには [Docker で ArcadeDB を実行する](#running-arcadedb-with-docker) を参照してください。

#### 既存のデータベースに接続する

```java
EmbeddingStore<TextSegment> embeddingStore = ArcadeDBEmbeddingStore.builder()
    .host("localhost")
    .port(2480)
    .databaseName("my_database")
    .username("root")
    .password("playwithdata")
    .dimension(384)           // Must match your embedding model's dimension
    .build();
```

#### データベースを自動作成する

```java
EmbeddingStore<TextSegment> embeddingStore = ArcadeDBEmbeddingStore.builder()
    .host("localhost")
    .port(2480)
    .databaseName("my_database")
    .username("root")
    .password("playwithdata")
    .dimension(384)
    .createDatabase(true)     // Create database if it doesn't exist
    .build();
```

### 組み込みモード

組み込みモードは同一 JVM 内で ArcadeDB を実行します。サーバーは不要です — データベースを保存するローカルファイルシステム上のパスを指定するだけです。データベースがまだ存在しない場合は自動的に作成されます。

完了したら必ず `close()` を呼び出してリソースを解放してください。

```java
ArcadeDBEmbeddingStore embeddingStore = ArcadeDBEmbeddingStore.embeddedBuilder()
    .databasePath("/path/to/my-database")
    .dimension(384)           // Must match your embedding model's dimension
    .build();

// ... use the store ...

embeddingStore.close();
```

try-finally（またはラッパー経由の try-with-resources）を使用して、必ず `close()` が呼び出されるようにしてください：

```java
ArcadeDBEmbeddingStore embeddingStore = ArcadeDBEmbeddingStore.embeddedBuilder()
    .databasePath("/path/to/my-database")
    .dimension(384)
    .build();
try {
    // ... use the store ...
} finally {
    embeddingStore.close();
}
```

### Embedding の追加と検索

検索 API は両モードで同一です：

```java
// Add a text segment with its embedding
TextSegment segment = TextSegment.from("Hello, world!", Metadata.from("source", "example"));
Embedding embedding = embeddingModel.embed(segment).content();
embeddingStore.add(embedding, segment);

// Search for similar embeddings
EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
    .queryEmbedding(queryEmbedding)
    .maxResults(5)
    .minScore(0.7)
    .build();

List<EmbeddingMatch<TextSegment>> matches = embeddingStore.search(request).matches();
```

## 設定オプション

### リモートモード

```java
EmbeddingStore<TextSegment> embeddingStore = ArcadeDBEmbeddingStore.builder()
    .host("localhost")              // Required: ArcadeDB server hostname
    .port(2480)                     // Default: 2480 (HTTP port)
    .databaseName("my_database")   // Required: database name
    .username("root")               // Required: username
    .password("playwithdata")       // Required: password
    .typeName("EmbeddingDocument") // Default: "EmbeddingDocument" — vertex type name
    .dimension(384)                 // Required: embedding vector dimension
    .similarityFunction("COSINE")  // Default: "COSINE" — similarity metric
    .maxConnections(16)             // Default: 16 — HNSW graph connections per node
    .beamWidth(100)                 // Default: 100 — HNSW search beam width
    .createDatabase(false)          // Default: false — auto-create the database
    .metadataPrefix("meta_")       // Default: "meta_" — prefix for metadata properties
    .build();
```

### 組み込みモード

```java
ArcadeDBEmbeddingStore embeddingStore = ArcadeDBEmbeddingStore.embeddedBuilder()
    .databasePath("/path/to/my-database") // Required: local filesystem path for the database
    .typeName("EmbeddingDocument")        // Default: "EmbeddingDocument" — vertex type name
    .dimension(384)                        // Default: 384 — embedding vector dimension
    .maxConnections(16)                    // Default: 16 — HNSW graph connections per node
    .beamWidth(100)                        // Default: 100 — HNSW search beam width
    .metadataPrefix("")                    // Default: "" (no prefix) — prefix for metadata properties
    .build();
```

### パラメータのガイドライン

**共有パラメータ（両モード）：**

- **typeName**：embedding ドキュメントを保存するために使用される頂点タイプ。これを変更すると、同一データベース内で複数の embedding store を使用できます
- **dimension**：embedding モデルの出力次元と正確に一致させる必要があります
- **maxConnections**：HNSW インデックス内のグラフ接続性を制御します。値を大きくすると再現率が向上しますが、メモリとインデックス構築時間が増加します。推奨：16–128
- **beamWidth**：HNSW インデックス構築と検索の品質を制御します。値を大きくすると速度と引き換えに再現率が向上します。推奨：100–500
- **metadataPrefix**：メタデータキーを頂点プロパティとして保存するときに適用される接頭辞。メタデータキーが組み込みプロパティと衝突する場合は変更してください

**リモート専用パラメータ：**

- **host**：ArcadeDB サーバーのホスト名または IP アドレス（必須）
- **port**：ArcadeDB REST API の HTTP ポート（デフォルト：2480）
- **databaseName**：接続または作成するデータベース（必須）
- **username / password**：ArcadeDB 認証情報（必須）
- **similarityFunction**：
  - `COSINE` — コサイン類似度；正規化ベクトルに最適（デフォルト）
  - `EUCLIDEAN` — ユークリッド距離
  - `SQUARED_EUCLIDEAN` — 二乗ユークリッド距離；EUCLIDEAN より高速
- **createDatabase**：`true` に設定すると、データベースが存在しない場合に自動作成します

**組み込み専用パラメータ：**

- **databasePath**：組み込みデータベースが保存されるディレクトリへのパス。存在しない場合は自動作成されます
- **database**：あるいは、パスの代わりに既存の `com.arcadedb.database.Database` インスタンスを直接指定します

## メタデータフィルタリング

ArcadeDB はメタデータによる検索結果のフィルタリングをサポートします。フィルターはベクトルインデックス検索の後に適用されます。

```java
// Filter by a single metadata value
Filter filter = new IsEqualTo("source", "wikipedia");

EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
    .queryEmbedding(queryEmbedding)
    .maxResults(5)
    .filter(filter)
    .build();

List<EmbeddingMatch<TextSegment>> matches = embeddingStore.search(request).matches();
```

### サポートされるフィルタータイプ

**比較演算子：**
- `IsEqualTo`、`IsNotEqualTo`
- `IsGreaterThan`、`IsGreaterThanOrEqualTo`
- `IsLessThan`、`IsLessThanOrEqualTo`
- `IsIn`、`IsNotIn`

**論理演算子：**
- `And`、`Or`、`Not`

## 削除操作

```java
// Remove by list of IDs
embeddingStore.removeAll(List.of("id1", "id2"));

// Remove by metadata filter
embeddingStore.removeAll(new IsEqualTo("source", "old-source"));

// Remove all embeddings
embeddingStore.removeAll();
```

## 現在の制限事項

- **近似検索**：HNSW インデックスは近似です。ほぼ同一のベクトルを多数含む非常に大きな結果セットでは、一部のドキュメントが返されない場合があります
- **インメモリでのフィルター適用**：メタデータフィルターはインデックスレベルではなく、ベクトル検索後にインメモリで適用されます。フィルターによる削減を見込んで、store は要求件数の最大 5 倍の結果を取得します
- **浮動小数点精度**：ArcadeDB はベクトルを JSON の double として返すため、元の保存値と比較してわずかな浮動小数点精度の差が生じる場合があります。`Double.MIN_VALUE`（4.9E-324）は 0.0 にアンダーフローし、正確に保存できません
- **文字列コンテンツフィルターなし**：文字列ベースのコンテンツフィルター（例：`ContainsString`）はサポートされていません。上記のメタデータフィルタータイプのみ利用可能です
- **組み込みモードでは類似度関数を選択不可**：組み込みビルダーは `similarityFunction` オプションを公開しません。インデックスはデフォルトのメトリクスを使用します

## Docker で ArcadeDB を実行する

リモートモードで必要です。最速の始め方：

```bash
docker run -d \
  --name arcadedb \
  -p 2480:2480 \
  -e JAVA_OPTS="-Darcadedb.server.rootPassword=playwithdata" \
  arcadedata/arcadedb:latest
```

その後、store を接続します：

```java
EmbeddingStore<TextSegment> embeddingStore = ArcadeDBEmbeddingStore.builder()
    .host("localhost")
    .port(2480)
    .databaseName("embeddings")
    .username("root")
    .password("playwithdata")
    .dimension(384)
    .createDatabase(true)
    .build();
```

## 例

- 統合テストの例については、[langchain4j-community-arcadedb モジュール](https://github.com/langchain4j/langchain4j-community/tree/main/embedding-stores/langchain4j-community-arcadedb/src/test/java) のテストファイルを確認してください
- [langchain4j-examples プロジェクト](https://github.com/langchain4j/langchain4j-examples) にもいくつかの例があります
