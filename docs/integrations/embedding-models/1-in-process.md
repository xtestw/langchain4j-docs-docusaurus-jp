---
sidebar_position: 1
---

# プロセス内（ONNX）

LangChain4jは、Mavenの依存関係としてパッケージ化されたいくつかの人気のあるローカル埋め込みモデルを提供しています。
これらは[ONNXランタイム](https://onnxruntime.ai/docs/get-started/with-java.html)を利用しており、
同じJavaプロセス内で実行されます。

各モデルは2つのバージョンで提供されています：オリジナルと量子化（Mavenアーティファクト名に「-q」のサフィックスがあり、クラス名に「Quantized」が含まれます）。

例：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-embeddings-all-minilm-l6-v2</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```
```java
EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();
Response<Embedding> response = embeddingModel.embed("test");
Embedding embedding = response.content();
```

または量子化バージョン：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-embeddings-all-minilm-l6-v2-q</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```
```java
EmbeddingModel embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel();
Response<Embedding> response = embeddingModel.embed("test");
Embedding embedding = response.content();
```

すべての埋め込みモデルの完全なリストは[こちら](https://github.com/langchain4j/langchain4j-embeddings)で確認できます。


## 並列化

デフォルトでは、埋め込みプロセスは利用可能なすべてのCPUコアを使用して並列化されるため、
各`TextSegment`は別々のスレッドで埋め込まれます。

並列化は`Executor`を使用して行われます。
デフォルトでは、プロセス内埋め込みモデルは、利用可能なプロセッサの数に等しいスレッド数を持つキャッシュされたスレッドプールを使用します。
スレッドは1秒間キャッシュされます。

モデルを作成する際にカスタムの`Executor`インスタンスを提供することができます：
```java
Executor = ...;
EmbeddingModel embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel(executor);
```

GPUを使用した埋め込みはまだサポートされていません。

## カスタムモデル

ONNX形式である限り、[Hugging Face](https://huggingface.co/)などの多くのモデルを使用できます。

モデルをONNX形式に変換する方法に関する情報は[こちら](https://huggingface.co/docs/optimum/exporters/onnx/usage_guides/export_a_model)で見つけることができます。

ONNX形式に既に変換された多くのモデルは[こちら](https://huggingface.co/Xenova)で利用可能です。

カスタム埋め込みモデルを使用する例：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-embeddings</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```
```java
String pathToModel = "/home/langchain4j/model.onnx";
String pathToTokenizer = "/home/langchain4j/tokenizer.json";
PoolingMode poolingMode = PoolingMode.MEAN;
EmbeddingModel embeddingModel = new OnnxEmbeddingModel(pathToModel, pathToTokenizer, poolingMode);

Response<Embedding> response = embeddingModel.embed("test");
Embedding embedding = response.content();
```

## 例

- [InProcessEmbeddingModelExamples](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/embedding/model/InProcessEmbeddingModelExamples.java)
