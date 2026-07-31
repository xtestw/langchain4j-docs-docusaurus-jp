---
sidebar_position: 15
---

# MongoDB Atlas

[MongoDB Atlas](https://www.mongodb.com/docs/atlas/) は、AWS、Azure、GCP で利用できる
フルマネージドのクラウドデータベースです。MongoDB のドキュメントデータに対する
ネイティブな Vector Search と全文検索（BM25 アルゴリズム）をサポートしています。

[Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
機能を使うと、埋め込みを MongoDB ドキュメントに保存し、ベクトル検索インデックスを作成し、
Hierarchical Navigable Small Worlds と呼ばれる近似最近傍アルゴリズムで
KNN 検索を実行できます。
LangChain4j の MongoDB 統合は、内部的に
[`$vectorSearch`](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/#mongodb-pipeline-pipe.-vectorSearch)
集約ステージを使用して Atlas Vector Search を実装しています。

LangChain4j と組み合わせて Atlas Vector Search を使い、データに対するセマンティック検索を行い、
シンプルな RAG 実装を構築できます。これらの作業を行う完全なチュートリアルについては、
MongoDB Atlas ドキュメントの
[Get Started with the LangChain4j Integration](https://www.mongodb.com/docs/atlas/atlas-vector-search/ai-integrations/langchain4j/)
チュートリアルを参照してください。

## 前提条件

Atlas Vector Search を使用するには、デプロイメントで次のいずれかの MongoDB Server バージョンが
稼働している必要があります。

-   6.0.11 以降
-   7.0.2 以降

MongoDB は永久無料のクラスターを提供しています。アカウントの設定とデプロイメントへの接続について
詳しくは、[Get Started with Atlas](https://www.mongodb.com/docs/atlas/getting-started/)
チュートリアルを参照してください。

また、埋め込みモデルを提供する LLM サービス（例:
[Voyage AI](https://www.voyageai.com/)、無料枠あり）のクレジット付き API キーも必要です。
RAG アプリケーションでは、チャットモデル機能を持つサービス（例:
[OpenAI](https://openai.com/api/) や
[HuggingFace](https://huggingface.co/) のモデル）の API キーも必要です。

## 環境とインストール

1. お好みの IDE で新しい Java アプリケーションを作成します。
2. LangChain4j と MongoDB Java Sync Driver をインストールするため、
   次の依存関係をアプリケーションに追加します。

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-mongodb-atlas</artifactId>
</dependency>
<dependency>
    <groupId>org.mongodb</groupId>
    <artifactId>mongodb-driver-sync</artifactId>
    <version>5.4.0</version>
</dependency>
```

埋め込みモデル用の依存関係もインストールする必要があります。例として
Voyage AI:

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-voyage-ai</artifactId>
</dependency>
```

LangChain4j BOM の追加も推奨します:

```xml
<dependencyManagement>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-bom</artifactId>
        <version>1.18.1-beta28</version>
        <type>pom</type>
    </dependency>
</dependencyManagement>
```

## MongoDB Atlas を Embedding Store として使う

1. [埋め込みモデル](https://docs.langchain4j.dev/category/embedding-models)をインスタンス化します。
2. MongoDB Atlas を埋め込みストアとしてインスタンス化します。

`MongoDbEmbeddingStore` インスタンスをビルドする際、`createIndex()` メソッドに `true` を渡すと、
自動インデックス作成を有効にできます。

```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.voyageai.VoyageAiEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.filter.comparison.*;
import dev.langchain4j.store.embedding.mongodb.IndexMapping;
import dev.langchain4j.store.embedding.mongodb.MongoDbEmbeddingStore;
import org.bson.Document;

import java.io.*;
import java.util.*;

String embeddingApiKey = System.getenv("VOYAGE_AI_KEY");
String uri = System.getenv("MONGODB_URI");

EmbeddingModel embeddingModel = VoyageAiEmbeddingModel.builder()
        .apiKey(embeddingApiKey)
        .modelName("voyage-3")
        .build();

MongoClient mongoClient = MongoClients.create(uri);

System.out.println("Instantiating the embedding store...");

// Set to false if the vector index already exists
Boolean createIndex = true;

IndexMapping indexMapping = IndexMapping.builder()
        .dimension(embeddingModel.dimension())
        .metadataFieldNames(new HashSet<>())
        .build();

MongoDbEmbeddingStore embeddingStore = MongoDbEmbeddingStore.builder()
        .databaseName("search")
        .collectionName("langchaintest")
        .createIndex(createIndex)
        .indexName("vector_index")
        .indexMapping(indexMapping)
        .fromClient(mongoClient)
        .build();
```

## データを MongoDB に保存する

次のコードは、ドキュメントを埋め込みストアに永続化する方法を示します。
`embed()` メソッドは、ドキュメント内の `text` フィールド値に対する埋め込みを生成します。

```java
ArrayList<Document> docs = new ArrayList<>();

docs.add(new Document()
        .append("text", "Penguins are flightless seabirds that live almost exclusively below the equator. Some island-dwellers can be found in warmer climates.")
        .append("metadata", new Metadata(Map.of("website", "Science Direct"))));

docs.add(new Document()
        .append("text", "Emperor penguins are amazing birds. They not only survive the Antarctic winter, but they breed during the worst weather conditions on earth.")
        .append("metadata", new Metadata(Map.of("website", "Our Earth"))));

docs.add(...);

System.out.println("Persisting document embeddings...");

for (Document doc : docs) {
    TextSegment segment = TextSegment.from(
            doc.getString("text"),
            doc.get("metadata", Metadata.class)
    );
    Embedding embedding = embeddingModel.embed(segment).content();
    embeddingStore.add(embedding, segment);
}
```

## セマンティック / 類似度検索を実行する

次のコードは、クエリをベクトルに変換し、意味的に類似したドキュメントを返す
検索リクエストの作成方法を示します。結果の `EmbeddingMatch` インスタンスには、
ドキュメント内容と、各結果がクエリにどれだけ一致するかを表すスコアが含まれます。

```java
String query = "Where do penguins live?";
Embedding queryEmbedding = embeddingModel.embed(query).content();

EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .maxResults(3)
        .build();

System.out.println("Performing the query...");

EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(searchRequest);
List<EmbeddingMatch<TextSegment>> matches = searchResult.matches();

for (EmbeddingMatch<TextSegment> embeddingMatch : matches) {
    System.out.println("Response: " + embeddingMatch.embedded().text());
    System.out.println("Author: " + embeddingMatch.embedded().metadata().getString("author"));
    System.out.println("Score: " + embeddingMatch.score());
}
```

### メタデータフィルタリング

`EmbeddingSearchRequest` をビルドする際に `filter()` メソッドを使うと、
メタデータフィルタリングを実装できます。`filter()` メソッドは
[Filter](https://docs.langchain4j.dev/apidocs/dev/langchain4j/store/embedding/filter/Filter.html)
を継承するパラメータを受け取ります。

次のコードは、`website` の値がリスト内のいずれかであるドキュメントのみを対象とする
メタデータフィルタリングを実装しています。

```java
EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .filter(new IsIn("website", List.of("Our Earth", "Natural Habitats")))
        .maxResults(3)
        .build();
```

## RAG

MongoDB Atlas をベクトルストアとして RAG を実装する手順については、Atlas ドキュメント内の
LangChain4j チュートリアルの
[Use Your Data to Answer Questions](https://www.mongodb.com/docs/atlas/atlas-vector-search/ai-integrations/langchain4j/#use-your-data-to-answer-questions)
セクションを参照してください。

## API ドキュメント

-   [MongoDB Atlas Embedding Store Integration](https://docs.langchain4j.dev/apidocs/dev/langchain4j/store/embedding/mongodb/package-summary.html)

-   [MongoDB Java Sync Driver](https://mongodb.github.io/mongo-java-driver/5.4/apidocs/mongodb-driver-sync/index.html)

## 参考リンク

-   [Get Started with the LangChain4j Integration](https://www.mongodb.com/docs/atlas/atlas-vector-search/ai-integrations/langchain4j/)
-   [How to Make a RAG Application With LangChain4j](https://dev.to/mongodb/how-to-make-a-rag-application-with-langchain4j-1mad)
