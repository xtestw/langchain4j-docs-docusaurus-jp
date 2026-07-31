---
sidebar_position: 7
---

# Chroma

https://www.trychroma.com/


## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-chroma</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## API

- `ChromaEmbeddingStore`


## 例

- [ChromaEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/chroma-example/src/main/java/ChromaEmbeddingStoreExample.java)

## サポートされているAPIバージョン
Chromaには複数のREST APIバージョンがあります：
- バージョン0.5.16まで：API V1のみサポート
- バージョン0.5.16から0.6.3：API V1とV2をサポート（0.6.2付近で導入されたV1 APIにいくつかのバグあり）
- バージョン0.7.0以降：API V2のみサポートのため、`ChromaEmbeddingStore`を構成する際に適切なバージョンを選択する必要があります：
```java
ChromaEmbeddingStore.builder()
    .apiVersion(ChromaApiVersion.V2)
    .baseUrl(...)
    .tenantName(...)
    .databaseName(...)
    .collectionName(...)
    .build();
```

## 現在の制限事項

- Chromaは英数字メタデータの大なり・小なりによるフィルタリングができず、intとfloatのみサポート
- Chromaの*not*によるフィルタリングは次のとおりです："key"が"a"と等しくないでフィルタリングすると、
  実際には"key"の値 != "a"のすべての項目が返されますが、"key"メタデータがない項目は返されません！
