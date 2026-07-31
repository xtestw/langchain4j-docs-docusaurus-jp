---
sidebar_position: 17
---

# OpenSearch

https://opensearch.org/


## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-opensearch</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```


## API

`OpenSearchEmbeddingStore` は、類似度検索に exact k-NN とスコアリングスクリプト実装を使用します。
詳細は [OpenSearch k-NN ドキュメント](https://opensearch.org/docs/latest/search-plugins/knn/knn-score-script/) を参照してください。

### 機能

- **メタデータフィルタリング**：`Filter` API を使ってメタデータで検索結果を絞り込める
- **削除操作**：
  - ID による埋め込みの削除
  - メタデータフィルタによる埋め込みの削除
  - すべての埋め込みの削除（インデックスを削除）
- **AWS サポート**：Amazon OpenSearch Service および Amazon OpenSearch Serverless をネイティブサポート

### 基本的な使い方

ローカルまたはネットワーク経由で到達可能な OpenSearch 向けに `OpenSearchEmbeddingStore` インスタンスを作成する：

```java
OpenSearchEmbeddingStore store = OpenSearchEmbeddingStore.builder()
        .serverUrl("http://localhost:9200")
        .indexName("my-embeddings")
        .build();
```

認証付き：

```java
OpenSearchEmbeddingStore store = OpenSearchEmbeddingStore.builder()
        .serverUrl("https://my-opensearch.example.com:9200")
        .userName("admin")
        .password("admin")
        .indexName("my-embeddings")
        .build();
```

### AWS OpenSearch

Amazon OpenSearch Service または OpenSearch Serverless 向け：

```java
AwsSdk2TransportOptions options = AwsSdk2TransportOptions.builder()
        .setCredentials(DefaultCredentialsProvider.create())
        .build();

OpenSearchEmbeddingStore store = OpenSearchEmbeddingStore.builder()
        .serverUrl("https://search-domain.us-east-1.es.amazonaws.com")
        .serviceName("es") // or "aoss" for Serverless
        .region("us-east-1")
        .options(options)
        .indexName("my-embeddings")
        .build();
```

### メタデータフィルタリング

メタデータで検索結果を絞り込む：

```java
Filter filter = metadataKey("category").isEqualTo("documentation");

EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .filter(filter)
        .maxResults(10)
        .build();

EmbeddingSearchResult<TextSegment> result = store.search(searchRequest);
```

サポートされるフィルタ操作：
- 比較：`isEqualTo`、`isNotEqualTo`、`isGreaterThan`、`isGreaterThanOrEqualTo`、`isLessThan`、`isLessThanOrEqualTo`
- コレクション：`isIn`、`isNotIn`
- 論理：`and`、`or`、`not`

### 削除操作

ID による埋め込みの削除：
```java
store.removeAll(List.of("id1", "id2", "id3"));
```

メタデータフィルタによる埋め込みの削除：
```java
Filter filter = metadataKey("status").isEqualTo("archived");
store.removeAll(filter);
```

すべての埋め込みの削除（インデックスを削除）：
```java
store.removeAll();
```


## 例

- [OpenSearchEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/opensearch-example/src/main/java/OpenSearchEmbeddingStoreExample.java)
