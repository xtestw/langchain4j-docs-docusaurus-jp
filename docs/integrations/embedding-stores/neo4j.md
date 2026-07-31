---
sidebar_position: 16
---



# Neo4j

[Neo4j](https://neo4j.com/) は、接続されたデータを管理するために設計された高性能なオープンソースのグラフデータベースです。
Neo4j のネイティブグラフモデルは、ソーシャルグラフ、レコメンデーションシステム、ナレッジネットワークなど、複雑で高度に相互接続された領域のモデリングに最適です。
LangChain4j との統合により、Langchain4j ライブラリ内で [Neo4j Vector](https://github.com/neo4j-documentation/labs-pages/blob/publish/modules/genai-ecosystem/pages/vector-search.adoc) 機能を利用できます。

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-neo4j</artifactId>
    <version>${latest version here}</version>
</dependency>

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-neo4j-retriever</artifactId>
    <version>${latest version here}</version>
</dependency>

<!-- if we want to use the Spring Boot starter -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-neo4j-spring-boot-starter</artifactId>
    <version>${latest version here}</version>
</dependency>
```
## API

LangChain4j は Neo4j 連携用に次のクラスを提供します：
- `Neo4jEmbeddingStore`：EmbeddingStore インターフェースを実装し、Neo4j データベースへのベクトル埋め込みの保存と照会を可能にします。
- `Neo4jText2CypherRetriever`：ContentRetriever インターフェースを実装し、ユーザーの質問から Cypher クエリを生成・実行して Neo4j からのコンテンツ取得を改善します。自然言語の質問を Cypher クエリに変換し、
  [apoc.meta.data](https://neo4j.com/docs/apoc/current/overview/apoc.meta/apoc.meta.data) プロシージャで算出した Neo4j スキーマを活用します。
- `KnowledgeGraphWriter`：`LLMGraphTransformer` から得た構造化データをもとに Neo4j のノードとリレーションシップを保存するクラスです。
`LLMGraphTransformer` は 1 つ以上の非構造化ドキュメントをグラフに変換するツールで、データベース非依存のため、テキストを Nodes と Edges の集合に変換し、RedisGraph など他のグラフ DB でも使えます。
- `Neo4jEmbeddingStoreIngestor`：`ParentChildEmbeddingStoreIngestor` インターフェースを実装し、多段階変換パイプラインを実行します：ドキュメント変換、セグメント分割、子セグメントへの追加変換（任意）、埋め込み生成、親子関係と埋め込みの Neo4j への保存。
- `Neo4jChatMemoryStore`：`ChatMemoryStore` インターフェースを実装し、Neo4j グラフデータベースで会話メッセージを保存・取得します。Neo4j のノードとリレーションシップでチャット履歴を効率的に照会・永続化できます。

## 使用例

### Neo4jEmbeddingStore

`Neo4jEmbeddingStore` インスタンスの作成方法：

```java
Neo4jEmbeddingStore embeddingStore = Neo4jEmbeddingStore.builder().<builderParameters>.build();
```

ここで `<builderParameters>` には `dimension` と、`driver` または `withBasicAuth` のいずれかが必須で、その他の任意パラメータも付けられます。

完全な builder 一覧：

| キー                 | デフォルト値| 説明        |
| ------------------- |-----| --------------------- |
| `driver`            | *`withBasicAuth` 未設定時は必須*   | [Java Driver インスタンス](https://neo4j.com/docs/api/java-driver/current/org.neo4j.driver/org/neo4j/driver/Driver.html) |
| `withBasicAuth`     | *`driver` 未設定時は必須*       | `uri`、`user`、`password` から [Java Driver インスタンス](https://neo4j.com/docs/api/java-driver/current/org.neo4j.driver/org/neo4j/driver/Driver.html) を作成 |
| `dimension`         | *必須*    | ベクトルの次元  |
| `config`            | `org.neo4j.driver.SessionConfig.forDatabase("<databaseName>")`   | [SessionConfig インスタンス](https://neo4j.com/docs/api/java-driver/current/org.neo4j.driver/org/neo4j/driver/SessionConfig.html)                                |
| `label`             | `"Document"`| ラベル名    |
| `embeddingProperty` | `"embedding"` | 埋め込みプロパティ名 |
| `idProperty`        | `"id"` | ID プロパティ名  |
| `metadataPrefix`    | `""`       | メタデータ接頭辞   |
| `textProperty`      | `"text"`  | テキストプロパティ名 |
| `indexName`         | `"vector"` | ベクトルインデックス名  |
| `databaseName`      | `"neo4j"`| データベース名  |
| `retrievalQuery`    | `"RETURN properties(node) AS metadata, node.idProperty AS idProperty, node.textProperty AS textProperty, node.embeddingProperty AS embeddingProperty, score"`  | 検索クエリ     |




したがって、`Neo4jEmbeddingStore` インスタンスを作成するには適切な設定が必要です：

```java
// ---> MINIMAL EMBEDDING <---
Neo4jEmbeddingStore minimalEmbedding = Neo4jEmbeddingStore.builder()
    .withBasicAuth(NEO4J_CONNECTION_STRING, USERNAME, ADMIN_PASSWORD)
    .dimension(384)
    .build();

// ---> CUSTOM EMBEDDING <---
Neo4jEmbeddingStore customEmbeddingStore = Neo4jEmbeddingStore.builder()
        .withBasicAuth(NEO4J_CONNECTION_STRING, USERNAME, ADMIN_PASSWORD)
        .dimension(384)
        .indexName(CUSTOM_INDEX)
        .metadataPrefix(CUSTOM_METADATA_PREF)
        .label(CUSTOM_LABEL)
        .embeddingProperty(CUSTOM_PROP)
        .idProperty(CUSTOM_ID)
        .textProperty(CUSTOM_TEXT)
        .build();
```
その後、さまざまな方法で埋め込みを追加し、検索できます：

```java
// ---> ADD MINIMAL EMBEDDING <---
Embedding embedding = embeddingModel.embed("embedText").content();
String id = minimalEmbedding.add(embedding); // output: id of the embedding

// ---> ADD MINIMAL EMBEDDING WITH ID <---
String id = randomUUID();
Embedding embedding = embeddingModel.embed("embedText").content();
minimalEmbedding.add(id, embedding);

// ---> ADD EMBEDDING WITH SEGMENT <---
TextSegment segment = TextSegment.from(randomUUID());
Embedding embedding = embeddingModel.embed(segment.text()).content();
String id = minimalEmbedding.add(embedding, segment);

// ---> ADD EMBEDDING WITH SEGMENT AND METADATA <---
TextSegment segment = TextSegment.from(randomUUID(), Metadata.from(METADATA_KEY, "test-value"));
Embedding embedding = embeddingModel.embed(segment.text()).content();
String id = minimalEmbedding.add(embedding, segment);

// ---> ADD MULTIPLE EMBEDDINGS <---
Embedding firstEmbedding = embeddingModel.embed("firstEmbedText").content();
Embedding secondEmbedding = embeddingModel.embed("secondEmbedText").content();
List<String> ids = minimalEmbedding.addAll(asList(firstEmbedding, secondEmbedding));

// ---> ADD MULTIPLE EMBEDDINGS WITH SEGMENTS <---
TextSegment firstSegment = TextSegment.from("firstText");
Embedding firstEmbedding = embeddingModel.embed(firstSegment.text()).content();
TextSegment secondSegment = TextSegment.from("secondText");
Embedding secondEmbedding = embeddingModel.embed(secondSegment.text()).content();
List<String> ids = minimalEmbedding.addAll(
        asList(firstEmbedding, secondEmbedding),
        asList(firstSegment, secondSegment)
);
```
保存済みの埋め込みを検索できます：

```java
// ---> SEARCH EMBEDDING WITH MAX RESULTS <---
String id = minimalEmbedding.add(embedding);
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(embedding)
        .maxResults(10)
        .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();

// ---> SEARCH EMBEDDING WITH MIN SCORE <---
Embedding embedding = embeddingModel.embed("embedText").content();
String id = minimalEmbedding.add(embedding);
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(embedding)
        .maxResults(10)
        .minScore(0.15)
        .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();

// ---> SEARCH EMBEDDING WITH CUSTOM METADATA PREFIX <---
String metadataCompleteKey = CUSTOM_METADATA_PREF + METADATA_KEY;
TextSegment segment = TextSegment.from(randomUUID(), Metadata.from(METADATA_KEY, "test-value"));
Embedding embedding = embeddingModel.embed(segment.text()).content();
String id = customEmbeddingStore.add(embedding, segment);
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(embedding)
        .maxResults(10)
        .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();

// ---> SEARCH EMBEDDING WITH CUSTOM ID PROPERTY <---
String metadataCompleteKey = CUSTOM_METADATA_PREF + METADATA_KEY;
TextSegment segment = TextSegment.from(randomUUID(), Metadata.from(METADATA_KEY, "test-value"));
Embedding embedding = embeddingModel.embed(segment.text()).content();
String id = embeddingStore.add(embedding, segment);
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(embedding)
                .maxResults(10)
                .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();

// ---> SEARCH MULTIPLE EMBEDDING <---
List<String> ids = minimalEmbedding.addAll(asList(firstEmbedding, secondEmbedding));
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(firstEmbedding)
        .maxResults(10)
        .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();

// ---> SEARCH MULTIPLE EMBEDDING WITH SEGMENTS <---
List<String> ids = minimalEmbedding.addAll(
        asList(firstEmbedding, secondEmbedding),
        asList(firstSegment, secondSegment)
);
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(firstEmbedding)
        .maxResults(10)
        .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();
```

ベクトル索引と全文インデックスの両方を活かしたハイブリッド検索で埋め込みを取得するには：

```java
// ---> ADDS EMBEDDING AND FULLTEXT WITH ID <---
embeddingStore = Neo4jEmbeddingStore.builder()
        .withBasicAuth("<Bolt URL>", "<username>", "<password>")
        .dimension(384)
        .fullTextIndexName("movie_text")
        .fullTextQuery("Matrix")
        .autoCreateFullText(true)
        .label(LABEL_TO_SANITIZE)
        .build();

List<Embedding> embeddings =
        embeddingModel.embedAll(List.of(TextSegment.from("test"))).content();
        embeddingStore.addAll(embeddings);

final Embedding queryEmbedding = embeddingModel.embed("Matrix").content();

final EmbeddingSearchRequest embeddingSearchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .maxResults(1)
        .build();

final List<EmbeddingMatch<TextSegment>> matches =
        embeddingStore.search(embeddingSearchRequest).matches();

// ---> SEARCH EMBEDDING WITH AUTOCREATED FULLTEXT <---
final String fullTextIndexName = "movie_text";
final String label = "Movie";
final String fullTextSearch = "Matrix";
embeddingStore = Neo4jEmbeddingStore.builder()
        .withBasicAuth("<Bolt URL>", "<username>", "<password>")
        .dimension(384)
        .label(label)
        .indexName("movie_vector_idx")
        .fullTextIndexName(fullTextIndexName)
        .fullTextQuery(fullTextSearch)
        .build();
```

FULLTEXT インデックスが無効な場合、説明付きの例外が投げられます： 

```java
// ---> ERROR HANDLING WITH INVALID FULLTEXT <---
Neo4jEmbeddingStore embeddingStore = Neo4jEmbeddingStore.builder()
        .withBasicAuth("<Bolt URL>", "<username>", "<password>")
        .dimension(384)
        .fullTextIndexName("full_text_with_invalid_retrieval")
        .fullTextQuery("Matrix")
        .autoCreateFullText(true)
        .fullTextRetrievalQuery("RETURN properties(invalid) AS metadata")
        .label(LABEL_TO_SANITIZE)
        .build();

List<Embedding> embeddings = embeddingModel.embedAll(List.of(TextSegment.from("test"))).content();
embeddingStore.addAll(embeddings);

final Embedding queryEmbedding = embeddingModel.embed("Matrix").content();

final EmbeddingSearchRequest embeddingSearchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .maxResults(3)
        .build();
embeddingStore.search(embeddingSearchRequest).matches();
// This search will throw a ClientException: ... Variable `invalid` not defined ...
```

`dev.langchain4j.store.embedding.filter.Filter` クラスを使い、メタデータフィルタ付きで検索を実行するには：

```java
// ---> ADD EMBEDDING WITH ID AND RETRIEVE WITH OR WITHOUT PREFILTER <---
final List<TextSegment> segments = IntStream.range(0, 10)
                .boxed()
                .map(i -> {
                    if (i == 0) {
                        final Map<String, Object> metas =
                                Map.of("key1", "value1", "key2", 10, "key3", "3", "key4", "value4");
                        final Metadata metadata = new Metadata(metas);
                        return TextSegment.from(randomUUID(), metadata);
                    }
                    return TextSegment.from(randomUUID());
                })
                .toList();

final List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
embeddingStore.addAll(embeddings, segments);

final And filter = new And(
        new And(new IsEqualTo("key1", "value1"), new IsEqualTo("key2", "10")),
        new Not(new Or(new IsIn("key3", asList("1", "2")), new IsNotEqualTo("key4", "value4"))));

TextSegment segmentToSearch = TextSegment.from(randomUUID());
Embedding embeddingToSearch =
        embeddingModel.embed(segmentToSearch.text()).content();
final EmbeddingSearchRequest requestWithFilter = EmbeddingSearchRequest.builder()
        .maxResults(5)
        .minScore(0.0)
        .filter(filter)
        .queryEmbedding(embeddingToSearch)
        .build();
final EmbeddingSearchResult<TextSegment> searchWithFilter = embeddingStore.search(requestWithFilter);
final List<EmbeddingMatch<TextSegment>> matchesWithFilter = searchWithFilter.matches();

final EmbeddingSearchRequest requestWithoutFilter = EmbeddingSearchRequest.builder()
        .maxResults(5)
        .minScore(0.0)
        .queryEmbedding(embeddingToSearch)
        .build();
final EmbeddingSearchResult<TextSegment> searchWithoutFilter = embeddingStore.search(requestWithoutFilter);
final List<EmbeddingMatch<TextSegment>> matchesWithoutFilter = searchWithoutFilter.matches();
```

埋め込み検索で得たデータを後続の読み書きクエリで扱うには、ノードの `embeddingId` を利用できます。
例：

```java
// ... Neo4jEmbeddingStore instance creation ...
// ... add embeddings.... 

final List<EmbeddingMatch<TextSegment>> results = embeddingStore.search(/*dev.langchain4j.store.embedding.EmbeddingSearchRequest instance*/)
        .matches();

// retrieve the ids to execute the follow-up
List<String> nodeIds = results.stream().map(dev.langchain4j.store.embedding.EmbeddingMatch:embeddingId).toList();

String cypher = """
        MATCH (d:Document)
        WHERE d.id IN $ids
        // -- here the follow-up query, for example
        WITH (d)-[:CONNECTED_TO]->(o:OtherLabel) 
        RETURN o.id
    """;

// run the follow-up query
Map<String, Object> params = Map.of("ids", nodeIds);
final List<Record> list = session.run(cypher, params).list();
```

#### Spring Boot starter

**Spring Boot starter** を作成する場合、Neo4j starter は現時点で次の `application.properties` を提供します：

```properties

# the builder.dimension(dimension) method
langchain4j.community.neo4j.dimension=<dimension>
# the builder.withBasicAuth(uri, username, password) method
langchain4j.community.neo4j.auth.uri=<boltURI>
langchain4j.community.neo4j.auth.user=<username>
langchain4j.community.neo4j.auth.password=<password>
# the builder.label(label) method
langchain4j.community.neo4j.label=<label>
# the builder.indexName(indexName) method
langchain4j.community.neo4j.indexName=<indexName>
# the builder.metadataPrefix(metadataPrefix) method
langchain4j.community.neo4j.metadataPrefix=<metadataPrefix>
# the builder.embeddingProperty(embeddingProperty) method
langchain4j.community.neo4j.embeddingProperty=<embeddingProperty>
# the builder.idProperty(idProperty) method
langchain4j.community.neo4j.idProperty=<idProperty>
# the builder.textProperty(textProperty) method
langchain4j.community.neo4j.textProperty=<textProperty>
# the builder.databaseName(databaseName) method
langchain4j.community.neo4j.databaseName=<databaseName>
# the builder.retrievalQuery(retrievalQuery) method
langchain4j.community.neo4j.retrievalQuery=<retrievalQuery>
# the builder.awaitIndexTimeout(awaitIndexTimeout) method
langchain4j.community.neo4j.awaitIndexTimeout=<awaitIndexTimeout>
```
Starter を設定すると、次のようなシンプルな Spring Boot プロジェクトを作成できます：

```java
@SpringBootApplication
public class SpringBootExample {

    public static void main(String[] args) {
        SpringApplication.run(SpringBootExample.class, args);
    }

    @Bean
    public AllMiniLmL6V2EmbeddingModel embeddingModel() {
        return new AllMiniLmL6V2EmbeddingModel();
    }
    
}

@RestController
@RequestMapping("/api/embeddings")
public class EmbeddingController {

    private final EmbeddingStore<TextSegment> store;
    private final EmbeddingModel model;

    public EmbeddingController(EmbeddingStore<TextSegment> store, EmbeddingModel model) {
        this.store = store;
        this.model = model;
    }

    // add embeddings
    @PostMapping("/add")
    public String add(@RequestBody String text) {
        TextSegment segment = TextSegment.from(text);
        Embedding embedding = model.embed(text).content();
        return store.add(embedding, segment);
    }

    // search embeddings
    @PostMapping("/search")
    public List<String> search(@RequestBody String query) {
        Embedding queryEmbedding = model.embed(query).content();
        EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(5)
                .build();
        return store.search(request).matches()
                .stream()
                .map(i -> i.embedded().text()).toList();
    }
}
```
簡単に呼び出せる API を定義しています。例：

```shell
# to create a new embedding 
# and store it with a label "Spring Boot"
curl -X POST localhost:8083/api/embeddings/add -H "Content-Type: text/plain" -d "embeddingTest"

# to search the first 5 embeddings
curl -X POST localhost:8083/api/embeddings/search -H "Content-Type: text/plain" -d "querySearchTest"
```


### Neo4jText2CypherRetriever

`Neo4jText2CypherRetriever` インスタンスの作成方法：

```java
Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder().<builderParameters>.build();
````

完全な builder 一覧：

| キー | デフォルト値     | 説明 |
| ---------- |-------------------| ---------- |
| `graph`    | *必須*        | 下記参照  |
| `chatModel` | *必須*        | 自然言語の質問から Cypher クエリを作成する [ChatModel](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/model/chat/ChatModel.java) 実装 |
| `prompt`   | 下記の例を参照 | chatModel と共に使うプロンプト |
| `examples` | 空文字列      | 結果を豊かにし改善するための追加例 |
| `maxRetries` | 3                 | Cypher クエリが失敗または空結果のときの追加リトライ回数                                                                                                                                           |

Neo4j に接続するには、次のように `Neo4jGraph` クラスを使います：

```java
// Neo4j Java Driver connection instance
Driver driver = GraphDatabase.driver("<Bolt URL>", AuthTokens.basic("<username>", "<password>"));

Neo4jGraph neo4jGraph = Neo4jGraph.builder()
    .driver(driver)
    .build();
```

または `Neo4jEmbeddingStore` と同様に `withBasicAuth` を使います：

```java
Neo4jGraph neo4jGraph = Neo4jGraph.builder()
    .withBasicAuth("<Bolt URL>", "<username>", "<password>")
    .build();
```

それを builder に渡します：

```java
Neo4jGraph neo4jGraph = /* Neo4jGraph instance */;

// ChatModel instance, e.g. OpenAiChatModel
ChatModel chatModel = OpenAiChatModel.builder()
        .apiKey(OPENAI_API_KEY)
        .modelName(GPT_4_O_MINI)
        .build();

// Neo4jText2CypherRetriever instance
Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder()
        .graph(neo4jGraph)
        .chatModel(chatModel)
        .build();
```

`sample`（コンテキストプロンプトに返すサンプルパス数）や `maxRels`（ノードラベルあたり読み取るリレーションシップの最大数）などのパラメータを調整して、`Neo4jGraph` の挙動をさらにカスタマイズできます。
これらは任意です（デフォルトはそれぞれ `1000` と `100`）。デフォルト動作でよければ省略できます。
大規模グラフでプロンプトのサイズと複雑さを制御するのに特に有用です。

さらに、`Neo4jGraph` を使ってエンティティスキーマ、
つまりグラフ構造を記述するパターン、ノードプロパティ、リレーションシッププロパティの一覧を返すこともできます：

```java
final Neo4jGraph.StructuredSchema structuredSchema = graph.getStructuredSchema();

List<String> patterns = structuredSchema.patterns();
List<String> nodesProperties = structuredSchema.nodesProperties();
List<String> relationshipsProperties = structuredSchema.relationshipsProperties();

/*
Example outputs:
`patterns`: [(:Person)-[:WROTE]->(:Book)]
`nodesProperties`: [:Book {title: STRING}, :Person {name: STRING}]
`relationshipsProperties`: [:WROTE {year: 1986}]
*/
```

### `sample` と `maxRels` の例

```java
Neo4jGraph neo4jGraph = Neo4jGraph.builder()
    .driver(driver)
    .sample(3L) // Sample up to 3 example paths from the graph schema
    .maxRels(8L) // Explore a maximum of 8 relationships from the start node
    .build();

Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder()
    .graph(neo4jGraph)
    .chatModel(chatModel)
    .build();
```

基本的な例：

```java

// create dataset, for example:
// CREATE (book:Book {title: 'Dune'})<-[:WROTE {when: date('1999')}]-(author:Person {name: 'Frank Herbert'})");


// create a Neo4jGraph instance
Neo4jGraph neo4jGraph = Neo4jGraph.builder()
        .driver(/*<Neo4j Driver instance>*/)
        .build();

// create a Neo4jText2CypherRetriever instance
Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder()
        .graph(neo4jGraph)
        .chatModel(chatModel)
        .build();

Query query = new Query("Who is the author of the book 'Dune'?");

// retrieve result
List<Content> contents = retriever.retrieve(query);

System.out.println(contents.get(0).textSegment().text());
// example output: "Frank Herbert"
```
上記は次のプロンプト文字列でチャットリクエストを実行します：

```text
Task:Generate Cypher statement to query a graph database.
Instructions
Use only the provided relationship types and properties in the schema.
Do not use any other relationship types or properties that are not provided.
Schema:

Node properties are the following:
:Book {title: STRING}
:Person {name: STRING}

Relationship properties are the following:
:WROTE {when: DATE}

The relationships are the following:
(:Person)-[:WROTE]->(:Book)

Note: Do not include any explanations or apologies in your responses.
Do not respond to any questions that might ask anything else than for you to construct a Cypher statement.
Do not include any text except the generated Cypher statement.
The question is: {{question}}
```
ここで `question` は "Who is the author of the book 'Dune'?"、
`schema` は apoc.meta.data プロシージャで現在の Neo4j スキーマを取得して文字列化したものです。
この場合は

```text
Node properties are the following:
:Book {title: STRING}
:Person {name: STRING}

Relationship properties are the following:
:WROTE {when: DATE}

The relationships are the following:
(:Person)-[:WROTE]->(:Book)
----

We can also change the default prompt if needed:
[source,java]
----
Neo4jGraph neo4jGraph = /* Neo4jGraph instance */

Neo4jText2CypherRetriever.builder()
  .neo4jGraph(neo4jGraph)
  .promptTemplate("<custom prompt>")
  .build();
```

リトライロジックなしのリトリーバーを作るには、`maxRetries` を `0` にします：

```java
Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder()
    .graph(graph)
    .chatModel(chatModel)
    .maxRetries(0) // disables retry logic
    .build();
```
決定的な挙動が欲しく、Cypher 生成失敗時にリトリーバーがフォールバッククエリを試したくない場合に有用です。性能が重要なシナリオや、失敗処理を外部で行う場合に推奨されます。


また `fromLLM("<question>")` メソッドを使い、次のプロンプトで `chatModel` を活用し、取得したコンテキストと Cypher クエリに基づく自然言語の回答を生成できます。`{{context}}` は `Neo4jGraph` から取得したスキーマ、`{{cypher}}` は text-to-Cypher が生成した Cypher クエリ、`{{question}}` は `fromLLM()` に渡した引数です。

```
Based on the following context and the generated Cypher,
write an answer in natural language to the provided user's question:
Context: {{context}}
Generated Cypher: {{cypher}}
Question: {{question}}
Cypher query:
````
使用例：

```java
Neo4jText2CypherRetriever neo4jContentRetriever = Neo4jText2CypherRetriever.builder()
        .graph(graph)
        .chatModel(OPEN_AI_CHAT_MODEL)
        .build();

Query query = new Query("Who is the author of the book 'Dune'?");

String response = neo4jContentRetriever.fromLLM(query);
// example output: the author of the book 'Dune' is Frank Herbert

````



### KnowledgeGraphWriter

`KnowledgeGraphWriter` は構造化されたナレッジグラフデータを Neo4j に書き込むユーティリティクラスです。非構造化ドキュメントからノードとリレーションシップを抽出する `LLMGraphTransformer` が生成したデータと連携するよう設計されています。

テキストがグラフ構造に変換済みで、Neo4j に効率よく保存する必要がある場合（任意のドキュメント出所情報を含む）に特に有用です。

#### 機能

- `GraphDocument` インスタンスからノードとリレーションシップを Neo4j に保存。
- ソースドキュメントのメタデータと内容の任意保存をサポート。
- エンティティ用の一意制約を自動作成。
- ラベル、リレーションシップタイプ、ID・テキストプロパティをカスタマイズ可能。

`KnowledgeGraphWriter` インスタンスの作成方法：

```java
KnowledgeGraphWriter writer = KnowledgeGraphWriter.builder().<builderParameters>.build();
```

#### 完全な builder 一覧：

| Builder メソッド           | 説明                                                | デフォルト値    |
| ------------------------ | ---------------------------------------------------------- | ---------------- |
| `graph(Neo4jGraph)`      | Neo4j グラフ接続を設定。（必須）                | -                |
| `label(String)`          | ノードのエンティティラベルを設定。                           | `__Entity__`     |
| `relType(String)`        | エンティティとドキュメント間のリレーションシップタイプを設定。 | `HAS_ENTITY`     |
| `idProperty(String)`     | 一意識別子として使うプロパティ名を設定。      | `id`             |
| `textProperty(String)`   | ドキュメントテキスト保存用のプロパティ名を設定。     | `text`           |
| `constraintName(String)` | Neo4j の一意制約名を設定。       | `knowledge_cons` |





```java
Neo4jGraph graph = Neo4jGraph.builder()
    .withBasicAuth("bolt://localhost:7687", "neo4j", "password")
    .build();

KnowledgeGraphWriter writer = KnowledgeGraphWriter.builder()
    .graph(graph)
    .label("Entity")
    .relType("MENTIONS")
    .idProperty("id")
    .textProperty("text")
    .build();

List<GraphDocument> graphDocuments = ... // obtained from LLMGraphTransformer
writer.addGraphDocuments(graphDocuments, true); // set to true to include document source
````


### Neo4jEmbeddingStoreIngestor

`Neo4jEmbeddingStoreIngestor` は、Neo4j グラフデータベースに埋め込みと関連データを保存するための専用インジェスタクラスです。埋め込み保存、クエリテンプレート、プロンプトを設定でき、さまざまな知識取り込み・検索ワークフローを支えます。

`Neo4jEmbeddingStoreIngestor` インスタンスの作成方法：

```java
Neo4jEmbeddingStoreIngestor ingestor = Neo4jEmbeddingStoreIngestor.builder()
    .<builderParameters>
    .build();
```

ここで `<builderParameters>` には必須の `driver` と `dimension`、および任意のカスタマイズが含まれます。

完全な builder 一覧：

| キー                   | デフォルト値             | 説明                                                                                                                    |
| --------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `driver`              | *必須*                | [Neo4j Java Driver インスタンス](https://neo4j.com/docs/api/java-driver/current/org.neo4j.driver/org/neo4j/driver/Driver.html) |
| `retrievalQuery`      | クラスのデフォルトを参照         | 埋め込み参照時にエンティティを取得する Cypher クエリ                                                                 |
| `entityCreationQuery` | クラスのデフォルトを参照         | 埋め込み付きエンティティ作成用の Cypher クエリ                                                                             |
| `label`               | `"Child"`                 | 埋め込みノードに使う Neo4j のノードラベル                                                                                 |
| `indexName`           | `"child_embedding_index"` | 埋め込みノード用インデックス名                                                                                          |
| `dimension`           | `384`                     | 埋め込みベクトルの次元数                                                                                        |
| `systemPrompt`        | クラスのデフォルトを参照         | LLM 駆動タスク用のシステムプロンプト                                                                                             |
| `userPrompt`          | クラスのデフォルトを参照         | LLM 駆動タスク用のユーザープロンプト                                                                                               |


**必須パラメータのみの基本的な使い方：**

```java
Neo4jEmbeddingStoreIngestor ingestor = Neo4jEmbeddingStoreIngestor.builder()
    .driver(neo4jDriver)
    .dimension(384)
    .build();
```

**カスタムの検索・作成クエリ：**

```java
Neo4jEmbeddingStoreIngestor ingestor = Neo4jEmbeddingStoreIngestor.builder()
    .driver(neo4jDriver)
    .dimension(384)
    .retrievalQuery("MATCH (doc:Document) WHERE doc.id = $id RETURN doc")
    .entityCreationQuery("CREATE (doc:Document {id: $id, embedding: $embedding})")
    .label("Document")
    .indexName("document_embedding_index")
    .build();
```

**カスタムのシステム／ユーザープロンプトを使う：**

```java
Neo4jEmbeddingStoreIngestor ingestor = Neo4jEmbeddingStoreIngestor.builder()
    .driver(neo4jDriver)
    .dimension(384)
    .systemPrompt("You are an expert knowledge base ingestor.")
    .userPrompt("Please ingest the following content:")
    .build();
```


### 特殊用途向け Neo4j Ingestor

次のクラスは `Neo4jEmbeddingStoreIngestor` を拡張し、特定の [GraphRAG](https://graphrag.com/reference/graphrag) パターン向けに事前構成された取り込みロジックを提供します。各インジェスタは定義済みの Cypher クエリとプロンプトテンプレートを持ちつつ、builder レベルでのカスタマイズも可能です。
すべて `Neo4jEmbeddingStoreIngestor` の完全な builder API を継承します。

#### SummaryGraphIngestor


[Global Community Summary Retriever の概念](https://graphrag.com/reference/graphrag/global-community-summary-retriever/) を実装するため、
このインジェスタは要約プロンプトでドキュメントの簡潔な要約を抽出し、デフォルトで `"Summary"` ラベルのノードとして保存し、元ドキュメントにリンクします。

使用例：

```java
SummaryGraphIngestor ingestor = SummaryGraphIngestor.builder()
        .driver(driver)
        .embeddingModel(embeddingModel)
        .questionModel(chatModel)
        .documentSplitter(splitter)
        .build();
````
`Neo4jEmbeddingStoreIngestor` と異なり、次のデフォルト値があります：

- `query`：`"CREATE (:SummaryChunk $metadata)"`
- `systemPrompt`：

```text
You are generating concise and accurate summaries based on the information found in the text.
```

- `userPrompt`：

```text
Generate a summary of the following input:
{{input}}

Summary:
```

- `embeddingStore`：

```java
private static final String DEFAULT_RETRIEVAL = """
        MATCH (node)<-[:HAS_SUMMARY]-(parent)
        WITH parent, max(score) AS score, node // deduplicate parents
        RETURN parent.text AS text, score, properties(node) AS metadata
        ORDER BY score DESC
        LIMIT $maxResults""";

private static final String DEFAULT_PARENT_QUERY = """
        UNWIND $rows AS row
        MATCH (p:SummaryChunk {parentId: $parentId})
        CREATE (p)-[:HAS_SUMMARY]->(u:%1$s {%2$s: row.%2$s})
        SET u += row.%3$s
        WITH row, u
        CALL db.create.setNodeVectorProperty(u, $embeddingProperty, row.%4$s)
        RETURN count(*)""";

EmbeddingStore defaultEmbeddingStore = Neo4jEmbeddingStore.builder()
    .driver(driver)
    .retrievalQuery(DEFAULT_RETRIEVAL)
    .entityCreationQuery(DEFAULT_PARENT_QUERY)
    .label("Summary")
    .indexName("summary_embedding_index")
    .dimension(384)
    .build();
```

#### HypotheticalQuestionGraphIngestor

[Hypothetical Question Retriever の概念](https://graphrag.com/reference/graphrag/hypothetical-question-retriever/) を実装するため、コンテンツチャンクから仮説的な質問を生成して埋め込みます。間接的・抽象的なユーザー質問でもセマンティック検索の精度が向上します。
クエリがドキュメントの表現と直接一致しない場合の検索を強化します。


使用例：

```java
HypotheticalQuestionGraphIngestor ingestor = HypotheticalQuestionGraphIngestor.builder()
        .embeddingModel(embeddingModel)
        .driver(driver)
        .documentSplitter(splitter)
        .questionModel(chatModel)
        .embeddingStore(embeddingStore)
        .build();
```

`Neo4jEmbeddingStoreIngestor` と異なり、次のデフォルト値があります：

- `query`：`"CREATE (:QuestionChunk $metadata)"`
- `systemPrompt`：

```text
You are generating hypothetical questions based on the information found in the text.
Make sure to provide full context in the generated questions.
```

- `userPrompt`：

```text
Use the given format to generate hypothetical questions from the following input:
{{input}}

Hypothetical questions:
```

- `embeddingStore`：

```java
private static final String DEFAULT_RETRIEVAL = """
        MATCH (node)<-[:HAS_QUESTION]-(parent)
        WITH parent, max(score) AS score, node // deduplicate parents
        RETURN parent.text AS text, score, properties(node) AS metadata
        ORDER BY score DESC
        LIMIT $maxResults""";

private static final String DEFAULT_PARENT_QUERY = """
        UNWIND $rows AS question
        MATCH (p:QuestionChunk {parentId: $parentId})
        WITH p, question
        CREATE (q:%1$s {%2$s: question.%2$s})
        SET q += question.%3$s
        MERGE (q)<-[:HAS_QUESTION]-(p)
        WITH q, question
        CALL db.create.setNodeVectorProperty(q, $embeddingProperty, question.%4$s)
        RETURN count(*)""";

EmbeddingStore defaultEmbeddingStore = Neo4jEmbeddingStore.builder()
    .driver(driver)
    .retrievalQuery(DEFAULT_RETRIEVAL_QUERY)
    .entityCreationQuery(DEFAULT_PARENT_QUERY)
    .label("Child")
    .indexName("child_embedding_index")
    .dimension(384)
    .build();
```

#### ParentChildGraphIngestor

[Parent-Child Retriever の概念](https://graphrag.com/reference/graphrag/parent-child-retriever/) を実装します。
子ノードでセマンティック検索を行い、結果を親ドキュメントにアンカーする場合に有用です。
このインジェスタは埋め込み付きの子チャンクを保存し、デフォルトで `:HAS_CHILD` リレーションシップにより親ノードへリンクします。より広いドキュメント文脈を参照しつつ関連断片を取得するのに適しています。




```java
ParentChildGraphIngestor ingestor = ParentChildGraphIngestor.builder()
        .embeddingModel(embeddingModel)
        .driver(driver)
        .documentSplitter(parentSplitter)
        .documentChildSplitter(childSplitter)
        .build();
```

`Neo4jEmbeddingStoreIngestor` と異なり、次のデフォルト値があります：

- `query`：`"CREATE (:ParentChunk $metadata)"`

- `embeddingStore`：

```java
private static final String DEFAULT_RETRIEVAL = """
        MATCH (node)<-[:HAS_CHILD]-(parent)
        WITH parent, collect(node.text) AS chunks, max(score) AS score
        RETURN parent.text + reduce(r = "", c in chunks | r + "\n\n" + c) AS text,
               score,
               properties(parent) AS metadata
        ORDER BY score DESC
        LIMIT $maxResults""";

private static final String DEFAULT_PARENT_QUERY = """
        UNWIND $rows AS row
        MATCH (p:ParentChunk {parentId: $parentId})
        CREATE (p)-[:HAS_CHILD]->(u:%1$s {%2$s: row.%2$s})
        SET u += row.%3$s
        WITH row, u
        CALL db.create.setNodeVectorProperty(u, $embeddingProperty, row.%4$s)
        RETURN count(*)""";

EmbeddingStore defaultEmbeddingStore = Neo4jEmbeddingStore.builder()
        .driver(driver)
        .retrievalQuery(DEFAULT_RETRIEVAL)
        .entityCreationQuery(DEFAULT_PARENT_QUERY)
        .label("Child")
        .indexName("child_embedding_index")
        .dimension(384)
        .build();
```



### Neo4jChatMemoryStore

`Neo4jChatMemoryStore` は、Neo4j グラフデータベースで会話メッセージを保存・取得する専用のチャットメモリ実装です。Neo4j のノードとリレーションシップでチャット履歴を効率的に照会・永続化できます。

`Neo4jChatMemoryStore` インスタンスの作成方法：

```java
Neo4jChatMemoryStore chatMemoryStore = Neo4jChatMemoryStore.builder()
    .<builderParameters>
    .build();
```

ここで `<builderParameters>` には必須の `driver` と、ラベルやノードプロパティ名などの任意プロパティが含まれます。

完全な builder 一覧：

| キー                      | デフォルト値      | 説明                                                                                                                    |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `driver`                 | *必須*         | [Neo4j Java Driver インスタンス](https://neo4j.com/docs/api/java-driver/current/org.neo4j.driver/org/neo4j/driver/Driver.html) |
| `label`                  | `"ChatMessage"`    | Neo4j のチャットメッセージノードに使うラベル                                                                                 |
| `idProperty`             | `"id"`             | メッセージ ID のプロパティ名                                                                                           |
| `conversationIdProperty` | `"conversationId"` | 会話を識別するプロパティ名                                                                                 |
| `timestampProperty`      | `"timestamp"`      | メッセージタイムスタンプのプロパティ名                                                                                       |

#### 例

**必須パラメータのみの基本的な使い方：**

```java
Neo4jChatMemoryStore chatMemoryStore = Neo4jChatMemoryStore.builder()
    .driver(neo4jDriver)
    .build();
```

**ノードラベルとプロパティのカスタマイズ：**

```java
Neo4jChatMemoryStore chatMemoryStore = Neo4jChatMemoryStore.builder()
    .driver(neo4jDriver)
    .label("Message")
    .idProperty("messageId")
    .conversationIdProperty("convId")
    .timestampProperty("timeSent")
    .build();
```









### シンプルなフロー例
以下は `Neo4jEmbeddingStore` と `Neo4jText2CypherRetriever` API の使用フローの例です。
- `Neo4jEmbeddingStore`：

```java
private static final EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();

public static void minimalEmbedding() {
    try (Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5.26")) {
        neo4j.start();

        EmbeddingStore<TextSegment> minimalEmbedding = Neo4jEmbeddingStore.builder()
                .withBasicAuth(neo4j.getBoltUrl(), "neo4j", neo4j.getAdminPassword())
                .dimension(384)
                .build();


        TextSegment segment1 = TextSegment.from("I like football.", Metadata.from("test-key-1", "test-value-1"));
        Embedding embedding1 = embeddingModel.embed(segment1).content();

        TextSegment segment2 = TextSegment.from("The weather is good today.", Metadata.from("test-key-2", "test-value-2"));
        Embedding embedding2 = embeddingModel.embed(segment2).content();

        TextSegment segment3 = TextSegment.from("I like basketball.", Metadata.from("test-key-3", "test-value-3"));
        Embedding embedding3 = embeddingModel.embed(segment3).content();
        minimalEmbedding.addAll(
                List.of(embedding1, embedding2, embedding3),
                List.of(segment1, segment2, segment3)
        );

        Embedding queryEmbedding = embeddingModel.embed("What are your favourite sports?").content();
        final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(2)
                .minScore(0.15)
                .build();
        List<EmbeddingMatch<TextSegment>> relevant = minimalEmbedding.search(request).matches();
        relevant.forEach(match -> {
            System.out.println(match.score()); // 0.8144289255142212
            System.out.println(match.embedded().text()); // I like football. || I like basketball.
        });
    }
}

public static void customEmbeddingStore() {
    try (Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5.26")) {
        neo4j.start();
        
        Neo4jEmbeddingStore customEmbeddingStore = Neo4jEmbeddingStore.builder()
                .withBasicAuth(neo4j.getBoltUrl(), "neo4j", neo4j.getAdminPassword())
                .dimension(384)
                .indexName("customidx")
                .label("CustomLabel")
                .embeddingProperty("customProp")
                .idProperty("customId")
                .textProperty("customText")
                .build();
        
        TextSegment segment1 = TextSegment.from("I like football.");
        Embedding embedding1 = embeddingModel.embed(segment1).content();
        customEmbeddingStore.add(embedding1, segment1);

        TextSegment segment2 = TextSegment.from("The weather is good today.");
        Embedding embedding2 = embeddingModel.embed(segment2).content();
        customEmbeddingStore.add(embedding2, segment2);

        Embedding queryEmbedding = embeddingModel.embed("What is your favourite sport?").content();
        final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(1)
                .build();
        List<EmbeddingMatch<TextSegment>> relevant = customEmbeddingStore.search(request).matches();
        EmbeddingMatch<TextSegment> embeddingMatch = relevant.get(0);

        System.out.println(embeddingMatch.score()); // 0.8144289255142212
        System.out.println(embeddingMatch.embedded().text()); // I like football.
    }
}
```
- `Neo4jText2CypherRetriever`：

```java
    private final ChatModel chatModel;

    public void Neo4jText2CypherRetriever() {
        try (
                Neo4jContainer<?> neo4jContainer = new Neo4jContainer<>("neo4j:5.16.0")
                                                        .withoutAuthentication()
                                                        .withLabsPlugins("apoc")
        ) {
            neo4jContainer.start();
            try (Driver driver = GraphDatabase.driver(neo4jContainer.getBoltUrl(), AuthTokens.none())) {
                try (Neo4jGraph graph = Neo4jGraph.builder().driver(driver).build()) {
                    try (Session session = driver.session()) {
                        session.run("CREATE (book:Book {title: 'Dune'})<-[:WROTE]-(author:Person {name: 'Frank Herbert'})");
                    }
                    graph.refreshSchema();
                    
                    Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder()
                            .graph(graph)
                            .chatModel(chatModel)
                            .build();

                    Query query = new Query("Who is the author of the book 'Dune'?");

                    List<Content> contents = retriever.retrieve(query);

                    System.out.println(contents.get(0).textSegment().text()); // "Frank Herbert"
                }
            }
        }
    }
```
[サンプルソース](https://github.com/langchain4j/langchain4j-examples/tree/main/neo4j-example/src/main/java)

