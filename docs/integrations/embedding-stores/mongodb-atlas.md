---
sidebar_position: 15
---

# MongoDB Atlas

[MongoDB Atlas](https://www.mongodb.com/docs/atlas/)は、AWS、Azure、GCPで利用可能な完全マネージド型クラウドデータベースです。MongoDBドキュメントデータに対するネイティブベクトル検索と全文検索（BM25アルゴリズム）をサポートしています。

[Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)機能を使用すると、埋め込みをMongoDBドキュメントに保存し、ベクトル検索インデックスを作成し、Hierarchical Navigable Small Worldsと呼ばれる近似最近傍アルゴリズムを使用してKNN検索を実行できます。LangChain4jとのMongoDB統合は、[`$vectorSearch`](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/#mongodb-pipeline-pipe.-vectorSearch)集約ステージを使用して内部的にAtlas Vector Searchを実装しています。

LangChain4jでAtlas Vector Searchを使用して、データに対するセマンティック検索を実行し、シンプルなRAG実装を構築できます。これらのタスクを実行するための完全なチュートリアルについては、MongoDB Atlasドキュメントの[LangChain4j統合の使用を開始する](https://www.mongodb.com/docs/atlas/atlas-vector-search/ai-integrations/langchain4j/)チュートリアルを参照してください。

## 前提条件

Atlas Vector Searchを使用するには、以下のMongoDBサーバーバージョンを実行しているデプロイメントが必要です：

- 6.0.11以降
- 7.0.2以降

MongoDBは無料で永続的に使えるクラスターを提供しています。アカウントの設定とデプロイメントへの接続の詳細については、[Atlasの使用を開始する](https://www.mongodb.com/docs/atlas/getting-started/)チュートリアルを参照してください。

また、埋め込みモデルを提供するLLMサービス用のクレジット付きAPIキーも必要です。例えば、[Voyage AI](https://www.voyageai.com/)は無料枠を提供しています。RAGアプリケーションの場合、[OpenAI](https://openai.com/api/)や[HuggingFace](https://huggingface.co/)からのモデルなど、チャットモデル機能を持つサービス用のAPIキーも必要です。

## 環境とインストール

1. 好みのIDEで新しいJavaアプリケーションを作成します。
2. LangChain4jとMongoDB Java Syncドライバーをインストールするために、アプリケーションに以下の依存関係を追加します：

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

また、埋め込みモデル用の依存関係もインストールする必要があります。例えばVoyage AI：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-voyage-ai</artifactId>
</dependency>
```

LangChain4j BOMの追加もお勧めします：

```xml
<dependencyManagement>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-bom</artifactId>
        <version>1.0.0-beta4</version>
        <type>pom</type>
    </dependency>
</dependencyManagement>
```

## MongoDB Atlasを埋め込みストアとして使用する

以下のコードは、MongoDB Atlasに接続し、埋め込みストアを作成する方法を示しています：

```java
// MongoDB Atlasに接続
MongoClient mongoClient = MongoClients.create("mongodb+srv://<username>:<password>@<cluster-url>/test?retryWrites=true&w=majority");
MongoDatabase database = mongoClient.getDatabase("langchain4j");

// 埋め込みモデルを作成
EmbeddingModel embeddingModel = VoyageAiEmbeddingModel.builder()
        .apiKey(System.getenv("VOYAGE_API_KEY"))
        .modelName("voyage-2")
        .build();

// 埋め込みストアを作成
MongoDBAtlasEmbeddingStore embeddingStore = MongoDBAtlasEmbeddingStore.builder()
        .database(database)
        .collectionName("embeddings")
        .dimension(embeddingModel.dimension())
        .build();
```

## ドキュメントの埋め込みを保存する

このコードは、ドキュメントのコレクションを作成し、それらを埋め込みストアに保存する方法を示しています：

```java
ArrayList<Document> docs = new ArrayList<>();

docs.add(new Document()
        .append("text", "ペンギンは赤道より南にほぼ排他的に生息する飛べない海鳥です。一部の島に住むペンギンはより温暖な気候で見られることもあります。")
        .append("metadata", new Metadata(Map.of("website", "Science Direct"))));

docs.add(new Document()
        .append("text", "コウテイペンギンは驚くべき鳥です。彼らは南極の冬を生き抜くだけでなく、地球上で最も過酷な気象条件の中で繁殖します。")
        .append("metadata", new Metadata(Map.of("website", "Our Earth"))));

docs.add(new Document()
        .append("text", "ペンギンは南極大陸、南アメリカ、アフリカ、オーストラリア、ニュージーランドの周辺の島々に生息しています。")
        .append("metadata", new Metadata(Map.of("website", "Natural Habitats"))));

System.out.println("ドキュメントの埋め込みを保存中...");

for (Document doc : docs) {
    TextSegment segment = TextSegment.from(
            doc.getString("text"),
            doc.get("metadata", Metadata.class)
    );
    Embedding embedding = embeddingModel.embed(segment).content();
    embeddingStore.add(embedding, segment);
}
```

## セマンティック/類似性検索を実行する

このコードは、クエリをベクトルに変換し、意味的に類似したドキュメントを返す検索リクエストを作成する方法を示しています。結果の`EmbeddingMatch`インスタンスには、ドキュメントの内容と各結果がクエリにどれだけ一致するかを示すスコアが含まれています。

```java
String query = "ペンギンはどこに住んでいますか？";
Embedding queryEmbedding = embeddingModel.embed(query).content();

EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .maxResults(3)
        .build();

System.out.println("クエリを実行中...");

EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(searchRequest);
List<EmbeddingMatch<TextSegment>> matches = searchResult.matches();

for (EmbeddingMatch<TextSegment> embeddingMatch : matches) {
    System.out.println("応答: " + embeddingMatch.embedded().text());
    System.out.println("著者: " + embeddingMatch.embedded().metadata().getString("author"));
    System.out.println("スコア: " + embeddingMatch.score());
}
```

### メタデータフィルタリング

`EmbeddingSearchRequest`を構築する際に`filter()`メソッドを使用して、メタデータフィルタリングを実装できます。`filter()`メソッドは[Filter](https://docs.langchain4j.dev/apidocs/dev/langchain4j/store/embedding/filter/Filter.html)を継承するパラメータを取ります。

このコードは、`website`の値がリストされた値のいずれかであるドキュメントのみに対するメタデータフィルタリングを実装しています。

```java
EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .filter(new IsIn("website", List.of("Our Earth", "Natural Habitats")))
        .maxResults(3)
        .build();
```

## RAG

MongoDB Atlasをベクトルストアとして使用したRAGの実装手順については、Atlasドキュメントの[LangChain4jチュートリアル](https://www.mongodb.com/docs/atlas/atlas-vector-search/ai-integrations/langchain4j/#use-your-data-to-answer-questions)の「データを使用して質問に回答する」セクションを参照してください。

## APIドキュメント

- [MongoDB Atlas埋め込みストア統合](https://docs.langchain4j.dev/apidocs/dev/langchain4j/store/embedding/mongodb/package-summary.html)

- [MongoDB Java Syncドライバー](https://mongodb.github.io/mongo-java-driver/5.4/apidocs/mongodb-driver-sync/index.html)

## 役立つリンク

- [LangChain4j統合の使用を開始する](https://www.mongodb.com/docs/atlas/atlas-vector-search/ai-integrations/langchain4j/)
- [LangChain4jでRAGアプリケーションを作成する方法](https://dev.to/mongodb/how-to-make-a-rag-application-with-langchain4j-1mad)
