---
sidebar_position: 3
---

# Azure OpenAI

:::note

これは`Azure OpenAI`統合のドキュメントで、MicrosoftのAzure SDKを使用しており、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最適です。

LangChain4jは埋め込みモデルを使用するためにOpenAIとの4つの異なる統合を提供しており、これは#3です：

- [OpenAI](/integrations/language-models/open-ai)はOpenAI REST APIのカスタムJava実装を使用し、Quarkus（Quarkus RESTクライアントを使用）とSpring（SpringのRestClientを使用）で最もよく機能します。
- [OpenAI 公式 SDK](/integrations/language-models/open-ai-official)は公式OpenAI Java SDKを使用します。
- [Azure OpenAI](/integrations/language-models/azure-open-ai)はMicrosoftのAzure SDKを使用し、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最適です。
- [GitHub Models](/integrations/language-models/github-models)はGitHubモデルにアクセスするためにAzure AI推論APIを使用します。

:::

Azure OpenAIはいくつかの埋め込みモデル（`text-embedding-3-small`、`text-embedding-ada-002`など）を提供しており、
これらはテキストや画像を次元ベクトル空間に変換するために使用できます。

## Maven依存関係

### 通常のJava
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-open-ai</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

### Spring Boot
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-open-ai-spring-boot-starter</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```


## `AzureOpenAiEmbeddingModel`の作成

### 通常のJava
```java
EmbeddingModel model = AzureOpenAiEmbeddingModel.builder()
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .deploymentName("text-embedding-3-small")
        .endpoint("https://langchain4j.openai.azure.com/")
        ...
        .build();
```

### Spring Boot
`application.properties`に追加：
```properties
langchain4j.azure-open-ai.embedding-model.endpoint=https://langchain4j.openai.azure.com/
langchain4j.azure-open-ai.embedding-model.service-version=...
langchain4j.azure-open-ai.embedding-model.api-key=${AZURE_OPENAI_KEY}
langchain4j.azure-open-ai.embedding-model.deployment-name=text-embedding-3-small
langchain4j.azure-open-ai.embedding-model.timeout=...
langchain4j.azure-open-ai.embedding-model.max-retries=...
langchain4j.azure-open-ai.embedding-model.log-requests-and-responses=...
langchain4j.azure-open-ai.embedding-model.user-agent-suffix=...
langchain4j.azure-open-ai.embedding-model.dimensions=...
langchain4j.azure-open-ai.embedding-model.customHeaders=...
```


## 例

- [AzureOpenAiEmbeddingModelExamples](https://github.com/langchain4j/langchain4j-examples/blob/main/azure-open-ai-examples/src/main/java/AzureOpenAiEmbeddingModelExamples.java)
