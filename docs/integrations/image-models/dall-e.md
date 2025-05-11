---
sidebar_position: 2
---

# OpenAI Dall·E

:::note

これは`OpenAI`統合のドキュメントで、OpenAI REST APIのカスタムJava実装を使用しています。これはQuarkus（Quarkus RESTクライアントを使用）とSpring（SpringのRestClientを使用）で最もよく機能します。


LangChain4jは画像生成のためにOpenAIとの3つの異なる統合を提供しており、これは#1です：

- [OpenAI](/integrations/language-models/open-ai)はOpenAI REST APIのカスタムJava実装を使用し、Quarkus（Quarkus RESTクライアントを使用）とSpring（SpringのRestClientを使用）で最もよく機能します。

- [OpenAI 公式 SDK](/integrations/language-models/open-ai-official)は公式OpenAI Java SDKを使用します。
- [Azure OpenAI](/integrations/language-models/azure-open-ai)はMicrosoftのAzure SDKを使用し、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最適です。

:::

## Maven依存関係

### 通常のJava
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>1.0.0-rc1</version>
</dependency>
```

### Spring Boot
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```


## `OpenAiImageModel`の作成

### 通常のJava
```java
ImageModel model = OpenAiImageModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("dall-e-3")
        .build();
```

### Spring Boot
`application.properties`に追加：
```properties
# 必須プロパティ：
langchain4j.open-ai.image-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.image-model.model-name=dall-e-3

# オプションプロパティ：
langchain4j.open-ai.image-model.base-url=...
langchain4j.open-ai.image-model.custom-headers=...
langchain4j.open-ai.image-model.log-requests=...
langchain4j.open-ai.image-model.log-responses=...
langchain4j.open-ai.image-model.max-retries=...
langchain4j.open-ai.image-model.organization-id=...
langchain4j.open-ai.image-model.project-id=...
langchain4j.open-ai.image-model.quality=...
langchain4j.open-ai.image-model.response-format=...
langchain4j.open-ai.image-model.size=...
langchain4j.open-ai.image-model.style=...
langchain4j.open-ai.image-model.timeout=...
langchain4j.open-ai.image-model.user=...
```

## 例

- [OpenAiImageModelExamples](https://github.com/langchain4j/langchain4j-examples/blob/main/open-ai-examples/src/main/java/OpenAiImageModelExamples.java)
