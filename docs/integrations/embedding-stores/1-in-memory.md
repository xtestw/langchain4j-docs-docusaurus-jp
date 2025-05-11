---
sidebar_position: 1
---

# インメモリ

LangChain4jは`EmbeddingStore`インターフェースの簡単なインメモリ実装を提供しています：
`InMemoryEmbeddingStore`。
これは迅速なプロトタイピングと単純なユースケースに役立ちます。
`Embedding`と関連する`TextSegment`をメモリ内に保持します。
検索もメモリ内で実行されます。
JSONの文字列やファイルへの保存と復元も可能です。

### Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.0.0-rc1</version>
</dependency>
```

## API

- `InMemoryEmbeddingStore` 


## 永続化

`InMemoryEmbeddingStore`はJSON文字列またはファイルにシリアライズできます：
```java
InMemoryEmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();
embeddingStore.addAll(embeddings, embedded);

String serializedStore = embeddingStore.serializeToJson();
InMemoryEmbeddingStore<TextSegment> deserializedStore = InMemoryEmbeddingStore.fromJson(serializedStore);

String filePath = "/home/me/store.json";
embeddingStore.serializeToFile(filePath);
InMemoryEmbeddingStore<TextSegment> deserializedStore = InMemoryEmbeddingStore.fromFile(filePath);
```

## 例

- [InMemoryEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/embedding/store/InMemoryEmbeddingStoreExample.java)
