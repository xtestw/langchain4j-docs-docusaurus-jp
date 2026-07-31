---
sidebar_position: 19
---

# Hibernate

LangChain4j は [Hibernate](https://github.com/hibernate/hibernate-orm) とシームレスに統合され、開発者は Hibernate がサポートするすべてのデータベースにベクトル埋め込みを直接保存およびクエリできます。この統合は、セマンティック検索、RAG などのアプリケーションに最適です。

## Maven 依存関係

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-hibernate</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## Gradle 依存関係

```implementation 'dev.langchain4j:langchain4j-hibernate:1.18.1-beta28'```

## API

- `HibernateEmbeddingStore`

## パラメータ概要

### 汎用ストア

エンティティクラスの定義や Hibernate の設定など、Hibernate 固有の詳細を気にせずに `EmbeddingStore` API だけを使用したい場合、この種のストアが推奨されます。

設定するには、`HibernateEmbeddingStore.dynamicBuilder()` または `HibernateEmbeddingStore.dynamicDatasourceBuilder()` を使用します。

| プレーン Java プロパティ | 説明                                                                                                                                                                                                                                                                                                                                                                                    | デフォルト値 | 必須/オプション                                                                                                                                                                                                                                                                                                                            |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `datasource`        | データベース接続に使用する `DataSource` オブジェクト。`HibernateEmbeddingStore.dynamicDatasourceBuilder()` ビルダーバリアントでのみ利用可能。提供されない場合、`jdbcUrl`、`user`、`password` を `HibernateEmbeddingStore.dynamicBuilder()` ビルダーバリアントで個別に提供する必要があります。                                                                                          | なし          | `jdbcUrl`、`user`、`password` が個別に提供されない場合は必須。                                                                                                                                                                                                                                                                  |
| `jdbcUrl`           | データベースサーバーの JDBC URL。`DataSource` および `host`、`port`、`database` が提供されない場合は必須。`HibernateEmbeddingStore.dynamicBuilder()` ビルダーバリアントでのみ利用可能。                                                                                                                                                                                                   | なし          | `DataSource` または `host`、`port`、`database` が提供されない場合は必須                                                                                                                                                                                                                                                                      |
| `host`              | データベースサーバーのホスト名。`DataSource` も `jdbcUrl` も提供されない場合は必須。`HibernateEmbeddingStore.dynamicBuilder()` ビルダーバリアントでのみ利用可能。                                                                                                                                                                                                             | なし          | `DataSource` も `jdbcUrl` も提供されない場合は必須                                                                                                                                                                                                                                                                               |
| `port`              | データベースサーバーのポート番号。`DataSource` も `jdbcUrl` も提供されない場合は必須。`HibernateEmbeddingStore.dynamicBuilder()` ビルダーバリアントでのみ利用可能。                                                                                                                                                                                                          | なし          | `DataSource` も `jdbcUrl` も提供されない場合は必須                                                                                                                                                                                                                                                                               |
| `database`          | 接続するデータベースの名前。`DataSource` も `jdbcUrl` も提供されない場合は必須。`HibernateEmbeddingStore.dynamicBuilder()` ビルダーバリアントでのみ利用可能。                                                                                                                                                                                                          | なし          | `DataSource` も `jdbcUrl` も提供されない場合は必須                                                                                                                                                                                                                                                                               |
| `databaseKind`      | データベースの種類。`DataSource` が提供されている場合、または種類を `jdbcUrl` から推測できない場合は必須。                                                                                                                                                                                                                                                                                      | なし          | `DataSource` が提供されている場合、または種類を `jdbcUrl` から推測できない場合は必須                                                                                                                                                                                                                                                        |
| `user`              | データベース認証のユーザー名。`DataSource` が提供されない場合は必須。`HibernateEmbeddingStore.dynamicBuilder()` ビルダーバリアントでのみ利用可能。                                                                                                                                                                                                                              | なし          | `DataSource` が提供されない場合は必須                                                                                                                                                                                                                                                                                                     |
| `password`          | データベース認証のパスワード。`DataSource` が提供されない場合は必須。`HibernateEmbeddingStore.dynamicBuilder()` ビルダーバリアントでのみ利用可能。                                                                                                                                                                                                                              | なし          | `DataSource` が提供されない場合は必須                                                                                                                                                                                                                                                                                                     |
| `table`             | 埋め込みの保存に使用するデータベーステーブルの名前。                                                                                                                                                                                                                                                                                                                                    | なし          | 必須                                                                                                                                                                                                                                                                                                                                     |
| `dimension`         | 埋め込みベクトルの次元数。使用している埋め込みモデルと一致させる必要があります。`embeddingModel.dimension()` を使用して動的に設定できます。                                                                                                                                                                                                                                         | なし          | 必須                                                                                                                                                                                                                                                                                                                                     |
| `createIndex`       | ベクトル埋め込みのインデックスを自動作成するかどうかを指定します。                                                                                                                                                                                                                                                                                                                   | `false`       | オプション                                                                                                                                                                                                                                                                                                                                     |
| `indexType`         | データベース固有のインデックスタイプ（例: `ivfflat`、`hnsw`）。IVFFlat インデックスはベクトルをリストに分割し、クエリベクトルに最も近いリストのサブセットを検索します。HNSW よりビルド時間が短くメモリ使用量も少ないですが、クエリ性能は低くなります（速度と再現率のトレードオフ）。[IVFFlat](https://github.com/pgvector/pgvector#ivfflat) インデックスを使用すべきです。 | なし          | オプション。デフォルトは優先インデックスタイプ（例: PostgreSQL 上の `ivfflat`）                                                                                                                                                                                                                                                                  |
| `indexOptions`      | ベクトル埋め込みのインデックスに設定するオプション。                                                                                                                                                                                                                                                                                                                                | なし          | 必須の場合: `createIndex` が `true` でインデックスタイプが `ivfflat` の場合、PostgreSQL では `lists = 1` オプションを提供し、ゼロより大きい必要があります。そうでない場合、テーブル初期化中に例外がスローされます。オプションの場合: `createIndex` が `false` の場合、このプロパティは無視され、設定する必要はありません。 |
| `createTable`       | 埋め込みテーブルを自動作成するかどうかを指定します。                                                                                                                                                                                                                                                                                                                                | `false`       | オプション                                                                                                                                                                                                                                                                                                                                     |
| `dropTableFirst`    | 再作成前にテーブルをドロップするかどうかを指定します（テストに有用）。                                                                                                                                                                                                                                                                                                                   | `false`       | オプション                                                                                                                                                                                                                                                                                                                                     |
| `distanceFunction`  | ベクトル検索に使用する距離関数。サポートはデータベースによって異なります: <ul><li>**COSINE**</li><li>**EUCLIDEAN**</li><li>**EUCLIDEAN_SQUARED**</li><li>**MANHATTAN**</li><li>**INNER_PRODUCT**</li><li>**NEGATIVE_INNER_PRODUCT**</li><li>**HAMMING**</li><li>**JACCARD**</li></ul>                                                                                                 | `COSINE`      | オプション。設定されていない場合、`COSINE` を使用するデフォルト設定が使用されます。                                                                                                                                                                                                                                                                         |

### エンティティストア

既存の Hibernate エンティティモデルを `EmbeddingStore` API で活用する場合、またはデータモデルのカスタマイズを適用する場合は、エンティティストアが推奨されます。

設定するには、`HibernateEmbeddingStore.builder()` を使用します。

| プレーン Java プロパティ             | 説明                                                                                                                                                                                                                                                                                    | デフォルト値 | 必須/オプション                                                                                                                                                                                        |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sessionFactory`                | `entityClass` が含まれる `SessionFactory` オブジェクト。                                                                                                                                                                                                                                | なし          | 必須                                                                                                                                                                                                 |
| `databaseKind`                  | データベースの種類。Hibernate ORM ダイアレクトから種類を推測できない場合は必須。                                                                                                                                                                                                          | なし          | Hibernate ORM ダイアレクトから種類を推測できない場合は必須                                                                                                                                        |
| `entityClass`                   | `EmbeddingStore` に使用する `SessionFactory` のエンティティクラスを指定します。                                                                                                                                                                                                            | なし          | 必須                                                                                                                                                                                                 |
| `embeddingAttributeName`        | ベクトル埋め込みを表すエンティティ属性の名前を指定します。                                                                                                                                                                                                               | なし          | オプション。設定されていない場合、`@EmbeddingVector` でアノテーションされた属性をエンティティからスキャンします                                                                                                           |
| `embeddedTextAttributeName`     | ベクトル埋め込みのソーステキストを表すエンティティ属性の名前を指定します。                                                                                                                                                                                            | なし          | オプション。設定されていない場合、`@EmbeddedText` でアノテーションされた属性をエンティティからスキャンします                                                                                                              |
| `unmappedMetadataAttributeName` | 未マップのメタデータが保存される JSON 列を表すエンティティ属性の名前を指定します。                                                                                                                                                                                  | なし          | オプション。設定されていない場合、`@UnmappedMetadata` でアノテーションされた属性をエンティティからスキャンします                                                                                                          |
| `metadataAttributeNames`        | テキストメタデータに明示的にマップされるエンティティ属性の名前を指定します。                                                                                                                                                                                                      | なし          | オプション。設定されていない場合、`@MetadataAttribute` でアノテーションされた属性をエンティティからスキャンします                                                                                                         |
| `distanceFunction`              | ベクトル検索に使用する距離関数。サポートはデータベースによって異なります: <ul><li>**COSINE**</li><li>**EUCLIDEAN**</li><li>**EUCLIDEAN_SQUARED**</li><li>**MANHATTAN**</li><li>**INNER_PRODUCT**</li><li>**NEGATIVE_INNER_PRODUCT**</li><li>**HAMMING**</li><li>**JACCARD**</li></ul> | `COSINE`      | オプション。設定されていない場合、`@EmbeddingVector` でアノテーションされた属性をスキャンしてその `distance` 値を使用し、それがない場合は `COSINE` を使用するデフォルト設定が使用されます。 |

## 例

機能を示すために、例えば Docker 化された PostgreSQL セットアップを使用できます。Testcontainers を活用して PGVector 付きの PostgreSQL を実行します。

#### Docker によるクイックスタート

PGVector 拡張機能付きの PostgreSQL インスタンスをすばやくセットアップするには、次の Docker コマンドを使用できます。

```
docker run --rm --name langchain4j-postgres-test-container -p 5432:5432 -e POSTGRES_USER=my_user -e POSTGRES_PASSWORD=my_password pgvector/pgvector
```

#### コマンドの説明:

- ```docker run```: 新しいコンテナを実行します。
- ```--rm```: 停止後にコンテナを自動削除し、残留データを残しません。
- ```--name langchain4j-postgres-test-container```: 識別しやすいようにコンテナに langchain4j-postgres-test-container という名前を付けます。
- ```-p 5432:5432```: ローカルマシンのポート 5432 をコンテナ内のポート 5432 にマップします。
- ```-e POSTGRES_USER=my_user```: PostgreSQL のユーザー名を my_user に設定します。
- ```-e POSTGRES_PASSWORD=my_password```: PostgreSQL のパスワードを my_password に設定します。
- ```pgvector/pgvector```: 使用する Docker イメージを指定します。PGVector 拡張機能が事前設定されています。

`HibernateEmbeddingStore` を作成する 2 つのコード例を示します。1 つ目は必須パラメータのみを使用し、2 つ目は利用可能なすべてのパラメータを設定します。

1. 必須パラメータのみ

```java
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.dynamicBuilder()
        .databaseKind(DatabaseKind.POSTGRESQL)                  // Required: The database kind
        .host("localhost")                                      // Required: Host of the database server
        .port(5432)                                             // Required: Port of the database server
        .database("postgres")                                   // Required: Database name
        .user("my_user")                                        // Required: Database user
        .password("my_password")                                // Required: Database password
        .table("my_embeddings")                                 // Required: Table name to store embeddings
        .dimension(embeddingModel.dimension())                  // Required: Dimension of embeddings
        .build();
```

2. すべてのパラメータを設定

このバリアントでは、createIndex、indexOptions、createTable、dropTableFirst、distanceFunction などのよく使われるオプションパラメータをすべて含めます。必要に応じてこれらの値を調整してください。

 ```java
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.dynamicBuilder()
        // Required parameters
        .databaseKind(DatabaseKind.POSTGRESQL)
        .host("localhost")
        .port(5432)
        .database("postgres")
        .user("my_user")
        .password("my_password")
        .table("my_embeddings")
        .dimension(embeddingModel.dimension())

        // Optional parameters
        .createIndex(true)                              // Enable vector index creation
        .indexType("ivfflat")                           // Index type IVFFlat
        .indexOptions("lists = 100")                    // Number of lists for IVFFlat index
        .createTable(true)                              // Automatically create the table if it doesn’t exist
        .dropTableFirst(false)                          // Don’t drop the table first (set to true if you want a fresh start)
        .distanceFunction(DistanceFunction.MANHATTEN)   // Use MANHATTAN distance function for vector search

        .build();
```

すばやく始めるための最小構成が必要な場合は、最初の例を使用してください。
2 つ目の例は、利用可能なすべてのビルダーパラメータを活用して、より多くの制御とカスタマイズを行う方法を示します。

不要になったら `HibernateEmbeddingStore` を閉じることを忘れないでください。これにより、基盤となる Hibernate リソースが閉じられます。

#### カスタム Hibernate エンティティ

データモデルをカスタマイズしたい場合、または既存のエンティティを `EmbeddingStore` のソースとして再利用したい場合は、アノテーション `@EmbeddingVector`、`@EmbeddedText`、`@UnmappedMetadata`、`@MetadataAttribute` を使用して、Hibernate `EmbeddingStore` 実装が使用するエンティティ属性をマークできます。 

```java
@Entity
public class MyEmbeddingEntity {
    @Id
    UUID id;
    @EmbeddingVector
    @Array(length = 384)                // The dimension of the embedding vector based on the embedding model
    float[] embedding;
    @EmbeddedText
    String text;
    @UnmappedMetadata
    Map<String, Object> metadata;       // Can be either a Map<String, Object> or a String
    
    @MetadataAttribute
    String mimeType;                    // Explicitly mapped. Synchronizes TextSegment#metadata with this attribute
    @MetadataAttribute
    String fileName;                    // Explicitly mapped. Synchronizes TextSegment#metadata with this attribute
}
```

ビルダーはこれらのアノテーションを探し、属性名を導出します。

```java
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.builder()
        .sessionFactory(sessionFactory)         // Required: The SessionFactory containing your entity class
        .entityClass(MyEmbeddingEntity.class)   // Required: The embedding entity class
        .build();
```

あるいは、エンティティモデルにアノテーションを付けたくない場合は、属性名を明示的に提供することもできます。

```java
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.builder()
        .sessionFactory(sessionFactory)
        .entityClass(MyEmbeddingEntity.class)
        .embeddingAttributeName("embedding")
        .embeddedTextAttributeName("text")
        .unmappedMetadataAttributeName("metadata")
        .metadataAttributeNames("mimeType", "fileName")
        .build();
```

メタデータは、同様に `@MetadataAttribute` でアノテーションされた `@OneToOne`、`@ManyToOne`、または `@Embedded` 属性内にネストすることもできます。または、`.`（ドット）区切りで明示的な属性パスを指定することもできます。

```java
@Entity
public class Book {
    @Id
    private Long id;
    private String title;
    private String content;
    @MetadataAttribute
    @Embedded
    private BookDetails details = new BookDetails();
    @MetadataAttribute
    @ManyToOne(fetch = FetchType.LAZY)
    private Author author;

    @EmbeddingVector
    @Array(length = 384)
    private float[] embedding;
    @UnmappedMetadata
    private Map<String, Object> metadata;
}
@Entity
public class Author {
    @Id
    @MetadataAttribute
    @GeneratedValue
    private Long id;
    private String firstname;
    private String lastname;
}
@Embeddable
public class BookDetails {
    @MetadataAttribute
    private String language;
    private String abstractText;
}
```

同等の属性パスは `details.language` と `author.id` であり、これらのパスをメタデータキーとして指定することでフィルタリングに使用できます。例:

```java
MetadataFilterBuilder.metadataKey("details.language").isEqualTo("English")
```

または

```java
MetadataFilterBuilder.metadataKey("author.id").isEqualTo(2L)
```

あるいは、`HibernateEmbeddingStore` API は、型安全な Hibernate ORM の `Restriction` API を使用できる `search` メソッドも提供します。

```java
HibernateEmbeddingStore<Book> embeddingStore = embeddingStore();
embeddingStore.search(
        embedding,
        Path.from(Book.class)
            .to(Book_.details)
            .to(BookDetails_.language)
            .equalTo("English"));
```

または

```java
HibernateEmbeddingStore<Book> embeddingStore = embeddingStore();
embeddingStore.search(
        embedding,
        Path.from(Book.class)
            .to(Book_.author)
            .to(Author_.id)
            .equalTo(2L));
```

## Hibernate を使用した完全な RAG 例

このセクションでは、Hibernate 統合と PGVector 拡張機能付きの PostgreSQL を使用して、セマンティック検索のための完全な Retrieval-Augmented Generation（RAG）システムを構築する方法を示します。

### 概要

RAG システムは 2 つの主要なステージで構成されます。
1. **インデックス作成ステージ（オフライン）**: ドキュメントを読み込み、チャンクに分割し、埋め込みを生成して pgvector に保存
2. **検索ステージ（オンライン）**: ユーザークエリを埋め込み、類似チャンクを検索し、コンテキストを LLM プロンプトに注入

### 前提条件

PGVector 付きの PostgreSQL インスタンスが実行中であることを確認してください（上記の Docker セットアップを参照）。

### 1. ドキュメント取り込み（インデックス作成ステージ）

この例では、ドキュメントを読み込み、チャンクに分割し、埋め込みを pgvector に保存する方法を示します。

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
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.dynamicBuilder()
        .databaseKind(DatabaseKind.POSTGRESQL)
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

### 2. クエリ（検索ステージ）

この例では、ユーザーの質問で RAG システムをクエリする方法を示します。

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
EmbeddingSearchResult<TextSegment> result = embeddingStore.search(
        EmbeddingSearchRequest.builder()
                .queryEmbedding(questionEmbedding)
                .maxResults(3)  // Retrieve top 3 most similar chunks
                .build()
);

// Build context from retrieved segments
String context = result.matches().stream()
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

実世界での使用に基づく、本番デプロイメント向けの重要な考慮事項を以下に示します。

#### 1. コネクションプーリング
本番環境では、個別の接続パラメータではなく、コネクションプーリング付きの `DataSource` を使用してください。

```java
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:postgresql://localhost:5432/postgres");
config.setUsername("my_user");
config.setPassword("my_password");
config.setMaximumPoolSize(10);

HikariDataSource dataSource = new HikariDataSource(config);

EmbeddingStore<TextSegment> embeddingStore = HibernateEmbeddingStore.dynamicDatasourceBuilder()
        .databaseKind(DatabaseKind.POSTGRESQL)
        .datasource(dataSource)
        .table("document_embeddings")
        .dimension(384)
        .build();
```

#### 2. インデックスの最適化
大規模データセット（埋め込み数が 10 万超）では、クエリ性能を向上させるために PostgreSQL で IVFFlat インデックスを有効にしてください。

```java
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.dynamicBuilder()
        // ... other config ...
        .createIndex(true)
        .indexOptions("lists = 100")  // Adjust based on dataset size
        .build();
```

**注意**: 大規模データセットでのインデックス作成には時間がかかることがあります。クエリ速度とインデックスビルド時間のバランスを取ってください。
**注意**: インデックスのメンテナンスはデータ取り込みを遅くする可能性があるため、大量のデータを取り込む際はインデックスを削除して再作成することを検討してください。

#### 3. チャンクサイズの調整
ユースケースに基づいて異なるチャンクサイズを試してください。
- **小さいチャンク（200〜300 トークン）**: より高い精度、より具体的な回答
- **大きいチャンク（500〜800 トークン）**: より多くのコンテキスト、ただし関連性が低下する可能性

#### 4. エラーハンドリング
データベース接続の失敗は常に適切に処理してください。

```java
try {
    embeddingStore.add(embedding, textSegment);
} catch (Exception e) {
    logger.error("Failed to store embedding", e);
    // Implement retry logic or fallback behavior
}
```

#### 5. カスタム Hibernate エンティティの DDL
カスタム Hibernate エンティティを使用する場合、DDL の管理はあなたが担当します。
インデックスを作成するために `import.sql` ファイルを作成することを検討してください。例（PostgreSQL）:

```sql
create index if not exists my_entity_ivfflat_index 
    on my_entity using ivfflat(embedding vector_cosine_ops) with (lists = 1);
```

`SessionFactory` の設定の詳細については、[Hibernate ORM ドキュメント](https://docs.hibernate.org/orm/7.2/userguide/html_single/) を参照してください。

他のデータベースのベクトルインデックスは、構文とオプションが異なります。詳細については、各データベースプロバイダーのドキュメントを参照してください。

##### DB2

詳細については、[ベクトルインデックスの記事](https://community.ibm.com/community/user/blogs/christian-garcia-arellano/2025/10/04/vector-indexes-in-db2-an-early-preview) を参照してください。

```sql
create vector index my_entity_vector_index 
    on my_entity(embedding) with distance cosine;
```

##### MariaDB

詳細については、[`create index` ステートメントのドキュメント](https://mariadb.com/docs/server/reference/sql-statements/data-definition/create/create-index) を参照してください。

```sql
create vector index if not exists my_entity_vector_index 
    on my_entity(embedding) distance=cosine;
```

##### MySQL

MySQL HeatWave は[インデックスを自動作成](https://dev.mysql.com/doc/heatwave/en/mys-hw-genai-vector-index-creation.html)するため、手動でのインデックス作成は不要です。

##### PostgreSQL

詳細については、[pgvector ドキュメント](https://github.com/pgvector/pgvector?tab=readme-ov-file#indexing) を参照してください。

```sql
create index if not exists my_entity_ivfflat_index
    on my_entity using ivfflat(embedding vector_cosine_ops) with (lists = 1);
```

##### CockroachDB

詳細については、[CockroachDB ドキュメント]([https://github.com/pgvector/pgvector?tab=readme-ov-file#indexing](https://www.cockroachlabs.com/docs/v26.2/vector-indexes)) を参照してください。

```sql
create vector index if not exists my_entity_ivfflat_index
    on my_entity (embedding vector_cosine_ops);
```

##### Oracle

詳細については、[`create index` ステートメントのドキュメント](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/create-vector-index.html) を参照してください。

```sql
create vector index my_entity_vector_index 
    on my_entity(embedding) organization neighbor partitions with distance cosine;
```

##### SQL Server

詳細については、[`create vector index` ステートメントのドキュメント](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-vector-index-transact-sql?view=sql-server-ver17) を参照してください。

```sql
create vector index my_entity_vector_index 
    on my_entity(embedding) with (metric='cosine');
```

##### SAP HANA

詳細については、[`create vector index` ステートメントのドキュメント]([https://learn.microsoft.com/en-us/sql/t-sql/statements/create-vector-index-transact-sql?view=sql-server-ver17](https://help.sap.com/docs/hana-cloud-database/sap-hana-cloud-sap-hana-database-sql-reference-guide/create-vector-index-statement-data-definition?locale=en-US)) を参照してください。

```sql
create hnsw vector index my_entity_vector_index 
    on my_entity(embedding) with similarity function cosine_similarity;
```
