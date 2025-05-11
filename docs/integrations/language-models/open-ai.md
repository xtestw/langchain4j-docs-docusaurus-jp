---
sidebar_position: 15
---

# OpenAI

:::note

これは`OpenAI`統合のドキュメントで、OpenAI REST APIのカスタムJava実装を使用しています。これはQuarkus（Quarkus RESTクライアントを使用）とSpring（SpringのRestClientを使用）で最もよく機能します。

Quarkusを使用している場合は、[Quarkus LangChain4jドキュメント](https://docs.quarkiverse.io/quarkus-langchain4j/dev/openai.html)を参照してください。

LangChain4jはチャットモデルを使用するためにOpenAIとの4つの異なる統合を提供しており、これは#1です：

- [OpenAI](/integrations/language-models/open-ai)はOpenAI REST APIのカスタムJava実装を使用し、Quarkus（Quarkus RESTクライアントを使用）とSpring（SpringのRestClientを使用）で最もよく機能します。
- [OpenAI 公式 SDK](/integrations/language-models/open-ai-official)は公式OpenAI Java SDKを使用します。
- [Azure OpenAI](/integrations/language-models/azure-open-ai)はMicrosoftのAzure SDKを使用し、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最適です。
- [GitHub Models](/integrations/language-models/github-models)はAzure AI Inference APIを使用してGitHub Modelsにアクセスします。

:::

## OpenAIドキュメント

- [OpenAI APIドキュメント](https://platform.openai.com/docs/introduction)
- [OpenAI APIリファレンス](https://platform.openai.com/docs/api-reference)

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

## APIキー

OpenAIモデルを使用するには、APIキーが必要です。
[こちら](https://platform.openai.com/api-keys)で作成できます。

<details>
<summary>APIキーを持っていない場合はどうすればよいですか？</summary>

独自のOpenAI APIキーを持っていなくても心配いりません。
デモンストレーション目的で無料で提供している`demo`キーを一時的に使用できます。
`demo`キーを使用する場合、OpenAI APIへのすべてのリクエストは当社のプロキシを経由する必要があり、
プロキシは実際のキーを挿入してからリクエストをOpenAI APIに転送します。
当社はお客様のデータを収集したり使用したりすることはありません。
`demo`キーには割り当て量があり、`gpt-4o-mini`モデルに制限されており、デモンストレーション目的でのみ使用すべきです。

```java
OpenAiChatModel model = OpenAiChatModel.builder()
    .baseUrl("http://langchain4j.dev/demo/openai/v1")
    .apiKey("demo")
    .modelName("gpt-4o-mini")
    .build();
```
</details>

## `OpenAiChatModel`の作成

### 通常のJava
```java
ChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();


// ChatRequestParametersまたはOpenAiChatRequestParametersを使用してデフォルトのチャットリクエストパラメータを指定することもできます
ChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .defaultRequestParameters(OpenAiChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .build())
        .build();
```
これにより、指定されたデフォルトパラメータを持つ`OpenAiChatModel`のインスタンスが作成されます。

### Spring Boot
`application.properties`に追加：
```properties
# 必須プロパティ：
langchain4j.open-ai.chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.chat-model.model-name=gpt-4o-mini

# オプションプロパティ：
langchain4j.open-ai.chat-model.base-url=...
langchain4j.open-ai.chat-model.custom-headers=...
langchain4j.open-ai.chat-model.frequency-penalty=...
langchain4j.open-ai.chat-model.log-requests=...
langchain4j.open-ai.chat-model.log-responses=...
langchain4j.open-ai.chat-model.logit-bias=...
langchain4j.open-ai.chat-model.max-retries=...
langchain4j.open-ai.chat-model.max-completion-tokens=...
langchain4j.open-ai.chat-model.max-tokens=...
langchain4j.open-ai.chat-model.metadata=...
langchain4j.open-ai.chat-model.organization-id=...
langchain4j.open-ai.chat-model.parallel-tool-calls=...
langchain4j.open-ai.chat-model.presence-penalty=...
langchain4j.open-ai.chat-model.project-id=...
langchain4j.open-ai.chat-model.reasoning-effort=...
langchain4j.open-ai.chat-model.response-format=...
langchain4j.open-ai.chat-model.seed=...
langchain4j.open-ai.chat-model.service-tier=...
langchain4j.open-ai.chat-model.stop=...
langchain4j.open-ai.chat-model.store=...
langchain4j.open-ai.chat-model.strict-schema=...
langchain4j.open-ai.chat-model.strict-tools=...
langchain4j.open-ai.chat-model.supported-capabilities=...
langchain4j.open-ai.chat-model.temperature=...
langchain4j.open-ai.chat-model.timeout=...
langchain4j.open-ai.chat-model.top-p=
langchain4j.open-ai.chat-model.user=...
```
ほとんどのパラメータの説明は[こちら](https://platform.openai.com/docs/api-reference/chat/create)で確認できます。

この設定により、`OpenAiChatModel`ビーンが作成され、
[AIサービス](https://docs.langchain4j.dev/tutorials/spring-boot-integration/#langchain4j-spring-boot-starter)によって使用されるか、
必要な場所でオートワイヤリングされます。例えば：

```java
@RestController
class ChatModelController {

    ChatModel chatModel;

    ChatModelController(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/model")
    public String model(@RequestParam(value = "message", defaultValue = "Hello") String message) {
        return chatModel.chat(message);
    }
}
```

## 構造化出力
[構造化出力](https://openai.com/index/introducing-structured-outputs-in-the-api/)機能は
[ツール](/tutorials/tools)と[レスポンスフォーマット](/tutorials/ai-services#json-mode)の両方でサポートされています。

構造化出力の詳細については[こちら](/tutorials/structured-outputs)をご覧ください。

### ツール用の構造化出力
ツールの構造化出力機能を有効にするには、モデルを構築する際に`.strictTools(true)`を設定します：
```java
OpenAiChatModel.builder()
    ...
    .strictTools(true)
    .build(),
```
これにより、現在のOpenAIの制限により、すべてのツールパラメータが必須（JSONスキーマでは`required`）になり、
JSONスキーマの各`object`に対して`additionalProperties=false`が設定されることに注意してください。

### レスポンスフォーマット用の構造化出力
AIサービスを使用する際にレスポンスフォーマット用の構造化出力機能を有効にするには、
モデルを構築する際に`.supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)`と`.strictJsonSchema(true)`を設定します：
```java
OpenAiChatModel.builder()
    ...
    .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)
    .strictJsonSchema(true)
    .build();
```
この場合、AIサービスは指定されたPOJOからJSONスキーマを自動的に生成し、それをLLMに渡します。

## `OpenAiStreamingChatModel`の作成

### 通常のJava
```java
StreamingChatModel model = OpenAiStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();

// ChatRequestParametersまたはOpenAiChatRequestParametersを使用してデフォルトのチャットリクエストパラメータを指定することもできます
StreamingChatModel model = OpenAiStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .defaultRequestParameters(OpenAiChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .build())
        .build();
```

### Spring Boot
`application.properties`に追加：
```properties
# 必須プロパティ：
langchain4j.open-ai.streaming-chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.streaming-chat-model.model-name=gpt-4o-mini

# オプションプロパティ：
langchain4j.open-ai.streaming-chat-model.base-url=...
langchain4j.open-ai.streaming-chat-model.custom-headers=...
langchain4j.open-ai.streaming-chat-model.frequency-penalty=...
langchain4j.open-ai.streaming-chat-model.log-requests=...
langchain4j.open-ai.streaming-chat-model.log-responses=...
langchain4j.open-ai.streaming-chat-model.logit-bias=...
langchain4j.open-ai.streaming-chat-model.max-retries=...
langchain4j.open-ai.streaming-chat-model.max-completion-tokens=...
langchain4j.open-ai.streaming-chat-model.max-tokens=...
langchain4j.open-ai.streaming-chat-model.metadata=...
langchain4j.open-ai.streaming-chat-model.organization-id=...
langchain4j.open-ai.streaming-chat-model.parallel-tool-calls=...
langchain4j.open-ai.streaming-chat-model.presence-penalty=...
langchain4j.open-ai.streaming-chat-model.project-id=...
langchain4j.open-ai.streaming-chat-model.reasoning-effort=...
langchain4j.open-ai.streaming-chat-model.response-format=...
langchain4j.open-ai.streaming-chat-model.seed=...
langchain4j.open-ai.streaming-chat-model.service-tier=...
langchain4j.open-ai.streaming-chat-model.stop=...
langchain4j.open-ai.streaming-chat-model.store=...
langchain4j.open-ai.streaming-chat-model.strict-schema=...
langchain4j.open-ai.streaming-chat-model.strict-tools=...
langchain4j.open-ai.streaming-chat-model.temperature=...
langchain4j.open-ai.streaming-chat-model.timeout=...
langchain4j.open-ai.streaming-chat-model.top-p=...
langchain4j.open-ai.streaming-chat-model.user=...
```


## `OpenAiModerationModel`の作成

### 通常のJava
```java
ModerationModel model = OpenAiModerationModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("text-moderation-stable")
        .build();
```

### Spring Boot
`application.properties`に追加：
```properties
# 必須プロパティ：
langchain4j.open-ai.moderation-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.moderation-model.model-name=text-moderation-stable

# オプションプロパティ：
langchain4j.open-ai.moderation-model.base-url=...
langchain4j.open-ai.moderation-model.custom-headers=...
langchain4j.open-ai.moderation-model.log-requests=...
langchain4j.open-ai.moderation-model.log-responses=...
langchain4j.open-ai.moderation-model.max-retries=...
langchain4j.open-ai.moderation-model.organization-id=...
langchain4j.open-ai.moderation-model.project-id=...
langchain4j.open-ai.moderation-model.timeout=...
```


## `OpenAiTokenCountEstimator`の作成

```java
TokenCountEstimator tokenCountEstimator = new OpenAiTokenCountEstimator("gpt-4o-mini");
```


## HTTPクライアント

### 通常のJava
`langchain4j-open-ai`モジュールを使用する場合、
JDKの`java.net.http.HttpClient`がデフォルトのHTTPクライアントとして使用されます。

カスタマイズしたり、他の任意のHTTPクライアントを使用したりすることができます。
詳細は[こちら](/tutorials/customizable-http-client)で確認できます。

### Spring Boot
`langchain4j-open-ai-spring-boot-starter` Spring Bootスターターを使用する場合、
Springの`RestClient`がデフォルトのHTTPクライアントとして使用されます。

カスタマイズしたり、他の任意のHTTPクライアントを使用したりすることができます。
詳細は[こちら](/tutorials/customizable-http-client)で確認できます。

## 例
- [OpenAI の例](https://github.com/langchain4j/langchain4j-examples/tree/main/open-ai-examples/src/main/java)
