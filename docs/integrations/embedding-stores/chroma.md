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
    <version>1.0.0-beta4</version>
</dependency>
```

## API

- `ChromaEmbeddingStore`


## 例

- [ChromaEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/chroma-example/src/main/java/ChromaEmbeddingStoreExample.java)

## 現在の制限

- Chromaは英数字メタデータの大小比較によるフィルタリングができません。intとfloatのみサポートされています
- Chromaの「ではない」フィルタリングは次のように動作します：「key」が「a」と等しくないでフィルタリングすると、実際には「key」!= 「a」の値を持つすべての項目が返されますが、「key」メタデータを持たない項目は返されません！
