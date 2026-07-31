---
sidebar_position: 8
---

# Google Gen AI（実験的）

https://github.com/googleapis/java-genai

> [!WARNING]  
> この統合は現在**実験的**とマークされています。API と実装は将来のリリースで変更される可能性があります。
> 新しい公式 Google Gen AI Java SDK（`com.google.genai:google-genai`）を使用します。

## 目次

- [Maven 依存関係](#maven-dependency)
- [API キー](#api-key)
- [利用可能なモデル](#models-available)
- [GoogleGenAiChatModel](#googlegenAichatmodel)
    - [設定](#configuring)
- [GoogleGenAiStreamingChatModel](#googlegenaistreamingchatmodel)
    - [Executor](#executor)
- [GoogleGenAiEmbeddingModel](#googlegenaiembeddingmodel)
- [GoogleGenAiImageModel](#googlegenaiimagemodel)
- [リクエストとレスポンスのログ](#request--response-logging)
- [Batch API](#batch-api)
- [ツール](#tools)
- [JSON Schema / 構造化出力](#json-schema--structured-outputs)
- [Grounding メタデータ](#grounding-metadata)
- [カスタムラベル](#custom-labels)
- [File API](#file-api)
- [キャッシュコンテンツのサポート](#cached-content-support)
- [Thinking モデル（Gemini 3.0+）](#thinking-models-gemini-30)
- [マルチモーダル（オーディオ、ビデオ、PDF）](#multimodality-audio-video-pdf)
- [トークン数推定器](#token-count-estimator)
- [モデルカタログ](#model-catalog)

## Maven 依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-google-genai</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## 認証

API キーまたは Google Cloud Vertex AI 認証情報を使用して Gemini モデルで認証できます。

### Gemini Developer API（API キー）

ここで無料の API キーを取得できます: https://ai.google.dev/gemini-api/docs/api-key。
`.apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))` を使用してビルダーに提供できます。

### Google Cloud Vertex AI

Vertex AI を使用している場合、Google Credentials とプロジェクト ID およびロケーションを使用して認証できます。利用可能な場合、統合は Application Default Credentials（ADC）を自動的に使用します。または明示的に提供することもできます。

```java
ChatModel gemini = GoogleGenAiChatModel.builder()
    // .googleCredentials(...) // Optional: explicitly provide credentials
    .projectId("your-google-cloud-project-id")
    .location("us-central1")
    .modelName("gemini-2.5-flash")
    .build();
```

## 利用可能なモデル

ドキュメントで[利用可能なモデル](https://ai.google.dev/gemini-api/docs/models/gemini)のリストを確認してください。

* `gemini-3.1-pro-preview`
* `gemini-3.1-flash-lite`
* `gemini-3-pro-preview`
* `gemini-3-flash-preview`
* `gemini-2.5-pro`
* `gemini-2.5-flash`
* `gemini-2.5-flash-lite`

（`-image`、`-tts`、`-live` などの専用プレビューモデルの完全なリストについては、[公式ドキュメント](https://ai.google.dev/gemini-api/docs/models)を参照してください。）

## GoogleGenAiChatModel

通常の `chat(...)` メソッドが利用できます。

```java
ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

String response = gemini.chat("Hello Gemini!");
```

および `ChatResponse chat(ChatRequest req)` メソッド:

```java
ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

ChatResponse chatResponse = gemini.chat(ChatRequest.builder()
    .messages(UserMessage.from(
        "How many R's are there in the word 'strawberry'?"))
    .build());

String response = chatResponse.aiMessage().text();
```

### 設定

```java
ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    // or .googleCredentials(...)
    .projectId(...)
    .location(...)
    .modelName("gemini-2.5-flash")
    .temperature(1.0)
    .topP(0.95)
    .topK(64)
    .seed(42)
    .maxOutputTokens(8192)
    .timeout(Duration.ofSeconds(60))
    .maxRetries(2)
    .stopSequences(List.of(...))
    .safetySettings(List.of(...))
    .responseFormat(ResponseFormat.JSON)
    .enableGoogleSearch(true)
    .enableGoogleMaps(true)
    .enableUrlContext(true)
    .allowedFunctionNames(List.of("getWeather"))
    .thinkingLevel("LOW")
    .listeners(...)
    .build();
```

### 高度: `GenerateContentConfig` のカスタマイズ

ビルダーメソッドは最も一般的なオプションをカバーしています。基盤となる Google Gen AI Java SDK のオプションのうち、ビルダーメソッドで（まだ）公開されていないものを設定するには、`generateContentConfigCustomizer` を登録します。これは、この統合が設定を入力した後（生成パラメータ、ツール、システム指示など）、設定が構築される直前に `GenerateContentConfig.Builder` を受け取るため、リクエストごとのツールとシステム指示を保持しながら、追加オプションを設定したり既存のものを上書きしたりできます。

```java
ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .generateContentConfigCustomizer(config -> config.responseLogprobs(true).logprobs(5))
    .build();
```

これは `GoogleGenAiStreamingChatModel` でも同じように機能します。

## リクエストとレスポンスのログ

デバッグ、トラブルシューティング、監査の目的で、`GoogleGenAiChatModel`、`GoogleGenAiStreamingChatModel`、`GoogleGenAiEmbeddingModel`、`GoogleGenAiImageModel` でリクエストとレスポンスのログを有効にできます。

これらのログをキャプチャするには、モデルビルダーで `.logRequests(true)`、`.logResponses(true)`（または `.logRequestsAndResponses(true)` で両方）を設定します。

```java
ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .logRequests(true)
    .logResponses(true)
    // Or: .logRequestsAndResponses(true)
    .build();
```

### ログ設定のセットアップ

Google Gen AI 統合モジュール内のすべてのログは、標準の **SLF4J** ファサードを通じてルーティングされます。実際に出力を表示するには、次を確認してください。
1. SLF4J バインディング（実装）が依存関係に存在する。
2. ログフレームワークがパッケージ `dev.langchain4j.model.google.genai` に対して `INFO` レベルでログを出力するよう設定されている。

以下は一般的なログ環境のセットアップパターンです。

#### 1. Logback を使用したセットアップ

プロジェクトに Logback classic 実装を追加します。

##### Maven
```xml
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.5.8</version> <!-- or your preferred version -->
</dependency>
```

##### Gradle
```groovy
implementation 'ch.qos.logback:logback-classic:1.5.8'
```

次に、`src/main/resources/logback.xml` ファイルでログレベルを設定します。例:

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- Configure the package specifically for Google Gen AI logging -->
    <logger name="dev.langchain4j.model.google.genai" level="INFO" />

    <root level="WARN">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

#### 2. Spring Boot アプリケーションでのセットアップ

Spring Boot は自動的に SLF4J プロバイダーを提供します。`application.properties`（または同等の `application.yml`）でログレベルを設定するだけです。

```properties
# Enable logging for Google Gen AI models
logging.level.dev.langchain4j.model.google.genai=INFO
```

#### 3. SLF4J Simple でのセットアップ

スクリプトまたはシンプルなコマンドラインアプリケーションを作成している場合は、軽量の `slf4j-simple` バックエンドを使用できます。

##### Maven
```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-simple</artifactId>
    <version>2.0.13</version>
</dependency>
```

アプリケーション起動時にシステムプロパティ経由で SLF4J Simple を設定します。

```bash
java -Dorg.slf4j.simpleLogger.log.dev.langchain4j.model.google.genai=INFO -jar app.jar
```

または、`src/main/resources/` に次の内容を含む `simplelogger.properties` ファイルを作成します。

```properties
org.slf4j.simpleLogger.log.dev.langchain4j.model.google.genai=info
```

## GoogleGenAiStreamingChatModel

`GoogleGenAiStreamingChatModel` を使用すると、レスポンスのテキストをトークンごとにストリーミングできます。
レスポンスは `StreamingChatResponseHandler` で処理する必要があります。

```java
StreamingChatModel gemini = GoogleGenAiStreamingChatModel.builder()
        .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
        .modelName("gemini-2.5-flash")
        .build();

CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();

gemini.chat("Tell me a joke about Java", new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.print(partialResponse);
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        futureResponse.complete(completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        futureResponse.completeExceptionally(error);
    }
});

futureResponse.join();
```

### Executor

Google Gen AI SDK はストリーミングを**ブロッキング**の `ResponseStream` イテレータとして公開します。各チャンクはブロッキングの `next()` 呼び出しによって配信されます。したがって、`GoogleGenAiStreamingChatModel` は呼び出し元のスレッド外でその反復を駆動するために `ExecutorService` を必要とします。

渡さない場合、`DefaultExecutorProvider` の共有デフォルトが使用されます（遅延初期化、利用可能な場合は仮想スレッドを使用）。これはすぐに動作しますが、**本番環境では推奨されません**。デフォルトのエグゼキュータは無制限で、JVM 全体に及び、アプリケーションのライフサイクルに結び付けられていないため、バックプレッシャー、グレースフルシャットダウン、メトリクスでの可視性を提供しません。

ほぼ常に独自のエグゼキュータを提供すべきです。たとえば、フレームワーク管理のタスクエグゼキュータ（Spring `TaskExecutor`、Quarkus `ManagedExecutor` など）、所有する仮想スレッドエグゼキュータ、または同時実行予算に合わせて調整された有界プールです。

```java
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor(); // or your framework's executor

StreamingChatModel gemini = GoogleGenAiStreamingChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .executor(executor)
    .build();
```

## ツール

ツール（関数呼び出し）がサポートされています。LangChain4j の `AiServices` を使用して定義できます。

```java
class WeatherForecastService {
    @Tool("Get the weather forecast for a location")
    String getForecast(@P("Location to get the forecast for") String location) {
        return "The weather in " + location + " is sunny and 25°C.";
    }
}

interface WeatherAssistant {
    String chat(String userMessage);
}

WeatherForecastService weatherForecastService = new WeatherForecastService();

ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .temperature(0.0)
    .build();

WeatherAssistant weatherAssistant = AiServices.builder(WeatherAssistant.class)
    .chatModel(gemini)
    .tools(weatherForecastService)
    .build();

String response = weatherAssistant.chat("What is the weather forecast for Tokyo?");
```
## JSON Schema / 構造化出力

`langchain4j-google-genai` 統合は、LangChain4j の JSON スキーマ（`ResponseFormat.jsonSchema()`）を公式 Google Gen AI SDK の `ResponseSchema` に直接マップします。これにより、強く型付けされた Java レコードをネイティブに抽出できます！

```java
record WeatherForecast(
    @Description("minimum temperature") Integer minTemperature,
    @Description("maximum temperature") Integer maxTemperature,
    @Description("chances of rain") boolean rain
) { }

interface WeatherForecastAssistant {
    WeatherForecast extract(String forecast);
}

ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

WeatherForecastAssistant forecastAssistant = AiServices.builder(WeatherForecastAssistant.class)
    .chatModel(gemini)
    .build();

WeatherForecast forecast = forecastAssistant.extract("""
    Morning: The day dawns bright and clear in Osaka...
    Temperatures climb to a comfortable 22°C (72°F) and 
    will drop to 15°C (59°F).
    """);
```

> [!NOTE]  
> Google Gen AI API には、高度な JSON スキーマ機能（`anyOf` / ポリモーフィック型付けなど）にいくつかの制限があります。シンプルな POJO、リスト、ネストされたオブジェクトは完全にサポートされています。

## キャッシュコンテンツのサポート

複数のリクエストにわたって再利用される非常に大きなコンテキストウィンドウ（大規模なシステムプロンプト、大きなドキュメント、または広範なコードベースなど）を扱う場合、コンテンツをキャッシュすることでコストとレイテンシを大幅に削減できます。 

公式の Google Gen AI SDK または API を使用してキャッシュコンテンツを作成したら、一意のキャッシュ識別子を LangChain4j チャットモデルビルダーに簡単に渡すことができます。

```java
// Pass your cached content URI here
String cachedContentUri = "projects/123456/locations/us-central1/cachedContents/my-cached-content-789";

ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-pro")
    .cachedContent(cachedContentUri)
    .build();

// The model will automatically use the cached context!
String response = gemini.chat("Summarize the cached document in 3 bullet points.");
```

この機能は `GoogleGenAiChatModel`、`GoogleGenAiStreamingChatModel`、`GoogleGenAiBatchChatModel` で利用できます。

### キャッシュの作成と管理

帯域外でキャッシュを作成する代わりに、`GoogleGenAiCaches` を使用して LangChain4j から直接作成および管理できます。これは SDK のキャッシュライフサイクル（create / get / list / update TTL / delete）をラップします。メッセージはチャットモデルと同じ `GoogleGenAiContentMapper` を使用してキャッシュされるため、LangChain4j の `ChatMessage` ドメインに留まります。

```java
GoogleGenAiCaches caches = GoogleGenAiCaches.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .build();

// Cache a large, reusable context (a system instruction plus a long document)
CachedContent cache = caches.createCache(
    "gemini-2.5-flash",
    List.of(
        SystemMessage.from("You are a precise assistant answering questions about the attached document."),
        UserMessage.from(longDocumentText)),
    Duration.ofHours(1));

// Reuse it across many requests via cachedContent
ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .cachedContent(cache.name().orElseThrow())
    .build();

String answer = gemini.chat("Summarize the cached document in 3 bullet points.");

// Manage the cache lifecycle
caches.updateCacheTtl(cache.name().orElseThrow(), Duration.ofHours(2));
caches.listCaches();
caches.deleteCache(cache.name().orElseThrow());
```

> 注意: 明示的なコンテキストキャッシュには有料ティアが必要です。無料ティアでは利用できません。

## Thinking モデル（Gemini 3.0+）

Gemini 3.0 モデル（`gemini-3.0-pro` や `gemini-3.0-flash` など）は、高度な推論（thinking）機能をサポートしています。 
モデル設定時に `thinkingLevel` を指定することで有効にできます。サポートされる値は `"MINIMAL"`、`"LOW"`、`"MEDIUM"`、`"HIGH"` です。

```java
ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-3.0-pro")
    .thinkingLevel("MEDIUM")
    .build();
```

> [!NOTE]
> 以前は、thinking はトークンベースの `thinkingBudget` を使用して設定されていました。`thinkingBudget` パラメータは現在レガシーと見なされていますが、引き続きサポートされています。`thinkingLevel` と `thinkingBudget` の両方を同時に指定することはできません。

> [!TIP]
> LangChain4j の `google-genai` 統合は、thinking モデルを使用したマルチターンのツール実行に必要な複雑な状態をシームレスに管理します。会話ターン間で必要な隠し `thought_signature` トークンを自動的に永続化および注入し、堅牢で中断のないエージェントワークフローを保証します！

## GoogleGenAiEmbeddingModel

`GoogleGenAiEmbeddingModel` を使用すると、`gemini-embedding-2` などのモデルを使用してテキストセグメントの埋め込みを生成できます。

```java
EmbeddingModel embeddingModel = GoogleGenAiEmbeddingModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-embedding-2")
    .outputDimensionality(768)
    .taskType(GoogleGenAiEmbeddingModel.TaskTypeEnum.RETRIEVAL_DOCUMENT)
    .build();

Response<Embedding> response = embeddingModel.embed("Hello world!");
```

### バッチ処理とリトライ

複数のテキストセグメントを埋め込む場合（`embedAll` 経由）、`GoogleGenAiEmbeddingModel` はバッチ処理と API リクエストのリトライを自動的に管理します。

```java
EmbeddingModel embeddingModel = GoogleGenAiEmbeddingModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-embedding-2")
    .maxSegmentsPerBatch(100) // Default: 100. Sets maximum segments per batch request.
    .maxRetries(3)             // Default: 3. Automatically retries failed requests.
    .build();
```

#### タイトルベースのグループ化戦略
公式 Google Gen AI Java SDK の `embedContent` API は、バッチリクエストごとに単一の共通 `title` のみをサポートします。この制限をクリーンに処理し、ドキュメントレベルの関連付けを保持するために、`GoogleGenAiEmbeddingModel` は**タイトルによるグループ化**バッチ戦略を実装しています。

1. `taskType` が `RETRIEVAL_DOCUMENT` に設定されている場合、モデルはドキュメントタイトル（`.titleMetadataKey(...)` で定義されたキーを使用してセグメントのメタデータから抽出、デフォルトは `"title"`）でテキストセグメントをグループ化します。
2. 同じタイトルを共有するセグメントはバッチ処理され、単一の API 呼び出しで一緒に送信されます。
3. 異なるタイトル（またはタイトルなし）のセグメントは、個別の最適化されたバッチで処理されます。
4. 結果の埋め込みはシームレスに再組み立てされ、元の順序で返されます。

これにより、ドキュメントメタデータコンテキストや個々のセグメントタイトルを失うことなく、API スループットが最大化されます。


## GoogleGenAiImageModel

`GoogleGenAiImageModel` を使用すると、テキストプロンプトから画像を生成できます。アスペクト比、画像サイズ、人物生成ポリシーなどのカスタム設定をサポートしています。

```java
ImageModel imageModel = GoogleGenAiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-3.1-flash-image-preview")
    .aspectRatio("16:9")
    .build();

Response<Image> response = imageModel.generate("A futuristic city at sunset");
```

## Batch API

Google Gen AI 統合は Batch API のサポートを提供し、バックグラウンドで非同期に操作を実行できます。次のバッチモデルがサポートされています。
- `GoogleGenAiBatchChatModel`
- `GoogleGenAiBatchEmbeddingModel`
- `GoogleGenAiBatchImageModel`

インラインまたは Google Cloud にアップロードされたファイルからバッチジョブを作成できます。 

```java
GoogleGenAiBatchChatModel batchChatModel = GoogleGenAiBatchChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

BatchResponse<ChatResponse> batchResponse = batchChatModel.submit(
    "My Batch Job",
    List.of(
        ChatRequest.builder().messages(UserMessage.from("What is 2+2?")).build(),
        ChatRequest.builder().messages(UserMessage.from("What is the capital of France?")).build()
    )
);

System.out.println("Batch Job ID: " + batchResponse.batchId());
```

その後、`batchChatModel.retrieve(batchResponse.batchId())` を使用してジョブのステータスと結果を取得できます。

## Grounding メタデータ

Google Search grounding を有効にするか、Vertex AI Search データストアを使用する場合、Google Gen AI チャットモデルはネイティブの `GroundingMetadata` を `ChatResponse` に直接公開します。基盤となる生の `GenerateContentResponse` を介してレスポンスメタデータから取得できます。

```java
ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .enableGoogleSearch(true)
    .build();

ChatResponse response = gemini.chat(ChatRequest.builder()
    .messages(UserMessage.from("Who won the super bowl in 2024?"))
    .build());

GoogleGenAiChatResponseMetadata metadata = 
    (GoogleGenAiChatResponseMetadata) response.metadata();

if (metadata.rawResponse() != null 
        && metadata.rawResponse().candidates() != null 
        && !metadata.rawResponse().candidates().isEmpty()) {
    var groundingMetadata = metadata.rawResponse().candidates().get(0).groundingMetadata();
    if (groundingMetadata != null && groundingMetadata.webSearchQueries() != null) {
        System.out.println("Search Queries: " + groundingMetadata.webSearchQueries());
    }
}
```

## カスタムラベル

Google Gen AI リクエストにカスタムのキー値ラベルを適用できます。これは課金、メトリクス、追跡の目的で有用です。カスタムラベルは次でサポートされています。
- `GoogleGenAiChatModel`
- `GoogleGenAiStreamingChatModel`
- `GoogleGenAiBatchChatModel`
- `GoogleGenAiImageModel`
- `GoogleGenAiBatchImageModel`

```java
ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .labels(Map.of("environment", "production", "team", "backend"))
    .build();
```

## File API

Google Gen AI 統合は、Google のサーバー上でファイルをアップロードおよび管理するための `GoogleGenAiFiles` ユーティリティを提供します。これは、標準のリクエスト制限を超える可能性のある大規模なマルチモーダル入力（長いビデオ、オーディオファイル、または広範な PDF など）を渡すのに特に有用です。

```java
GoogleGenAiFiles fileApi = GoogleGenAiFiles.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .build();

String uploadedFileUri = fileApi.uploadFile(
    Paths.get("path/to/my-video.mp4"), 
    "video/mp4", 
    "My Video Demo"
);

// You can now use this URI in your chat requests
ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

ChatResponse response = gemini.chat(ChatRequest.builder()
    .messages(UserMessage.from(
        VideoContent.from(uploadedFileUri, "video/mp4"),
        TextContent.from("What happens in this video?")
    ))
    .build());
```

## マルチモーダル（オーディオ、ビデオ、PDF）

この統合は LangChain4j のマルチモーダルコンテンツタイプを完全にサポートしています。基盤となる `GoogleGenAiContentMapper` がそれらを適切な Gemini `Part` オブジェクトに自動的に変換します。

```java
ChatModel gemini = GoogleGenAiChatModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

ChatResponse response = gemini.chat(ChatRequest.builder()
    .messages(UserMessage.from(
        AudioContent.from("https://example.com/audio.mp3"),
        PdfFileContent.from("https://example.com/document.pdf"),
        TextContent.from("Summarize the document and the audio recording.")
    ))
    .build());
```

## トークン数推定器

公式 SDK のカウントエンドポイントを使用する `GoogleGenAiTokenCountEstimator` を使用して、プロンプトとメッセージ内のトークン数を正確に推定できます。

```java
TokenCountEstimator estimator = GoogleGenAiTokenCountEstimator.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

int tokenCount = estimator.estimateTokenCount("How many tokens is this sentence?");
System.out.println("Tokens: " + tokenCount);
```

## モデルカタログ

`GoogleGenAiModelCatalog` を使用して、利用可能な Gemini モデルのリストをプログラムでクエリできます。これは、モデルの機能、コンテキストウィンドウ、サポートされているメソッドを動的に発見するのに役立ちます。

```java
GoogleGenAiModelCatalog catalog = GoogleGenAiModelCatalog.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .build();

List<Model> availableModels = catalog.listModels();
availableModels.forEach(model -> {
    System.out.println("Model Name: " + model.name());
    System.out.println("Supported Generation Methods: " + model.supportedGenerationMethods());
});
```
