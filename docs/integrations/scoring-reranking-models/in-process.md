---
sidebar_position: 1
---

# プロセス内（ONNX）

LangChain4jは、[ONNXランタイム](https://onnxruntime.ai/docs/get-started/with-java.html)を利用した、同じJavaプロセス内で実行されるローカルスコアリング（再ランキング）モデルを提供しています。

ONNX形式である限り、[Hugging Face](https://huggingface.co/)などの多くのモデルを使用できます。

モデルをONNX形式に変換する方法に関する情報は[こちら](https://huggingface.co/docs/optimum/exporters/onnx/usage_guides/export_a_model)で見つけることができます。

ONNX形式に既に変換された多くのモデルは[こちら](https://huggingface.co/Xenova)で利用可能です。

### 使用方法

デフォルトでは、スコアリング（再ランキング）モデルはCPUを使用します。
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-onnx-scoring</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```
```java
String pathToModel = "/home/langchain4j/model.onnx";
String pathToTokenizer = "/home/langchain4j/tokenizer.json";
OnnxScoringModel scoringModel = new OnnxScoringModel(pathToModel, pathToTokenizer);

Response<Double> response = scoringModel.score("query", "passage");
Double score = response.content();
```

GPUを使用したい場合は、`onnxruntime_gpu`バージョンを[こちら](https://onnxruntime.ai/docs/execution-providers/CUDA-ExecutionProvider.html)で見つけることができます。
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-onnx-scoring</artifactId>
    <version>1.0.0-beta4</version>
    <exclusions>
        <exclusion>
            <groupId>com.microsoft.onnxruntime</groupId>
            <artifactId>onnxruntime</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- 1.18.0はCUDA 12.xをサポート -->
<dependency>
    <groupId>com.microsoft.onnxruntime</groupId>
    <artifactId>onnxruntime_gpu</artifactId>
    <version>1.18.0</version>
</dependency>
```

```java
String pathToModel = "/home/langchain4j/model.onnx";
String pathToTokenizer = "/home/langchain4j/tokenizer.json";

OrtSession.SessionOptions options = new OrtSession.SessionOptions();
options.addCUDA(0);
OnnxScoringModel scoringModel = new OnnxScoringModel(pathToModel, options, pathToTokenizer);

Response<Double> response = scoringModel.score("query", "passage");
Double score = response.content();
```
