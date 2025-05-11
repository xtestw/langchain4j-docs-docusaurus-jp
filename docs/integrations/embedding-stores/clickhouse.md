---
sidebar_position: 8
---

# ClickHouse

[ClickHouse](https://clickhouse.com/)は、完全なSQLサポートと分析クエリの作成を支援する幅広い機能を備えた、リアルタイムアプリケーションと分析のための最速かつ最も効率的なオープンソースデータベースです。最近追加されたデータ構造と距離検索関数（cosineDistanceなど）、および[近似最近傍検索インデックス](https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/annindexes)により、ClickHouseは高性能でスケーラブルなベクトルデータベースとして使用でき、SQLでベクトルを保存および検索することができます。

## Maven依存関係

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-clickhouse</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

## API

LangChain4jはClickHouseクライアントとして`client-v2`を使用します。`ClickHouseEmbeddingStore`インスタンスを作成するには、`ClickHouseSettings`を提供する必要があります：

```java
// メタデータキーをClickHouseデータ型にマッピングします。
Map<String, ClickHouseDataType> metadataTypeMap = new HashMap<>();

ClickHouseSettings settings = ClickHouseSettings.builder()
    .url("http://localhost:8123")
    .table("langchain4j_table")
    .username(System.getenv("USERNAME"))
    .password(System.getenv("PASSWORD"))
    .dimension(embeddingModel.dimension())
    .metadataTypeMap(metadataTypeMap)
    .build();
```

その後、埋め込みストアを作成できます：

```java
ClickHouseEmbeddingStore embeddingStore = ClickHouseEmbeddingStore.builder()
    .settings(settings)
    .build();
```

## 例

- [ClickHouseEmbeddingStoreIT](https://github.com/langchain4j/langchain4j-community/blob/main/langchain4j-community-clickhouse/src/test/java/dev/langchain4j/community/store/embedding/clickhouse/ClickHouseEmbeddingStoreIT.java)
