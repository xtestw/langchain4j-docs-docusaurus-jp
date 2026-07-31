---
sidebar_position: 14
---

# Ollama

https://ollama.com/


## Maven 依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-ollama</artifactId>
    <version>1.18.1</version>
</dependency>
```

## API

- `OllamaEmbeddingModel`

## 使い方

```java
EmbeddingModel embeddingModel = OllamaEmbeddingModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("all-minilm")
    .build();

Response<Embedding> response = embeddingModel.embed("Hello, world!");
Embedding embedding = response.content();
```

## リクエスト/レスポンス API と可観測性

`OllamaEmbeddingModel` は便利メソッドに加え `embed(EmbeddingRequest)` もサポートします。Ollama の埋め込み API はテキストのみのため、入力タイプや画像入力を設定したリクエストは `UnsupportedFeatureException` で即座に失敗します。トークン使用量（`prompt_eval_count`）はレスポンスのメタデータに報告されます。

Ollama のオプション出力 `dimensions` はモデル依存（出力サイズ縮小をサポートするモデルのみ）のため、呼び出しごとのパラメータではなく、ビルダーの `.dimensions(...)` で設定します。

[listeners](/tutorials/observability#embeddingmodel-observability) を付けてリクエスト・レスポンス・エラーを観測できます：

```java
EmbeddingModel embeddingModel = OllamaEmbeddingModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("all-minilm")
    .listeners(List.of(myEmbeddingModelListener))
    .build();
```


## 例

- [OllamaEmbeddingModelIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-ollama/src/test/java/dev/langchain4j/model/ollama/OllamaEmbeddingModelIT.java)
