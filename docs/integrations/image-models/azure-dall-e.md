---
sidebar_position: 1
---

# Azure OpenAI Dall·E

:::note

これは`Azure OpenAI`統合のドキュメントで、MicrosoftのAzure SDKを使用しており、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最適です。

LangChain4jは画像生成のためにOpenAIとの3つの異なる統合を提供しており、これは#3です：

- [OpenAI](/integrations/language-models/open-ai)はOpenAI REST APIのカスタムJava実装を使用し、Quarkus（Quarkus RESTクライアントを使用）とSpring（SpringのRestClientを使用）で最もよく機能します。

- [OpenAI 公式 SDK](/integrations/language-models/open-ai-official)は公式OpenAI Java SDKを使用します。
- [Azure OpenAI](/integrations/language-models/azure-open-ai)はMicrosoftのAzure SDKを使用し、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最適です。

:::

Azure OpenAIはいくつかの画像モデル（`dall-e-3`など）を提供しており、
これらはさまざまな画像処理タスクに使用できます。

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


## `AzureOpenAiImageModel`の作成

### 通常のJava
```java
ImageModel model = AzureOpenAiImageModel.builder()
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .deploymentName("dall-e-3")
        .endpoint("https://langchain4j.openai.azure.com/")
        ...
        .build();
```

### Spring Boot
`application.properties`に追加：
```properties
langchain4j.azure-open-ai.image-model.endpoint=https://langchain4j.openai.azure.com/
langchain4j.azure-open-ai.image-model.service-version=...
langchain4j.azure-open-ai.image-model.api-key=${AZURE_OPENAI_KEY}
langchain4j.azure-open-ai.image-model.deployment-name=dall-e-3
langchain4j.azure-open-ai.image-model.quality=...
langchain4j.azure-open-ai.image-model.size=...
langchain4j.azure-open-ai.image-model.user=...
langchain4j.azure-open-ai.image-model.style=...
langchain4j.azure-open-ai.image-model.response-format=...
langchain4j.azure-open-ai.image-model.timeout=...
langchain4j.azure-open-ai.image-model.max-retries=...
langchain4j.azure-open-ai.image-model.log-requests-and-responses=...
langchain4j.azure-open-ai.image-model.user-agent-suffix=...
langchain4j.azure-open-ai.image-model.customHeaders=...
```


## 例

- [AzureOpenAIDallEExample](https://github.com/langchain4j/langchain4j-examples/blob/main/azure-open-ai-examples/src/main/java/AzureOpenAIDallEExample.java)
