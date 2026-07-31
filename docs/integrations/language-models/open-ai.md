---
sidebar_position: 15
---

# OpenAI

:::note

これは `OpenAI` 連携のドキュメントです。OpenAI REST API のカスタム Java 実装を使い、Quarkus（Quarkus REST クライアント）および Spring（Spring の RestClient）で最もよく動作します。

Quarkus を使っている場合は、
[Quarkus LangChain4j ドキュメント](https://docs.quarkiverse.io/quarkus-langchain4j/dev/openai.html) を参照してください。

LangChain4j はチャットモデル用に 3 種類の OpenAI 連携を提供しており、本ドキュメントは #1 です：

- [OpenAI](/integrations/language-models/open-ai) は OpenAI REST API のカスタム Java 実装を使い、Quarkus（Quarkus REST クライアント）と Spring（Spring RestClient）で最もよく動作します。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official) は公式 OpenAI Java SDK を使います。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) は Microsoft の Azure SDK を使い、高度な Azure 認証を含む Microsoft Java スタックを使う場合に最適です。

:::

## OpenAI ドキュメント

- [OpenAI API ドキュメント](https://platform.openai.com/docs/introduction)
- [OpenAI API リファレンス](https://platform.openai.com/docs/api-reference)

## Maven依存関係

### Plain Java

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>1.18.1</version>
</dependency>
```

### Spring Boot

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## API キー

OpenAI モデルを使うには API キーが必要です。
[こちら](https://platform.openai.com/api-keys) で作成できます。

<details>
<summary>API キーがない場合は？</summary>

独自の OpenAI API キーがなくても問題ありません。
デモ目的で無料提供している `demo` キーを一時的に使えます。
`demo` キー使用時は、OpenAI API へのすべてのリクエストが当社プロキシ経由になり、
OpenAI API に転送する前に実際のキーが注入されます。
データを収集・利用することはありません。
`demo` キーにはクォータがあり、`gpt-4o-mini` モデルに制限され、デモ目的でのみ使用してください。



```java
OpenAiChatModel model = OpenAiChatModel.builder()
    .baseUrl("http://langchain4j.dev/demo/openai/v1")
    .apiKey("demo")
    .modelName("gpt-4o-mini")
    .build();
```
</details>

## `OpenAiChatModel` の作成

### Plain Java

```java
ChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();


// You can also specify default chat request parameters using ChatRequestParameters or OpenAiChatRequestParameters
ChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .defaultRequestParameters(OpenAiChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .build())
        .build();
```
指定したデフォルトパラメータで `OpenAiChatModel` のインスタンスが作成されます。

### Spring Boot
`application.properties` に追加：

```properties
# Mandatory properties:
langchain4j.open-ai.chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.chat-model.model-name=gpt-4o-mini

# Optional properties:
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
langchain4j.open-ai.chat-model.return-thinking=...
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

# Optional Property: Custom Parameters (user-defined key=value) 
langchain4j.open-ai.chat-model.custom-parameters.<key>=<value>
```
上記パラメータの多くは [こちら](https://platform.openai.com/docs/api-reference/chat/create) で説明されています。

この設定により `OpenAiChatModel` bean が作成され、
[AI Service](https://docs.langchain4j.dev/tutorials/spring-boot-integration/#langchain4j-spring-boot-starter)
で使うか、必要な場所にオートワイヤできます。例：

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

## Structured Outputs
[Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) 機能は
[ツール](/tutorials/tools) と [レスポンス形式](/tutorials/ai-services#json-mode) の両方でサポートされます。

Structured Outputs の詳細は [こちら](/tutorials/structured-outputs)。

### ツール向け Structured Outputs
ツール向けに Structured Outputs を有効にするには、モデル構築時に `.strictTools(true)` を設定します：

```java
OpenAiChatModel.builder()
    ...
    .strictTools(true)
    .build(),
```
これにより、すべてのツールパラメータが自動的に必須（JSON スキーマの `required`）になり、
JSON スキーマ内の各 `object` で `additionalProperties=false` が設定されます。これは現行の OpenAI の制限によるものです。

### レスポンス形式向け Structured Outputs
AI Services 使用時にレスポンス形式向け Structured Outputs を有効にするには、
モデル構築時に `.supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)` と `.strictJsonSchema(true)` を設定します：

```java
OpenAiChatModel.builder()
    ...
    .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)
    .strictJsonSchema(true)
    .build();
```
この場合、AI Service は指定された POJO から JSON スキーマを自動生成し、LLM に渡します。

### Thinking / Reasoning
この設定は [DeepSeek](https://api-docs.deepseek.com/guides/reasoning_model) 向けです。

`OpenAiChatModel` または `OpenAiStreamingChatModel` 構築時に `returnThinking` パラメータを有効にすると、
DeepSeek API レスポンスの `reasoning_content` フィールドが解析され、
`AiMessage.thinking()` 内に返されます。

`OpenAiStreamingChatModel` で `returnThinking` を有効にすると、
DeepSeek API が `reasoning_content` をストリームする際に
`StreamingChatResponseHandler.onPartialThinking()` と `TokenStream.onPartialThinking()`
コールバックが呼び出されます。

thinking の設定例：

```java
ChatModel model = OpenAiChatModel.builder()
        .baseUrl("https://api.deepseek.com/v1")
        .apiKey(System.getenv("DEEPSEEK_API_KEY"))
        .modelName("deepseek-reasoner")
        .returnThinking(true)
        .build();
```

`OpenAiChatModel` または `OpenAiStreamingChatModel` 構築時に `sendThinking` パラメータを有効にすると、
`AiMessage.thinking()` が DeepSeek API へのリクエストに送られます。
フィールド名は `sendThinking(boolean, String)` ビルダーメソッドで設定できます。
デフォルトでは `reasoning_content` フィールド名が使われます。

## `OpenAiStreamingChatModel` の作成

### Plain Java

```java
StreamingChatModel model = OpenAiStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();

// You can also specify default chat request parameters using ChatRequestParameters or OpenAiChatRequestParameters
StreamingChatModel model = OpenAiStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .defaultRequestParameters(OpenAiChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .build())
        .build();
```

### Spring Boot
`application.properties` に追加：

```properties
# Mandatory properties:
langchain4j.open-ai.streaming-chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.streaming-chat-model.model-name=gpt-4o-mini

# Optional properties:
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
langchain4j.open-ai.streaming-chat-model.return-thinking=...
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

# Optional Property: Custom Parameters (user-defined key=value) 
langchain4j.open-ai.streaming-chat-model.custom-parameters.<key>=<value>
```


## `OpenAiModerationModel` の作成

### Plain Java

```java
ModerationModel model = OpenAiModerationModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("text-moderation-stable")
        .build();
```

### Spring Boot
`application.properties` に追加：

```properties
# Mandatory properties:
langchain4j.open-ai.moderation-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.moderation-model.model-name=text-moderation-stable

# Optional properties:
langchain4j.open-ai.moderation-model.base-url=...
langchain4j.open-ai.moderation-model.custom-headers=...
langchain4j.open-ai.moderation-model.log-requests=...
langchain4j.open-ai.moderation-model.log-responses=...
langchain4j.open-ai.moderation-model.max-retries=...
langchain4j.open-ai.moderation-model.organization-id=...
langchain4j.open-ai.moderation-model.project-id=...
langchain4j.open-ai.moderation-model.timeout=...
```


## `OpenAiTextToSpeechModel` の作成

`OpenAiTextToSpeechModel` は
[OpenAI Speech API](https://platform.openai.com/docs/api-reference/audio/createSpeech)
を使ってテキスト読み上げ（TTS）を行います。
生成された音声を生バイトとして `Audio` オブジェクトに包んで返します。

サポートモデルは `tts-1`、`tts-1-hd`、`gpt-4o-mini-tts`、`gpt-4o-mini-tts-2025-12-15`
（`OpenAiTextToSpeechModelName` を参照）。デフォルトの声は `alloy` です。

### Plain Java

```java
import dev.langchain4j.model.audio.TextToSpeechModel;
import dev.langchain4j.model.audio.TextToSpeechRequest;
import dev.langchain4j.model.audio.TextToSpeechResponse;
import dev.langchain4j.model.openai.OpenAiTextToSpeechModel;
import dev.langchain4j.model.openai.OpenAiTextToSpeechModelName;

TextToSpeechModel model = OpenAiTextToSpeechModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(OpenAiTextToSpeechModelName.TTS_1)
        .voice("alloy") // optional, defaults to "alloy"
        .build();

// Convenience method (uses the model's default voice):
TextToSpeechResponse response = model.synthesize("Hello world!");

// Or with an explicit request (the voice here overrides the model default):
TextToSpeechRequest request = TextToSpeechRequest.builder()
        .text("Hello world!")
        .voice("nova")
        .build();
TextToSpeechResponse response2 = model.synthesize(request);

byte[] audioBytes = response.audio().binaryData(); // e.g. write to an .mp3 file
String mimeType = response.audio().mimeType();      // e.g. "audio/mpeg"
```

入力テキストは 4096 文字を超えてはなりません（OpenAI Speech API の制限）。
長い入力は `IllegalArgumentException` になります。

## `OpenAiTextToSpeechModel` の作成

`OpenAiTextToSpeechModel` は
[OpenAI Speech API](https://platform.openai.com/docs/api-reference/audio/createSpeech)
を使ってテキスト読み上げ（TTS）を行います。
生成された音声を生バイトとして `Audio` オブジェクトに包んで返します。

サポートモデルは `tts-1`、`tts-1-hd`、`gpt-4o-mini-tts`、`gpt-4o-mini-tts-2025-12-15`
（`OpenAiTextToSpeechModelName` を参照）。デフォルトの声は `alloy` です。

### Plain Java

```java
import dev.langchain4j.model.audio.TextToSpeechModel;
import dev.langchain4j.model.audio.TextToSpeechRequest;
import dev.langchain4j.model.audio.TextToSpeechResponse;
import dev.langchain4j.model.openai.OpenAiTextToSpeechModel;
import dev.langchain4j.model.openai.OpenAiTextToSpeechModelName;

TextToSpeechModel model = OpenAiTextToSpeechModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(OpenAiTextToSpeechModelName.TTS_1)
        .voice("alloy") // optional, defaults to "alloy"
        .build();

// Convenience method (uses the model's default voice):
TextToSpeechResponse response = model.synthesize("Hello world!");

// Or with an explicit request (the voice here overrides the model default):
TextToSpeechRequest request = TextToSpeechRequest.builder()
        .text("Hello world!")
        .voice("nova")
        .build();
TextToSpeechResponse response2 = model.synthesize(request);

byte[] audioBytes = response.audio().binaryData(); // e.g. write to an .mp3 file
String mimeType = response.audio().mimeType();      // e.g. "audio/mpeg"
```

入力テキストは 4096 文字を超えてはなりません（OpenAI Speech API の制限）。
長い入力は `IllegalArgumentException` になります。

## `OpenAiTokenCountEstimator` の作成


```java
TokenCountEstimator tokenCountEstimator = new OpenAiTokenCountEstimator("gpt-4o-mini");
```

## カスタムチャットリクエストパラメータの設定

`OpenAiChatModel` と `OpenAiStreamingChatModel` を使うとき、
HTTP リクエストの JSON ボディ内のチャットリクエストにカスタムパラメータを設定できます。
ウェブ検索を有効にする例：

```java
record ApproximateLocation(String city) {}
record UserLocation(String type, ApproximateLocation approximate) {}
record WebSearchOptions(UserLocation user_location) {}
WebSearchOptions webSearchOptions = new WebSearchOptions(new UserLocation("approximate", new ApproximateLocation("London")));
Map<String, Object> customParameters = Map.of("web_search_options", webSearchOptions);

ChatRequest chatRequest = ChatRequest.builder()
    .messages(UserMessage.from("Where can I buy good coffee?"))
    .parameters(OpenAiChatRequestParameters.builder()
        .modelName("gpt-4o-mini-search-preview")
        .customParameters(customParameters)
        .build())
    .build();

ChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .logRequests(true)
        .build();

ChatResponse chatResponse = model.chat(chatRequest);
```

次のボディを持つ HTTP リクエストが生成されます：

```json
{
  "model" : "gpt-4o-mini-search-preview",
  "messages" : [ {
    "role" : "user",
    "content" : "Where can I buy good coffee?"
  } ],
  "web_search_options" : {
    "user_location" : {
      "type" : "approximate",
      "approximate" : {
        "city" : "London"
      }
    }
  }
}
```

あるいは、カスタムパラメータをネストした map 構造としても指定できます：

```java
Map<String, Object> customParameters = Map.of(
    "web_search_options", Map.of(
        "user_location", Map.of(
            "type", "approximate",
            "approximate", Map.of("city", "London")
        )
    )
);
```

## 生の HTTP レスポンスと Server-Sent Events（SSE）へのアクセス

`OpenAiChatModel` 使用時、生の HTTP レスポンスにアクセスできます：

```java
SuccessfulHttpResponse rawHttpResponse = ((OpenAiChatResponseMetadata) chatResponse.metadata()).rawHttpResponse();
System.out.println(rawHttpResponse.body());
System.out.println(rawHttpResponse.headers());
System.out.println(rawHttpResponse.statusCode());
```

`OpenAiStreamingChatModel` 使用時は、生の HTTP レスポンス（上記）と生の Server-Sent Events にアクセスできます：

```java
List<ServerSentEvent> rawServerSentEvents = ((OpenAiChatResponseMetadata) chatResponse.metadata()).rawServerSentEvents();
System.out.println(rawServerSentEvents.get(0).data());
System.out.println(rawServerSentEvents.get(0).event());
```

## HTTP クライアント

### Plain Java
`langchain4j-open-ai` モジュール使用時、
デフォルトの HTTP クライアントは JDK の `java.net.http.HttpClient` です。

カスタマイズしたり、任意の他の HTTP クライアントを使ったりできます。
詳細は [こちら](/tutorials/customizable-http-client)。

### Spring Boot
`langchain4j-open-ai-spring-boot-starter` Spring Boot starter 使用時、
デフォルトの HTTP クライアントは Spring の `RestClient` です。

カスタマイズしたり、任意の他の HTTP クライアントを使ったりできます。
詳細は [こちら](/tutorials/customizable-http-client)。

## OpenAI Responses API

:::note
この機能は実験的であり、今後のリリースで変更される可能性があります。
:::

OpenAI の [Responses API](https://platform.openai.com/docs/api-reference/responses)（`/v1/responses`）は、Chat Completions API の代替です。

### `OpenAiResponsesChatModel` の作成

```java
ChatModel model = OpenAiResponsesChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5.4")
        .build();
```

### `OpenAiResponsesStreamingChatModel` の作成

```java
StreamingChatModel model = OpenAiResponsesStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();
```

### `OpenAiResponsesChatRequestParameters`

`OpenAiResponsesChatRequestParameters` は `DefaultChatRequestParameters` を拡張し、Responses API 固有のフィールドを持ちます：
`previousResponseId`、`maxToolCalls`、`parallelToolCalls`、`topLogprobs`、`truncation`、`include`、
`serviceTier`、`safetyIdentifier`、`promptCacheKey`、`promptCacheRetention`、`reasoningEffort`、
`reasoningSummary`、`textVerbosity`、`streamIncludeObfuscation`、`store`、`strictTools`、`strictJsonSchema`。

これらのパラメータはモデル作成時にデフォルトとして設定でき（ビルダーの `defaultRequestParameters`）、
または `ChatRequest` 経由でリクエスト単位に渡せます（リクエスト単位がデフォルトを上書き）：

```java
ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("Hello"))
        .parameters(OpenAiResponsesChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .previousResponseId("resp_abc123")
                .store(true)
                .build())
        .build();
```

### 組み込み／サーバーツールの設定

OpenAI Responses API 連携は、`serverTools` 経由で OpenAI 組み込みツールをサポートします。

- `serverTools` は、生の OpenAI 形式の組み込みツールに使います

`web_search`、`file_search`、その他の OpenAI Responses API ツールオブジェクトなど、
追加の型付きラッパーなしで組み込みツールを送りたい場合に `serverTools` を使います：

```java
ChatModel model = OpenAiResponsesChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5.4")
        .serverTools(List.of(
                Map.of(
                        "type", "web_search",
                        "filters", Map.of("allowed_domains", List.of("openai.com", "developers.openai.com")),
                        "user_location", Map.of(
                                "type", "approximate",
                                "country", "US")),
                Map.of(
                        "type", "file_search",
                        "vector_store_ids", List.of("vs_abc123"),
                        "max_num_results", 3,
                        "filters", Map.of(
                                "type", "eq",
                                "key", "category",
                                "value", "blog"))))
        .build();
```

リクエスト単位でも組み込みツールを設定できます：

```java
ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("What's the weather in Berlin?"))
        .parameters(OpenAiResponsesChatRequestParameters.builder()
                .serverTools(List.of(Map.of("type", "web_search")))
                .build())
        .build();

ChatResponse response = model.chat(chatRequest);
```

`serverTools` はモデルビルダー上のデフォルト、または
`OpenAiResponsesChatRequestParameters` 経由のリクエスト単位で設定できます。両方ある場合、リクエスト単位の値が優先され、
そのリクエストではモデルレベルの `serverTools` を置き換えます。

`serverTools` はプロバイダ固有で、意図的に OpenAI のワイヤ形式を映すため、ネストしたツールフィールドは
通常の `Map` / `List` 値として渡してください。

### Thinking / Reasoning
OpenAI の推論モデル（例: `gpt-5.4`、`gpt-5-mini`）は、
モデル内部の推論の要約を公開する
[reasoning summaries](https://developers.openai.com/api/docs/guides/reasoning#reasoning-summaries)
をサポートします。

推論要約を有効にするには、ビルダー上（または `OpenAiResponsesChatRequestParameters` 経由）で
`reasoningSummary` を `"auto"` に設定します。
`reasoningEffort` でモデルが推論にどれだけ努力するかを制御することもできます。

```java
ChatModel model = OpenAiResponsesChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5-mini")
        .reasoningEffort("low")
        .reasoningSummary("auto")
        .build();

ChatResponse response = model.chat("What is the capital of Germany?");
response.aiMessage().text();     // "The capital of Germany is Berlin."
response.aiMessage().thinking(); // reasoning summary text
```

`OpenAiResponsesStreamingChatModel` で `reasoningSummary` を設定すると、
推論要約トークンがストリームされる際に
`StreamingChatResponseHandler.onPartialThinking()` コールバックが呼び出されます：

```java
StreamingChatModel model = OpenAiResponsesStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5-mini")
        .reasoningEffort("low")
        .reasoningSummary("auto")
        .build();
```

`AiMessage.thinking()` の推論要約は情報提供用であり、後続リクエストに送り返す必要はありません——
OpenAI はターン間で破棄します。ツール呼び出しの間など、ターンをまたいでモデルの推論状態を実際に保持するには、
下記の暗号化推論を使います。

#### 暗号化推論（コンテキスト内に推論を保持）

`store` が `false`（デフォルト）の場合、または組織がゼロデータ保持の場合、
モデルの推論コンテキストはターン間で失われます。
保持するには、`include` パラメータ経由で
[暗号化された推論コンテンツ](https://developers.openai.com/api/docs/guides/reasoning#keeping-reasoning-items-in-context)
を要求します：

```java
ChatModel model = OpenAiResponsesChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5-mini")
        .reasoningEffort("medium")
        .include(List.of("reasoning.encrypted_content"))
        .build();
```

`include` に `"reasoning.encrypted_content"` が含まれると、レスポンスの推論アイテムに
不透明な暗号化ブロブが含まれます。これは自動的に
`AiMessage.attributes()` の `"encrypted_reasoning"` キー配下に保存されます。

その `AiMessage` を後続リクエスト（例: ツール呼び出し後）に渡すと、
暗号化推論が自動的にリクエストに含まれ、
モデルが推論コンテキストを再開できます：

```java
// Turn 1: model calls a tool
ChatResponse response1 = model.chat(ChatRequest.builder()
        .messages(userMessage)
        .parameters(ChatRequestParameters.builder()
                .toolSpecifications(weatherTool)
                .build())
        .build());

AiMessage aiMessage1 = response1.aiMessage();
// aiMessage1.attribute("encrypted_reasoning", String.class) is not null

// Turn 2: send tool result back — encrypted reasoning is sent automatically
ChatResponse response2 = model.chat(ChatRequest.builder()
        .messages(
                userMessage,
                aiMessage1, // contains encrypted reasoning in attributes
                ToolExecutionResultMessage.from(aiMessage1.toolExecutionRequests().get(0), "sunny"))
        .parameters(ChatRequestParameters.builder()
                .toolSpecifications(weatherTool)
                .build())
        .build());
```

これは `OpenAiResponsesStreamingChatModel` でも同様に動作します。

### `OpenAiResponsesChatResponseMetadata`

Responses API のレスポンスメタデータは、標準の `ChatResponseMetadata` を超える追加フィールドを提供します：

```java
OpenAiResponsesChatResponseMetadata metadata =
        (OpenAiResponsesChatResponseMetadata) chatResponse.metadata();

metadata.id();               // Response ID (can be used as previousResponseId)
metadata.modelName();        // Model name used for the request
metadata.finishReason();     // Finish reason (STOP, LENGTH, TOOL_EXECUTION, OTHER)
metadata.tokenUsage();       // Returns OpenAiTokenUsage with detailed token counts
metadata.createdAt();        // Timestamp when the response was created
metadata.completedAt();      // Timestamp when the response was completed
metadata.serviceTier();      // Service tier used for the request

// Raw HTTP access (same as Chat Completions API)
metadata.rawHttpResponse();
metadata.rawServerSentEvents();
```

## 例
- [OpenAI Examples](https://github.com/langchain4j/langchain4j-examples/tree/main/open-ai-examples/src/main/java)

