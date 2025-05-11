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
    <version>1.0.0-beta4</version>
</dependency>
```


## API

`ElasticsearchEmbeddingStore`には2つの実装があります：

* `ElasticsearchConfigurationKnn`設定クラスを使用した近似[kNNクエリ](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-knn-query.html)（デフォルト）。
* `ElasticsearchConfigurationScript`設定クラスを使用した[scriptScoreクエリ](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-script-score-query.html)。この実装はコサイン類似度を使用していることに注意してください。

### 共通オプション

`ElasticsearchEmbeddingStore`インスタンスを作成するには、Elasticsearchの`RestClient`を提供する必要があります：

```java
String apiKey = "VnVhQ2ZHY0JDZGJrU...";
RestClient restClient = RestClient
    .builder(HttpHost.create("https://localhost:9200"))
    .setDefaultHeaders(new Header[]{
        new BasicHeader("Authorization", "ApiKey " + apiKey)
    })
    .build();
```

**注意：**

> RestClientインスタンスの作成方法については、[Elasticsearchドキュメント](https://www.elastic.co/guide/en/elasticsearch/client/java-api-client/current/connecting.html)を参照してください。

その後、埋め込みストアを作成できます。デフォルトでは近似kNNクエリ実装を使用します。

```java
ElasticsearchEmbeddingStore store = ElasticsearchEmbeddingStore.builder()
        .restClient(restClient)
        .build();
```

### ElasticsearchConfigurationKnn設定（デフォルト）

前述のコードは以下と同等です：

```java
ElasticsearchEmbeddingStore store = ElasticsearchEmbeddingStore.builder()
        .configuration(ElasticsearchConfigurationKnn.builder().build())
        .restClient(restClient)
        .build();
```

### ElasticsearchConfigurationScript設定

以前の、より遅い動作を使用したい場合は、`ElasticsearchConfigurationScript`設定クラスを使用できます：

```java
ElasticsearchEmbeddingStore store = ElasticsearchEmbeddingStore.builder()
        .configuration(ElasticsearchConfigurationScript.builder().build())
        .restClient(restClient)
        .build();
```

## 例

- [ElasticsearchEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/elasticsearch-example/src/main/java/ElasticsearchEmbeddingStoreExample.java)
