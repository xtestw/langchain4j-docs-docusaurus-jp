---
sidebar_position: 12
---

# Elasticsearch

https://www.elastic.co/


## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-elasticsearch</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## 概要

`langchain4j-elasticsearch` モジュールは、埋め込みストアおよびコンテンツリトリーバーとしての
Elasticsearch 連携を提供します。

主なクラスは次の 2 つです：

- [`ElasticsearchEmbeddingStore`](#elasticsearchembeddingstore)：`EmbeddingStore` インターフェースの実装で、
  Elasticsearch を使って埋め込みを保存・取得します。
- [`ElasticsearchContentRetriever`](#elasticsearchcontentretriever)：`ContentRetriever`
  インターフェースの実装で、Elasticsearch のベクトル類似度検索により関連ドキュメントを取得します。

どちらのクラスも、Elasticsearch サーバーに接続するための
[Elasticsearch Client](https://www.elastic.co/docs/reference/elasticsearch/clients/java) が必要です。

```java
String apiKey = "VnVhQ2ZHY0JDZGJrU...";
ElasticsearchClient client = ElasticsearchClient.of(ec -> ec
        .host("https://localhost:9200")
        .apiKey(apiKey));
```

**注意：**

> ElasticsearchClient インスタンスの作成方法については、
> [Elasticsearch ドキュメント](https://www.elastic.co/docs/reference/elasticsearch/clients/java/setup/connecting) を参照してください。

## ElasticsearchEmbeddingStore

`ElasticsearchEmbeddingStore` インスタンスを作成するには、`ElasticsearchClient` を渡します：

```java
ElasticsearchEmbeddingStore store = ElasticsearchEmbeddingStore.builder()
    .client(client)
    .build();
```

次のオプションがあります：

* `indexName`：使用する Elasticsearch インデックス名。デフォルトは `default`。
* `configuration`：使用する `ElasticsearchConfiguration`。デフォルトは `ElasticsearchConfigurationKnn`。

上記のコードは次と同等です：

```java
ElasticsearchEmbeddingStore store = ElasticsearchEmbeddingStore.builder()
    .client(client)
    .configuration(ElasticsearchConfigurationKnn.builder().build())
    .indexName("default")
    .build();
```

## ElasticsearchContentRetriever

ContentRetriever には埋め込みモデルが必要です：

```java
EmbeddingModel embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel();
```

`ElasticsearchContentRetriever` インスタンスを作成するには、`ElasticsearchClient` と
`EmbeddingModel` を渡します：

```java
ElasticsearchContentRetriever contentRetriever = ElasticsearchContentRetriever.builder()
    .client(client)
    .embeddingModel(embeddingModel)
    .build();
```

次のオプションがあります：

* `configuration`：使用する `ElasticsearchConfiguration`（[下記](#elasticsearchconfiguration)参照）。デフォルトは `ElasticsearchConfigurationKnn`。
* `indexName`：使用する Elasticsearch インデックス名。デフォルトは `default`。インデックスが存在しない場合は
  自動作成されます。
* `maxResults`：取得する結果の最大件数。デフォルトは `3`。
* `minScore`：取得結果の最小スコア閾値。デフォルトは `0.0`。
* `filter`：取得時に適用する `Filter`（任意）。デフォルトは `null`。

上記のコードは次と同等です：

```java
ElasticsearchContentRetriever contentRetriever = ElasticsearchContentRetriever.builder()
    .client(client)
    .embeddingModel(embeddingModel)
    .configuration(ElasticsearchConfigurationKnn.builder().build())
    .indexName("default")
    .maxResults(3)
    .minScore(0.0)
    .filter(null)
    .build();
```

## ElasticsearchConfiguration

`ElasticsearchConfiguration` は、埋め込みストアまたはコンテンツリトリーバーが
Elasticsearch サーバーとどのようにやり取りするかを定義します。`ElasticsearchConfiguration` インターフェースを実装して独自設定を作成するか、
提供されている次の実装のいずれかを使用できます：

- [`ElasticsearchConfigurationKnn`](#elasticsearchconfigurationknn)：近似 [kNN クエリ](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-knn-query.html) を使用
  （デフォルト）。
- [`ElasticsearchConfigurationScript`](#elasticsearchconfigurationscript)：[scriptScore クエリ](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-script-score-query.html) を使用。
  この実装はコサイン類似度を使用します。
- [`ElasticsearchConfigurationFullText`](#elasticsearchconfigurationfulltext)：[全文検索](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-match-query) を使用
  （コンテンツリトリーバー専用）。
- [`ElasticsearchConfigurationHybrid`](#elasticsearchconfigurationhybrid)：[ハイブリッド検索](https://www.elastic.co/search-labs/tutorials/search-tutorial/vector-search/hybrid-search) を使用
  （コンテンツリトリーバー専用、有料ライセンスが必要）。kNN ベクトルクエリと全文クエリを組み合わせます。

設定インスタンスを作成するには、各実装が提供する builder を使用できます。例：

```java
ElasticsearchConfiguration configuration = ElasticsearchConfigurationKnn.builder().build();
```

### ElasticsearchConfigurationKnn

`ElasticsearchConfigurationKnn` は近似 kNN クエリでベクトル類似度検索を行います。

[`ElasticsearchEmbeddingStore`](#elasticsearchembeddingstore)
および [`ElasticsearchContentRetriever`](#elasticsearchcontentretriever) のデフォルト設定です。

インスタンスを作成するには builder を使用します：

```java
ElasticsearchConfiguration configuration = ElasticsearchConfigurationKnn.builder().build();
```

次のオプションがあります：

* `numCandidates`：検索中に考慮する候補近傍の数。デフォルトは `null` で、
  Elasticsearch のデフォルト値を使用します。
* `includeVectorResponse`：検索レスポンスにベクトルフィールドを含めるかどうか。デフォルトは `false`。

> **注意：**
> Elasticsearch サーバー 9.2 以降では、ベクトルフィールドはデフォルトでレスポンスから除外されます。レスポンスに
> ベクトルフィールドを含める場合（非推奨）は、builder で `includeVectorResponse` を設定してください：
>
> ```java
> ElasticsearchConfigurationKnn configuration = ElasticsearchConfigurationKnn.builder()
>     .includeVectorResponse(true)
>     .build();
> ```

### ElasticsearchConfigurationScript

`ElasticsearchConfigurationScript` は scriptScore クエリでベクトル類似度検索を行います。この
実装はコサイン類似度を使用します。

[`ElasticsearchEmbeddingStore`](#elasticsearchembeddingstore)
および [`ElasticsearchContentRetriever`](#elasticsearchcontentretriever) の両方で利用できます。

インスタンスを作成するには builder を使用します：

```java
ElasticsearchConfiguration configuration = ElasticsearchConfigurationScript.builder().build();
```

次のオプションがあります：

* `includeVectorResponse`：検索レスポンスにベクトルフィールドを含めるかどうか。デフォルトは `false`。

> **注意：**
> Elasticsearch サーバー 9.2 以降では、ベクトルフィールドはデフォルトでレスポンスから除外されます。レスポンスに
> ベクトルフィールドを含める場合（非推奨）は、builder で `includeVectorResponse` を設定してください：
>
> ```java
> ElasticsearchConfiguration configuration = ElasticsearchConfigurationScript.builder()
>     .includeVectorResponse(true)
>     .build();
> ```

### ElasticsearchConfigurationFullText

`ElasticsearchConfigurationFullText` は全文検索で関連ドキュメントを取得します。

[`ElasticsearchContentRetriever`](#elasticsearchcontentretriever) 専用です。

インスタンスを作成するには builder を使用します：

```java
ElasticsearchConfiguration configuration = ElasticsearchConfigurationFullText.builder().build();
```

### ElasticsearchConfigurationHybrid

`ElasticsearchConfigurationHybrid` はハイブリッド検索で kNN ベクトルクエリと全文クエリを組み合わせます。
ハイブリッド検索には Elasticsearch のエンタープライズライセンスまたはトライアルが必要です。

[`ElasticsearchContentRetriever`](#elasticsearchcontentretriever) 専用です。

インスタンスを作成するには builder を使用します：

```java
ElasticsearchConfiguration configuration = ElasticsearchConfigurationHybrid.builder().build();
```

次のオプションがあります：

* `numCandidates`：検索中に考慮する候補近傍の数。デフォルトは `null` で、
  Elasticsearch のデフォルト値を使用します。
* `includeVectorResponse`：検索レスポンスにベクトルフィールドを含めるかどうか。デフォルトは `false`。

> **注意：**
> Elasticsearch サーバー 9.2 以降では、ベクトルフィールドはデフォルトでレスポンスから除外されます。レスポンスに
> ベクトルフィールドを含める場合（非推奨）は、builder で `includeVectorResponse` を設定してください：
>
> ```java
> ElasticsearchConfiguration configuration = ElasticsearchConfigurationHybrid.builder()
>     .includeVectorResponse(true)
>     .build();
> ```

### カスタム設定の作成

`ElasticsearchConfiguration` インターフェースを実装して、独自の Elasticsearch 設定を作成できます。例：

```java
public class MyElasticsearchConfiguration implements ElasticsearchConfiguration {
    @Override
    SearchResponse<Document> vectorSearch(
            ElasticsearchClient client,
            String indexName,
            EmbeddingSearchRequest embeddingSearchRequest) {
        // Your optional custom vector search implementation here
    }

    @Override
    SearchResponse<Document> fullTextSearch(
            ElasticsearchClient client, 
            String indexName, 
            String textQuery) {
        // Your optional custom full text search implementation here
    }

    @Override
    SearchResponse<Document> hybridSearch(
            ElasticsearchClient client,
            String indexName,
            EmbeddingSearchRequest embeddingSearchRequest,
            String textQuery) {
        // Your optional custom hybrid search implementation here
    }
}
```

ユースケースに関連するメソッドだけを実装すれば十分です：

* `vectorSearch`：ベクトル類似度検索用（`ElasticsearchEmbeddingStore` と `ElasticsearchContentRetriever` の両方で使用）。
* `fullTextSearch`：全文検索用（`ElasticsearchContentRetriever` 専用）。
* `hybridSearch`：ハイブリッド検索用（`ElasticsearchContentRetriever` 専用）。

## 例

- [ElasticsearchEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/elasticsearch-example/src/main/java/ElasticsearchEmbeddingStoreExample.java)
- [ElasticsearchEmbeddingStoreWithScriptExample](https://github.com/langchain4j/langchain4j-examples/blob/main/elasticsearch-example/src/main/java/ElasticsearchEmbeddingStoreWithScriptExample.java)
