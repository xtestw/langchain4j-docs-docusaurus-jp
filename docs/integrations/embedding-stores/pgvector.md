---
sidebar_position: 19
---

# PGVector

LangChain4j は [PGVector](https://github.com/pgvector/pgvector) とシームレスに統合され、開発者は
ベクトル埋め込みを PostgreSQL に直接保存・照会できます。この連携はセマンティック検索、
RAG などのアプリケーションに最適です。

## Maven依存関係

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-pgvector</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## Gradle依存関係

```implementation 'dev.langchain4j:langchain4j-pgvector:1.18.1-beta28'```

## API

- `PgVectorEmbeddingStore`

## パラメータ概要

| Plain Java プロパティ     | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                    | デフォルト値   | 必須/任意                                                                                                                                                                                                                                                                 |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `datasource`            | データベース接続に使用する `DataSource` オブジェクト。`PgVectorEmbeddingStore.datasourceBuilder()` ビルダーバリアントでのみ利用可能です。指定しない場合、`PgVectorEmbeddingStore.builder()` ビルダーバリアントで `host`、`port`、`user`、`password`、`database` を個別に指定する必要があります。                                                                                                                                                        | なし            | `host`、`port`、`user`、`password`、`database` を個別に指定しない場合は必須。                                                                                                                                                                                     |
| `host`                  | PostgreSQL サーバーのホスト名。`DataSource` を指定しない場合は必須。                                                                                                                                                                                                                                                                                                                                                                                   | なし            | `DataSource` を指定しない場合は必須                                                                                                                                                                                                                                          |
| `port`                  | PostgreSQL サーバーのポート番号。`DataSource` を指定しない場合は必須。                                                                                                                                                                                                                                                                                                                                                                                | なし            | `DataSource` を指定しない場合は必須                                                                                                                                                                                                                                          |
| `user`                  | データベース認証用のユーザー名。`DataSource` を指定しない場合は必須。                                                                                                                                                                                                                                                                                                                                                                                | なし            | `DataSource` を指定しない場合は必須                                                                                                                                                                                                                                          |
| `password`              | データベース認証用のパスワード。`DataSource` を指定しない場合は必須。                                                                                                                                                                                                                                                                                                                                                                                | なし            | `DataSource` を指定しない場合は必須                                                                                                                                                                                                                                          |
| `database`              | 接続するデータベース名。`DataSource` を指定しない場合は必須。                                                                                                                                                                                                                                                                                                                                                                                  | なし            | `DataSource` を指定しない場合は必須                                                                                                                                                                                                                                          |
| `table`                 | 埋め込みの保存に使用するデータベーステーブル名。                                                                                                                                                                                                                                                                                                                                                                                                    | なし            | 必須                                                                                                                                                                                                                                                                          |
| `dimension`             | 埋め込みベクトルの次元数。使用する埋め込みモデルと一致させる必要があります。動的に設定するには `embeddingModel.dimension()` を使用してください。                                                                                                                                                                                                                                                                                                         | なし            | 必須                                                                                                                                                                                                                                                                          |
| `useIndex`              | IVFFlat インデックスはベクトルをリストに分割し、クエリベクトルに最も近い一部のリストだけを検索します。HNSW よりビルドが速くメモリ使用量も少ない一方、クエリ性能（速度と再現率のトレードオフ）は劣ります。[IVFFlat](https://github.com/pgvector/pgvector#ivfflat) インデックスを使用すべきです。                                                                                                                                    | `false`         | 任意                                                                                                                                                                                                                                                                          |
| `indexListSize`         | IVFFlat インデックスのリスト数。                                                                                                                                                                                                                                                                                                                                                                                                                     | なし            | 必須になる場合: `useIndex` が `true` のとき、`indexListSize` を指定し、かつ 0 より大きい必要があります。そうでないとテーブル初期化時に例外が投げられます。任意の場合: `useIndex` が `false` ならこのプロパティは無視され、設定不要です。 |
| `createTable`           | 埋め込みテーブルを自動作成するかどうか。                                                                                                                                                                                                                                                                                                                                                                                                | `true`          | 任意                                                                                                                                                                                                                                                                          |
| `dropTableFirst`        | 再作成前にテーブルをドロップするかどうか（テスト向けに有用）。                                                                                                                                                                                                                                                                                                                                                                                   | `false`         | 任意                                                                                                                                                                                                                                                                          |
| `searchMode`            | 使用する検索モード。選択肢: <ul><li>**VECTOR**: コサイン距離を用いた標準的なベクトル類似度検索。</li><li>**HYBRID**: Reciprocal Rank Fusion（RRF）によりベクトル検索と全文キーワード検索を組み合わせる。</li></ul>                                                                                                                                                                                                                               | `VECTOR`        | 任意                                                                                                                                                                                                                                                                          |
| `rrfK`                  | RRF（Reciprocal Rank Fusion）アルゴリズムで使う定数 `k`: `Score = 1/(k + rank_vector) + 1/(k + rank_keyword)`。値が小さいほど（20–40）上位結果を強調し、大きいほど（80–100）よりバランスの取れたランキングになります。`searchMode` が `HYBRID` のときのみ意味があります。                                                                                                                                                                          | `60`            | 任意。HYBRID 検索モードでのみ使用。                                                                                                                                                                                                                                        |
| `textSearchConfig`      | キーワード検索に使う PostgreSQL テキスト検索設定名（例: `simple`、`english`、`german`）。`searchMode` が `HYBRID` のときのみ適用されます。                                                                                                                                                                                                                                                                                                  | `simple`        | 任意。HYBRID 検索モードでのみ使用。                                                                                                                                                                                                                                        |
| `metadataStorageConfig` | 埋め込みに関連するメタデータの扱いを設定するオブジェクト。3 つの保存モードをサポート: <ul><li>**COLUMN_PER_KEY**: メタデータキーが事前に分かる静的メタデータ向け。</li><li>**COMBINED_JSON**: キーが事前に分からない動的メタデータ向け。JSON として保存。（デフォルト）</li><li>**COMBINED_JSONB**: JSON と同様だが、大規模データセットでの照会を最適化するためバイナリ形式で保存。</li></ul> | `COMBINED_JSON` | 任意。未設定の場合、デフォルト設定として `COMBINED_JSON` が使われます。                                                                                                                                                                                                       |

## 例

PGVector の機能を示すため、Docker 化された PostgreSQL 環境を使えます。Testcontainers を利用して
PGVector 付き PostgreSQL を起動します。

#### Docker でのクイックスタート

PGVector 拡張入りの PostgreSQL インスタンスをすばやく立てるには、次の Docker コマンドを使えます:

```
docker run --rm --name langchain4j-postgres-test-container -p 5432:5432 -e POSTGRES_USER=my_user -e POSTGRES_PASSWORD=my_password pgvector/pgvector
```

#### コマンドの説明:

- ```docker run```: 新しいコンテナを実行します。
- ```--rm```: 停止後にコンテナを自動削除し、残データを残しません。
- ```--name langchain4j-postgres-test-container```: 識別しやすいようコンテナ名を langchain4j-postgres-test-container に
  します。
- ```-p 5432:5432```: ローカルマシンのポート 5432 をコンテナの 5432 にマップします。
- ```-e POSTGRES_USER=my_user```: PostgreSQL ユーザー名を my_user に設定します。
- ```-e POSTGRES_PASSWORD=my_password```: PostgreSQL パスワードを my_password に設定します。
- ```pgvector/pgvector```: PGVector 拡張があらかじめ設定された Docker イメージを指定します。

以下は `PgVectorEmbeddingStore` の作成例です。1 つ目は必須パラメータのみ、
2 つ目は利用可能な全パラメータを設定します。

1. 必須パラメータのみ

```java
EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        .host("localhost")                           // Required: Host of the PostgreSQL instance
        .port(5432)                                  // Required: Port of the PostgreSQL instance
        .database("postgres")                        // Required: Database name
        .user("my_user")                             // Required: Database user
        .password("my_password")                     // Required: Database password
        .table("my_embeddings")                      // Required: Table name to store embeddings
        .dimension(embeddingModel.dimension())       // Required: Dimension of embeddings
        .build();
```

2. 全パラメータ設定

このバリアントでは、useIndex、indexListSize、
createTable、dropTableFirst、metadataStorageConfig など、よく使う任意パラメータも含めます。必要に応じて値を調整してください:

 ```java
EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        // Required parameters
        .host("localhost")
        .port(5432)
        .database("postgres")
        .user("my_user")
        .password("my_password")
        .table("my_embeddings")
        .dimension(embeddingModel.dimension())

        // Optional parameters
        .useIndex(true)                             // Enable IVFFlat index
        .indexListSize(100)                         // Number of lists for IVFFlat index
        .createTable(true)                          // Automatically create the table if it doesn’t exist
        .dropTableFirst(false)                      // Don’t drop the table first (set to true if you want a fresh start)
        .metadataStorageConfig(MetadataStorageConfig.combinedJsonb()) // Store metadata as a combined JSONB column

        .build();
```

すばやく始めたい場合は 1 つ目の例を使ってください。
2 つ目の例は、より細かく制御・カスタマイズするために利用可能なビルダーパラメータをすべて活かす方法を示します。

## PGVector を使った完全な RAG 例

このセクションでは、セマンティック検索のために PGVector 拡張付き PostgreSQL を使い、完全な Retrieval-Augmented Generation（RAG）システムを構築する方法を示します。

### 概要

RAG システムは主に 2 つの段階から成ります:
1. **インデックス段階（オフライン）**: ドキュメントを読み込み、チャンクに分割し、埋め込みを生成して pgvector に保存
2. **検索段階（オンライン）**: ユーザークエリを埋め込み、類似チャンクを検索し、LLM プロンプトにコンテキストを注入

### 前提条件

PGVector 付き PostgreSQL インスタンスが起動していることを確認してください（上記の Docker セットアップを参照）。

### 1. ドキュメント取り込み（インデックス段階）

ドキュメントを読み込み、チャンクに分割し、埋め込みを pgvector に保存する例です:

```java
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentParser;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.document.parser.apache.pdfbox.ApachePdfBoxDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;

import static dev.langchain4j.data.document.loader.FileSystemDocumentLoader.loadDocument;

// Load document (PDF, TXT, etc.)
Document document = loadDocument("/path/to/document.pdf", new ApachePdfBoxDocumentParser());

// Split document into smaller chunks
// 300 tokens per chunk, 50 tokens overlap for context continuity
DocumentSplitter splitter = DocumentSplitters.recursive(300, 50);

// Create embedding model (384 dimensions for AllMiniLmL6V2)
EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();

// Create pgvector embedding store
EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        .host("localhost")
        .port(5432)
        .database("postgres")
        .user("my_user")
        .password("my_password")
        .table("document_embeddings")
        .dimension(embeddingModel.dimension())  // 384 for AllMiniLmL6V2
        .build();

// Ingest: split document, generate embeddings, and store in pgvector
EmbeddingStoreIngestor.builder()
        .documentSplitter(splitter)
        .embeddingModel(embeddingModel)
        .embeddingStore(embeddingStore)
        .build()
        .ingest(document);

System.out.println("Document ingested successfully!");
```

### 2. クエリ（検索段階）

ユーザーの質問で RAG システムに問い合わせる例です:

```java
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;

import java.util.List;
import java.util.stream.Collectors;

// User's question
String question = "What is the refund policy?";

// Generate embedding for the question
Embedding questionEmbedding = embeddingModel.embed(question).content();

// Search for the most similar text segments (top 3 results)
List<EmbeddingMatch<TextSegment>> relevantSegments = embeddingStore.findRelevant(
        questionEmbedding,
        3  // Retrieve top 3 most similar chunks
);

// Build context from retrieved segments
String context = relevantSegments.stream()
        .map(match -> match.embedded().text())
        .collect(Collectors.joining("\n\n"));

// Create prompt with retrieved context
String promptWithContext = String.format("""
        Answer the question based on the following context.
        If the context doesn't contain relevant information, say "I don't have enough information to answer."

        Context:
        %s

        Question: %s

        Answer:
        """, context, question);

// Send to LLM with context
ChatModel chatModel = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4")
        .build();

String answer = chatModel.generate(promptWithContext);
System.out.println("Answer: " + answer);
```

### 本番環境での考慮事項

実運用に基づき、本番デプロイで重要な考慮事項を挙げます:

#### 1. コネクションプーリング
本番環境では、個別の接続パラメータではなく、コネクションプーリング付きの `DataSource` を使ってください:

```java
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:postgresql://localhost:5432/postgres");
config.setUsername("my_user");
config.setPassword("my_password");
config.setMaximumPoolSize(10);

HikariDataSource dataSource = new HikariDataSource(config);

EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.datasourceBuilder()
        .datasource(dataSource)
        .table("document_embeddings")
        .dimension(384)
        .build();
```

#### 2. インデックス最適化
大規模データセット（埋め込み 10 万件超）では、クエリ性能向上のため IVFFlat インデックスを有効にしてください:

```java
EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        // ... other config ...
        .useIndex(true)
        .indexListSize(100)  // Adjust based on dataset size
        .build();
```

**注意**: 大規模データセットではインデックス作成に時間がかかることがあります。クエリ速度とインデックス構築時間のバランスを取ってください。

#### 3. メタデータ保存
大規模データセットでより良いクエリ性能を得るには、メタデータ保存に JSONB を使ってください:

```java
import dev.langchain4j.store.embedding.pgvector.MetadataStorageConfig;

EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        // ... other config ...
        .metadataStorageConfig(MetadataStorageConfig.combinedJsonb())
        .build();
```

#### 4. チャンクサイズの調整
ユースケースに応じて異なるチャンクサイズを試してください:
- **小さめのチャンク（200–300 トークン）**: 精度が高く、より具体的な回答
- **大きめのチャンク（500–800 トークン）**: より多くのコンテキストだが、関連性が下がる可能性

#### 5. エラー処理
データベース接続失敗は常に適切に処理してください:

```java
try {
    embeddingStore.add(embedding, textSegment);
} catch (Exception e) {
    logger.error("Failed to store embedding", e);
    // Implement retry logic or fallback behavior
}
```

### ハイブリッド検索（ベクトル + キーワード）

PGVector は、ベクトル類似度検索と PostgreSQL の全文キーワード検索を組み合わせた **ハイブリッド検索** をサポートします。セマンティック理解と正確なキーワード一致の両方を活かすため、ベクトルのみの検索より良い結果になることが多いです。

#### ハイブリッド検索を使うべき場合

- セマンティック類似度と正確なキーワード一致の両方が必要なとき
- ドメイン固有の用語、製品名、専門用語を含むクエリ向け
- RAG アプリケーションでの検索精度向上のため

#### 設定

`searchMode` パラメータを設定してハイブリッド検索を有効にします:

```java
import dev.langchain4j.store.embedding.pgvector.SearchMode;

EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        .host("localhost")
        .port(5432)
        .database("postgres")
        .user("my_user")
        .password("my_password")
        .table("document_embeddings")
        .dimension(embeddingModel.dimension())
        .searchMode(SearchMode.HYBRID)  // Enable hybrid search (default: SearchMode.VECTOR)
        .textSearchConfig("english")    // Optional: PostgreSQL text search config (default: "simple")
        .rrfK(60)    // Optional: RRF algorithm parameter (default: 60)
        .build();
```

#### 使い方

ハイブリッド検索を使うときは、埋め込みとクエリテキストの **両方** を渡す必要があります:

```java
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;

String question = "How to configure PostgreSQL vector search?";

// Generate embedding for the query
Embedding questionEmbedding = embeddingModel.embed(question).content();

// Search with both embedding and text (required for HYBRID mode)
EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(questionEmbedding)  // For vector similarity search
        .query(question)                    // For keyword search (REQUIRED in HYBRID mode)
        .maxResults(3)
        .build();

List<EmbeddingMatch<TextSegment>> results = embeddingStore.search(request);
```

#### 仕組み

ハイブリッド検索は **Reciprocal Rank Fusion（RRF）** で結果を結合します:

1. **ベクトル検索**: コサイン類似度でセマンティックに似たテキストを探す
2. **キーワード検索**: PostgreSQL の `tsvector` でキーワードが一致するテキストを探す
3. **RRF 融合**: 次の式でランキングを結合:

```
RRF_Score = 1/(k + rank_vector) + 1/(k + rank_keyword)
```

ここで:
- `k` は定数（`rrfK()` で設定可能、デフォルト: 60）
- `rank_vector` はベクトル検索での順位（1 = 最良の一致）
- `rank_keyword` はキーワード検索での順位（1 = 最良の一致）

**スコア計算の例**（テストで使われる k = 80）:

ドキュメントがベクトル検索・キーワード検索の両方で 1 位の場合:
```
Score = 1/(80+1) + 1/(80+1)
      = 1/81 + 1/81
      ≈ 0.0247
```

**スコア範囲の注意**
- 両検索で 1 位のときの最大スコアは `2/(k+1)`（例: k=60 → 約 0.0328、k=80 → 約 0.0247）。
- 順位が下がるにつれスコアは 0 に近づき、**1.0 には達しません**。
- RRF スコアは順位ベースであり、ベクトルのみ検索のコサイン類似度（0.0–1.0）と直接比較できません。

#### ベクトルのみ検索との主な違い

| 観点 | ベクトル検索 | ハイブリッド検索 |
|--------|--------------|---------------|
| **クエリ入力** | `queryEmbedding` のみ | `queryEmbedding` **および** `query` テキストの両方 |
| **スコア種別** | コサイン類似度（0.0–1.0） | RRF 順位ベーススコア（最大 `≈ 2/(k+1)`；k=60 で約 0.033） |
| **得意な用途** | セマンティック類似度、言い換え | 正確なキーワード + セマンティック意味 |

#### RRF パラメータの調整

`rrfK` パラメータを調整してランキング感度を制御します:

```java
.rrfK(40)   // More weight to top-ranked results (higher scores for top matches)
.rrfK(80)   // More balanced between top and lower-ranked results
```

- **小さい k（20–40）**: 上位結果をより強調
- **大きい k（80–100）**: よりバランスの取れたランキング分布
- **デフォルト（60）**: 多くのユースケースで良いバランス

### Spring Boot 統合

pgvector を Spring Boot マイクロサービスに統合した本番向けの完全な例については、
[pgvector RAG Spring Boot example](https://github.com/langchain4j/langchain4j-examples/tree/main/pgvector-rag-springboot) を参照してください。

この例では次を示します:
- PgVectorEmbeddingStore の Spring Boot 自動構成
- ドキュメント取り込みとクエリ用の REST API エンドポイント
- 適切なコネクションプーリングとエラー処理
- ローカル開発用の Docker Compose セットアップ

- [その他の例](https://github.com/langchain4j/langchain4j-examples/tree/main/pgvector-example/src/main/java)
