---
sidebar_position: 33
---

# CockroachDB

[CockroachDB](https://www.cockroachlabs.com/) は PostgreSQL ワイヤプロトコルを話す
分散 SQL データベースです。v24.2 以降、ネイティブの `VECTOR`
列型を備え、v25.2 以降は **C-SPANN** と呼ばれる分散近似最近傍
インデックスを提供します。`langchain4j-community-cockroachdb`
モジュールは両方を LangChain4j と統合し、次を提供します：

- ベクトル `EmbeddingStore<TextSegment>`（`CockroachDbEmbeddingStore`）
- `ChatMemoryStore`（`CockroachDbChatMemoryStore`）

この Java モジュールは、Java の同等機能が存在する範囲で、公式 Python
[`langchain-cockroachdb`](https://github.com/cockroachdb/langchain-cockroachdb)
ライブラリの機能セットをミラーしています。

## バージョン要件

| 機能 | 最低 CockroachDB バージョン |
| --- | --- |
| `VECTOR(n)` 列型 | v24.2 |
| `CREATE VECTOR INDEX`（C-SPANN） | v25.2 |
| `ttl_expiration_expression` による行レベル TTL | v23.1 |

CockroachDB v25.2 では、ベクトルインデックスはクラスター設定で制御されます。
`CSpannIndex` で store を作成する前に、クラスターごとに一度有効化してください：

```sql
SET CLUSTER SETTING feature.vector_index.enabled = true;
```

## Maven依存関係

:::note
CockroachDB サポートは `langchain4j-community` の一部であるため、
バージョン `1.18.1-beta28` 以降で利用可能になります。
:::

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-cockroachdb</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

Community BOM をインポートする場合は、バージョンを省略できます。

## API

このモジュールは 4 つの公開クラスを公開します：

### `CockroachDbEngine`

HikariCP `DataSource` をラップし、コネクションプーリングを処理します。個別の
`host`/`port`/`database`/`username`/`password` フィールド、完全な
接続文字列（Python スタイルの `cockroachdb://` スキームは自動的に
`jdbc:postgresql://` に書き換えられます）、または既存の `DataSource` から
`CockroachDbEngine.from(dataSource)` で構築できます。

### `CockroachDbSchema`

embedding テーブルレイアウトをカプセル化します：テーブル名と列名、ベクトル
次元、距離メトリクス、マルチテナンシー用のオプションの名前空間列、
選択されたベクトルインデックス戦略、および将来のハイブリッド検索向けの
オプションの生成 `tsvector` 列。

### `CockroachDbEmbeddingStore`

ネイティブの CockroachDB `VECTOR` 列に対して LangChain4j の
`EmbeddingStore<TextSegment>` を実装します。バッチ挿入、JSONB メタデータ
フィルタリング、id / `Filter` / 一括による削除、オプションの名前空間スコープ、
および C-SPANN 向けのオプションのクエリごとの `vector_search_beam_size` チューニングを
サポートします。

### `CockroachDbChatMemoryStore`

LangChain4j の `ChatMemoryStore` を実装します。シリアライズされたチャットメッセージを
明示的な挿入インデックスで順序付けられた JSONB 列に永続化し、オプションの
行レベル TTL をサポートします。

## 接続

`CockroachDbEngine` は `HikariDataSource` をラップします。接続文字列または
個別フィールドから構築できます。

```java
import dev.langchain4j.community.store.embedding.cockroachdb.CockroachDbEngine;

CockroachDbEngine engine = CockroachDbEngine.builder()
        .host("localhost")
        .port(26257)
        .database("defaultdb")
        .username("root")
        .password("")
        .sslMode("disable")
        .build();
```

ビルダーは完全な接続文字列も受け付けます。Python スタイルの
`cockroachdb://` スキームは自動的に `jdbc:postgresql://` に書き換えられるため、
Python ライブラリと同じ URL を貼り付けできます：

```java
CockroachDbEngine engine = CockroachDbEngine.fromConnectionString(
        "cockroachdb://root@localhost:26257/defaultdb?sslmode=disable");
```

すでに `DataSource` がある場合は、`CockroachDbEngine.from(dataSource)` を使用してください。

## ベクトルストア

最小のベクトルストアは逐次スキャン（`NoIndex`）を使用し、小規模なデータセットや
テストに適しています：

```java
import dev.langchain4j.community.store.embedding.cockroachdb.CockroachDbEmbeddingStore;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2q.AllMiniLmL6V2QuantizedEmbeddingModel;

EmbeddingModel model = new AllMiniLmL6V2QuantizedEmbeddingModel();

CockroachDbEmbeddingStore store = CockroachDbEmbeddingStore.builder()
        .engine(engine)
        .dimension(model.dimension())
        .tableName("embeddings")
        .build();

TextSegment segment = TextSegment.from("Cockroaches are surprisingly resilient.");
Embedding embedding = model.embed(segment).content();
store.add(embedding, segment);
```

CockroachDB v25.2+ の本番ワークロードでは、C-SPANN ベクトルインデックスを追加します：

```java
import dev.langchain4j.community.store.embedding.cockroachdb.index.CSpannIndex;

CockroachDbEmbeddingStore store = CockroachDbEmbeddingStore.builder()
        .engine(engine)
        .dimension(model.dimension())
        .vectorIndex(CSpannIndex.builder()
                .minPartitionSize(16)
                .maxPartitionSize(128)
                .build())
        .build();
```

インデックス用に発行される DDL は次のとおりです：

```sql
CREATE VECTOR INDEX IF NOT EXISTS embeddings_embedding_vector_idx
  ON public.embeddings (embedding)
  WITH (min_partition_size = 16, max_partition_size = 128);
```

C-SPANN はクエリ演算子から距離関数を選択します（コサインは `<=>`、
L2 は `<->`、内積は `<#>`）。そのため `MetricType` はインデックスに
バインドされず、クエリ時に store 上で選択されます。

### 検索

`EmbeddingSearchRequest` は他の LangChain4j store と同じように動作します：

```java
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;

EmbeddingSearchResult<TextSegment> result = store.search(
        EmbeddingSearchRequest.builder()
                .queryEmbedding(model.embed("resilience").content())
                .maxResults(5)
                .minScore(0.6)
                .build());

result.matches().forEach(m ->
        System.out.printf("%s (%.3f) %s%n", m.embeddingId(), m.score(), m.embedded().text()));
```

### クエリ時の C-SPANN チューニング

CockroachDB は再現率/レイテンシのトレードオフを制御するセッション変数
`vector_search_beam_size` を公開しています。store ビルダーで設定すると、
各検索が `SET LOCAL` で設定をスコープするトランザクションでラップされます：

```java
CockroachDbEmbeddingStore store = CockroachDbEmbeddingStore.builder()
        .engine(engine)
        .dimension(model.dimension())
        .vectorIndex(CSpannIndex.builder().build())
        .searchBeamSize(32)
        .build();
```

値を大きくするとレイテンシと引き換えに再現率が向上します。フィールドを未設定のままにすると、
デフォルトのビームサイズは CockroachDB によって決定されます。

### メタデータフィルタリング

メタデータは JSONB 列に保存され、クエリ時に LangChain4j の
`Filter` 式でフィルタリングされます：

```java
import dev.langchain4j.store.embedding.filter.MetadataFilterBuilder;

EmbeddingSearchResult<TextSegment> result = store.search(
        EmbeddingSearchRequest.builder()
                .queryEmbedding(query)
                .maxResults(10)
                .filter(MetadataFilterBuilder.metadataKey("category").isEqualTo("biology")
                        .and(MetadataFilterBuilder.metadataKey("year").isGreaterThan(2020)))
                .build());
```

比較フィルター（`>`、`>=`、`<`、`<=`）は JSONB 値を `numeric` にキャストします。
文字列の等価性は JSON テキストを比較します。フィルターキーには英数字、
ドット、アンダースコア、ハイフンのみを含められます。

### 名前空間列によるマルチテナンシー

テナントごとに行をスコープするには、スキーマに `namespaceColumn` を追加し、
各 store インスタンスに名前空間値を設定します。この列は C-SPANN インデックスの
プレフィックスとして追加され、テナントごとのクエリが高速に保たれます：

```java
CockroachDbEmbeddingStore tenantA = CockroachDbEmbeddingStore.builder()
        .engine(engine)
        .dimension(model.dimension())
        .namespaceColumn("tenant_id")
        .namespace("acme")
        .vectorIndex(CSpannIndex.builder().build())
        .build();
```

生成されるインデックスは `CREATE VECTOR INDEX ... ON embeddings (tenant_id, embedding)` となり、
この store 経由のすべての読み書きは `tenant_id = 'acme'` にフィルタリングされます。

### オプションの全文列

後でベクトル検索と全文検索を組み合わせる予定がある場合は、テーブル作成時に
生成 `tsvector` 列を有効にします。あわせて GIN インデックスが作成されます：

```java
CockroachDbEmbeddingStore store = CockroachDbEmbeddingStore.builder()
        .engine(engine)
        .dimension(model.dimension())
        .createTsvectorColumn(true)
        .build();
```

ハイブリッド（ベクトル + FTS）クエリ実行はまだ実装されていません。列は
アプリケーションコードまたは将来のリリースで使用できるよう作成されます。

## チャットメモリ

`CockroachDbChatMemoryStore` は `ChatMemoryStore` を実装し、シリアライズされた
チャットメッセージを挿入時刻で順序付けて JSONB 列に永続化します：

```java
import dev.langchain4j.community.store.memory.chat.cockroachdb.CockroachDbChatMemoryStore;

CockroachDbChatMemoryStore memory = CockroachDbChatMemoryStore.builder()
        .engine(engine)
        .tableName("chat_memory")
        .build();
```

スキーマは次のとおりです：

```sql
CREATE TABLE chat_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  message JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_memory_session_idx ON chat_memory (session_id, created_at);
```

`updateMessages` はトランザクション内でセッション全体を置き換えるため、
部分的な書き込みは読み取り側に見えません。

### 行レベル TTL

CockroachDB は行を自動的に期限切れにできます。チャットメモリテーブルで
[行レベル TTL](https://www.cockroachlabs.com/docs/stable/row-level-ttl) を有効にするには、
`ttl` の Duration を渡します：

```java
import java.time.Duration;

CockroachDbChatMemoryStore memory = CockroachDbChatMemoryStore.builder()
        .engine(engine)
        .tableName("chat_memory")
        .ttl(Duration.ofDays(7))
        .ttlJobCron("@daily")
        .build();
```

スキーマ設定は次を発行します：

```sql
ALTER TABLE chat_memory SET (
  ttl_expiration_expression = $$(created_at + '7 days')$$,
  ttl_job_cron = '@daily'
);
```

既存のテーブルで TTL を無効にするには：

```java
memory.disableTtl();
```

## リトライ

デフォルトの `SERIALIZABLE` 分離の下でトランザクションを再試行する必要がある場合、
CockroachDB は SQLSTATE `40001` を返します。store は各作業単位を指数バックオフと
ジッター付きのリトライループでラップします（デフォルト 5 回の試行、
100 ms から開始し、最大 10 秒まで倍増）。追加の設定は不要です。

## 接続文字列の形式

次の形式はすべて `CockroachDbEngine.fromConnectionString` で受け付けられます：

| 形式 | 例 |
| --- | --- |
| Python スタイル | `cockroachdb://root@localhost:26257/defaultdb?sslmode=disable` |
| psycopg スタイル | `cockroachdb+psycopg://user:pw@host:26257/db` |
| libpq スタイル | `postgresql://user@host:26257/db` |
| JDBC スタイル | `jdbc:postgresql://localhost:26257/defaultdb` |

CockroachDB Cloud では、クラスターコンソールの接続文字列を使用します。
通常は次の形式です：

```
cockroachdb://USER:PASSWORD@HOST:26257/DATABASE?sslmode=verify-full
```

## パラメータ概要

### `CockroachDbEngine` パラメータ

| パラメータ | 説明 | デフォルト | 必須/任意 |
| --- | --- | --- | --- |
| `host` | CockroachDB サーバーのホスト名 | `localhost` | 必須（`connectionString` がない場合） |
| `port` | CockroachDB サーバーのポート番号 | `26257` | 必須（`connectionString` がない場合） |
| `database` | 接続するデータベース | `defaultdb` | 必須（`connectionString` がない場合） |
| `username` | 認証用ユーザー名 | `root` | 必須 |
| `password` | 認証用パスワード | `""`（空） | 任意 |
| `schema` | デフォルトスキーマ名 | `public` | 任意 |
| `sslMode` | SSL モード（`disable`、`require`、`verify-full` など） | `disable` | 任意 |
| `maxPoolSize` | HikariCP の最大プールサイズ | `10` | 任意 |
| `minPoolSize` | 最小アイドル接続数 | `5` | 任意 |
| `connectionTimeoutMs` | 接続タイムアウト（ミリ秒） | `10000` | 任意 |
| `idleTimeoutMs` | アイドルタイムアウト（ミリ秒） | `300000` | 任意 |
| `maxLifetimeMs` | 最大接続寿命（ミリ秒） | `3600000` | 任意 |
| `connectionString` | 完全な URL。設定時は個別の host/port/db を上書き | `null` | 任意 |

### `CockroachDbEmbeddingStore` パラメータ

| パラメータ | 説明 | デフォルト | 必須/任意 |
| --- | --- | --- | --- |
| `engine` | `CockroachDbEngine` インスタンス | なし | **必須** |
| `dimension` | Embedding ベクトル次元 | なし | **必須** |
| `tableName` | Embedding テーブル名 | `embeddings` | 任意 |
| `schemaName` | データベーススキーマ名 | `public` | 任意 |
| `metricType` | 距離メトリクス：`COSINE`、`EUCLIDEAN`、または `DOT_PRODUCT` | `COSINE` | 任意 |
| `vectorIndex` | `CSpannIndex` または `NoIndex` | `NoIndex`（逐次スキャン） | 任意 |
| `namespaceColumn` | マルチテナンシー用テナント列名 | `null`（無効） | 任意 |
| `namespace` | すべての読み書きに適用されるテナント値 | `null` | 任意、`namespaceColumn` が必要 |
| `searchBeamSize` | クエリごとの `vector_search_beam_size` セッション変数 | `null`（CockroachDB デフォルト） | 任意 |
| `createTableIfNotExists` | ビルド時にテーブルを作成 | `true` | 任意 |
| `createTsvectorColumn` | 生成 `tsvector` 列 + GIN インデックスを追加 | `false` | 任意 |

### `CSpannIndex` パラメータ（CockroachDB v25.2+）

| パラメータ | 説明 | デフォルト | 必須/任意 |
| --- | --- | --- | --- |
| `name` | カスタムインデックス名 | `{table}_{column}_vector_idx` | 任意 |
| `minPartitionSize` | 最小パーティションサイズ（`WITH` 経由で発行） | CockroachDB デフォルト | 任意 |
| `maxPartitionSize` | 最大パーティションサイズ（`WITH` 経由で発行） | CockroachDB デフォルト | 任意 |

### `CockroachDbChatMemoryStore` パラメータ

| パラメータ | 説明 | デフォルト | 必須/任意 |
| --- | --- | --- | --- |
| `engine` | `CockroachDbEngine` インスタンス | なし | **必須** |
| `tableName` | チャット履歴テーブル名 | `message_store` | 任意 |
| `schemaName` | データベーススキーマ名 | `public` | 任意 |
| `ttl` | 行レベル TTL の Duration。設定時に CockroachDB TTL を有効化 | `null`（無効） | 任意 |
| `ttlJobCron` | TTL ジョブのスケジュール | `@daily` | 任意、`ttl` が必要 |
| `createTableIfNotExists` | ビルド時にテーブルを作成 | `true` | 任意 |

## 例

CockroachDB Testcontainer を起動し、2 つのテキストセグメントをインデックスして
類似度検索を実行する最小のエンドツーエンド RAG デモ：

```java
import dev.langchain4j.community.store.embedding.cockroachdb.CockroachDbEmbeddingStore;
import dev.langchain4j.community.store.embedding.cockroachdb.CockroachDbEngine;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import java.util.List;
import org.testcontainers.containers.CockroachContainer;

public class CockroachDbEmbeddingStoreExample {

    public static void main(String[] args) {
        try (CockroachContainer cockroach = new CockroachContainer("cockroachdb/cockroach:latest-v25.2")) {
            cockroach.start();

            CockroachDbEngine engine = CockroachDbEngine.builder()
                    .connectionString(cockroach.getJdbcUrl())
                    .username(cockroach.getUsername())
                    .password(cockroach.getPassword())
                    .build();

            EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();

            EmbeddingStore<TextSegment> embeddingStore = CockroachDbEmbeddingStore.builder()
                    .engine(engine)
                    .dimension(embeddingModel.dimension())
                    .tableName("demo_embeddings")
                    .build();

            TextSegment segment1 = TextSegment.from("I like football.");
            Embedding embedding1 = embeddingModel.embed(segment1).content();
            embeddingStore.add(embedding1, segment1);

            TextSegment segment2 = TextSegment.from("The weather is good today.");
            Embedding embedding2 = embeddingModel.embed(segment2).content();
            embeddingStore.add(embedding2, segment2);

            Embedding queryEmbedding = embeddingModel.embed("What is your favourite sport?").content();
            EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                    .queryEmbedding(queryEmbedding)
                    .maxResults(1)
                    .build();

            List<EmbeddingMatch<TextSegment>> matches = embeddingStore.search(request).matches();
            EmbeddingMatch<TextSegment> match = matches.get(0);

            System.out.println(match.score());           // ~0.81
            System.out.println(match.embedded().text()); // I like football.

            engine.close();
        }
    }
}
```

この例はデフォルトの逐次スキャンインデックスを使用するため、追加のクラスター設定なしで
任意の CockroachDB v24.2 以降で実行できます。v25.2 以降で C-SPANN 分散 ANN
インデックスに切り替えるには、クラスターごとに一度機能フラグを有効にし、
`.vectorIndex(...)` 経由で `CSpannIndex.builder().build()` を store に渡してください：

```sql
SET CLUSTER SETTING feature.vector_index.enabled = true;
```

より完全な実行可能なバージョンは
[langchain4j-examples/cockroachdb-example](https://github.com/langchain4j/langchain4j-examples/blob/main/cockroachdb-example/src/main/java/CockroachDbEmbeddingStoreExample.java)
にあります。

## 既知の制限事項

- C-SPANN ベクトルインデックスには CockroachDB v25.2 以降が必要で、
  `feature.vector_index.enabled` クラスター設定を有効にする必要があります。
- ベクトル値はテキストとして送信され、`?::vector` でキャストされます。これは
  CockroachDB の pgwire レイヤーが `VECTOR` 型のバイナリ形式を受け付けないためです。
- ハイブリッド（ベクトル + 全文）クエリ実行はまだ実装されていません。
  tsvector 列と GIN インデックスは `createTsvectorColumn` 経由で作成でき、
  アプリケーションコードまたは将来のリリースで使用できます。
- Python の `langchain-cockroachdb` ライブラリは LangGraph
  checkpointer（`CockroachDBSaver` および `AsyncCockroachDBSaver`）も提供します。
  Java の同等機能はサードパーティの [langgraph4j](https://github.com/langgraph4j/langgraph4j)
  プロジェクトに `langgraph4j-cockroachdb-saver` として存在します。langgraph4j の
  checkpoint コントラクトに非同期 API はないため、同期の `CockroachDBSaver` のみが
  提供されます。JDK 21 以降の呼び出し元は仮想スレッドから呼び出して
  非ブロッキングな並行処理を実現できます。
