---
sidebar_position: 7
---

# Google AI Gemini

https://ai.google.dev/gemini-api/docs

## 目次

- [Maven依存関係](#maven依存関係)
- [APIキー](#apiキー)
- [利用可能なモデル](#利用可能なモデル)
- [GoogleAiGeminiChatModel](#googleaigeminichatmodel)
    - [設定](#設定)
    - [デフォルトリクエストパラメータ](#デフォルトリクエストパラメータ)
- [GoogleAiGeminiStreamingChatModel](#googleaigeministreamingchatmodel)
- [ツール](#ツール)
- [構造化出力](#構造化出力)
- [Pythonコード実行](#pythonコード実行)
- [マルチモーダル](#マルチモーダル)
- [Thinking](#thinking)
    - [Gemini 3 Pro](#gemini-3-pro)
- [Gemini Files API](#gemini-files-api)
    - [ファイルのアップロード](#ファイルのアップロード)
    - [ファイルの管理](#ファイルの管理)
    - [ファイルの状態](#ファイルの状態)
- [バッチ処理](#バッチ処理)
    - [GoogleAiBatchChatModel](#googleaibatchchatmodel)
    - [バッチジョブの作成](#バッチジョブの作成)
    - [バッチレスポンスの処理](#バッチレスポンスの処理)
    - [結果のポーリング](#結果のポーリング)
    - [バッチジョブの管理](#バッチジョブの管理)
    - [ファイルベースのバッチ処理](#ファイルベースのバッチ処理)

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-google-ai-gemini</artifactId>
    <version>1.18.1</version>
</dependency>
```
## APIキー

無料のAPIキーはこちらで取得できます：https://ai.google.dev/gemini-api/docs/api-key 。

## 利用可能なモデル

ドキュメントで[利用可能なモデル](https://ai.google.dev/gemini-api/docs/models/gemini)の一覧を確認してください。

* `gemini-3-pro-preview`
* `gemini-2.5-pro`
* `gemini-2.5-flash`
* `gemini-2.5-flash-lite`
* `gemini-2.0-flash`
* `gemini-2.0-flash-lite`

## GoogleAiGeminiChatModel

通常の`chat(...)`メソッドが利用できます：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    ...
    .build();

String response = gemini.chat("Hello Gemini!");
```
また、`ChatResponse chat(ChatRequest req)`メソッドもあります：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
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
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .httpClientBuilder(...)
    .defaultRequestParameters(...)
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .baseUrl(...)
    .modelName("gemini-2.5-flash")
    .maxRetries(...)
    .temperature(1.0)
    .topP(0.95)
    .topK(64)
    .seed(42)
    .frequencyPenalty(...)
    .presencePenalty(...)
    .maxOutputTokens(8192)
    .timeout(Duration.ofSeconds(60))
    .responseFormat(ResponseFormat.JSON) // or .responseFormat(ResponseFormat.builder()...build()) 
    .stopSequences(List.of(...))
    .toolConfig(GeminiFunctionCallingConfig.builder()...build()) // or below
    .toolConfig(GeminiMode.ANY, List.of("fnOne", "fnTwo"))
    .allowCodeExecution(true)
    .includeCodeExecution(true)
    .logRequestsAndResponses(true)
    .safetySettings(List<GeminiSafetySetting> or Map<GeminiHarmCategory, GeminiHarmBlockThreshold>)
    .thinkingConfig(...)
    .returnThinking(true)
    .sendThinking(true)
    .responseLogprobs(...)
    .logprobs(...)
    .enableEnhancedCivicAnswers(...)
    .mediaResolution(GeminiMediaResolutionLevel.MEDIA_RESOLUTION_HIGH)
    .mediaResolutionPerPartEnabled(true)
    .listeners(...)
    .supportedCapabilities(...)
    .build();
```
### デフォルトリクエストパラメータ

上記の個別ビルダーメソッドの代わりに（またはそれに加えて）、
`defaultRequestParameters(...)`経由で単一の`ChatRequestParameters`オブジェクトを指定できます。これらのパラメータは、
個々の`ChatRequest`のパラメータで上書きされない限り、モデルが発行するすべてのリクエストに適用されます。

共通の`ChatRequestParameters`、またはGemini固有の`GoogleAiGeminiChatRequestParameters`を渡せます。
後者はさらに`aspectRatio`や`imageSize`などのGemini専用オプションを公開します：

```java
GoogleAiGeminiChatRequestParameters parameters = GoogleAiGeminiChatRequestParameters.builder()
    .modelName("gemini-2.5-flash")
    .temperature(1.0)
    .maxOutputTokens(8192)
    .aspectRatio("16:9") // Gemini-specific
    .imageSize("2K")     // Gemini-specific
    .build();

ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .defaultRequestParameters(parameters)
    .build();
```
同じパラメータが`defaultRequestParameters(...)`と個別のビルダーメソッド
（例：`modelName(String)`）の両方で設定されている場合、個別のビルダーメソッドで設定された値が優先されます：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .defaultRequestParameters(GoogleAiGeminiChatRequestParameters.builder()
        .modelName("gemini-2.5-flash")
        .temperature(1.0)
        .build())
    .temperature(0.0) // overrides temperature from defaultRequestParameters
    .build();
// effective parameters: modelName=gemini-2.5-flash, temperature=0.0
```
## GoogleAiGeminiStreamingChatModel
`GoogleAiGeminiStreamingChatModel`は、レスポンスのテキストをトークン単位でストリーミングできます。
レスポンスは`StreamingChatResponseHandler`で処理する必要があります。
```java
StreamingChatModel gemini = GoogleAiGeminiStreamingChatModel.builder()
        .apiKey(System.getenv("GEMINI_AI_KEY"))
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
## ツール

ツール（いわゆる関数呼び出し）がサポートされており、並列呼び出しも含みます。
1つ以上の`ToolSpecification`で設定できる`ChatRequest`を受け取る`chat(ChatRequest)`メソッドを使用して、
Geminiに関数呼び出しをリクエストできることを知らせることができます。
または、LangChain4jの`AiServices`を使用して定義することもできます。

`AiServices`を使用した天気ツールの例は次のとおりです：

```java
record WeatherForecast(
    String location,
    String forecast,
    int temperature) {}

class WeatherForecastService {
    @Tool("Get the weather forecast for a location")
    WeatherForecast getForecast(
        @P("Location to get the forecast for") String location) {
        if (location.equals("Paris")) {
            return new WeatherForecast("Paris", "sunny", 20);
        } else if (location.equals("London")) {
            return new WeatherForecast("London", "rainy", 15);
        } else if (location.equals("Tokyo")) {
            return new WeatherForecast("Tokyo", "warm", 32);
        } else {
            return new WeatherForecast("Unknown", "unknown", 0);
        }
    }
}

interface WeatherAssistant {
    String chat(String userMessage);
}

WeatherForecastService weatherForecastService =
    new WeatherForecastService();

ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .temperature(0.0)
    .build();

WeatherAssistant weatherAssistant =
    AiServices.builder(WeatherAssistant.class)
        .chatModel(gemini)
        .tools(weatherForecastService)
        .build();

String tokyoWeather = weatherAssistant.chat(
        "What is the weather forecast for Tokyo?");

System.out.println("Gemini> " + tokyoWeather);
// Gemini> The weather forecast for Tokyo is warm
//         with a temperature of 32 degrees.
```
## 構造化出力

構造化出力の詳細は[こちら](/tutorials/structured-outputs)を参照してください。

### 自由形式テキストからの型安全なデータ抽出
大規模言語モデルは、非構造化テキストから構造化情報を抽出することに優れています。
次の例では、`AiServices`のおかげで、天気予報テキストから型安全な`WeatherForecast`オブジェクトを取得します：
```java
// A type-safe / strongly-typed object 
// representing the weather forecast

record WeatherForecast(
    @Description("minimum temperature")
    Integer minTemperature,
    @Description("maximum temperature")
    Integer maxTemperature,
    @Description("chances of rain")
    boolean rain
) { }

// An interface contract, to interact with Gemini

interface WeatherForecastAssistant {
    WeatherForecast extract(String forecast);
}

// Let's extract the data:

ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // this is required to enable structured outputs feature
    .build();

WeatherForecastAssistant forecastAssistant =
    AiServices.builder(WeatherForecastAssistant.class)
        .chatModel(gemini)
        .build();

WeatherForecast forecast = forecastAssistant.extract("""
    Morning: The day dawns bright and clear in Osaka, with crisp
    autumn air and sunny skies. Expect temperatures to hover
    around 18°C (64°F) as you head out for your morning stroll
    through Namba.
    Afternoon: The sun continues to shine as the city buzzes with
    activity. Temperatures climb to a comfortable 22°C (72°F).
    Enjoy a leisurely lunch at one of Osaka's many outdoor cafes,
    or take a boat ride on the Okawa River to soak in the beautiful
    scenery.
    Evening: As the day fades, expect clear skies and a slight chill
    in the air. Temperatures drop to 15°C (59°F). A cozy dinner at a
    traditional Izakaya will be the perfect way to end your day in
    Osaka.
    Overall: A beautiful autumn day in Osaka awaits, perfect for
    exploring the city's vibrant streets, enjoying the local cuisine,
    and soaking in the sights.
    Don't forget: Pack a light jacket for the evening and wear
    comfortable shoes for all the walking you'll be doing.
    """);
```
### レスポンス形式 / レスポンススキーマ
`ResponseFormat`は、`GoogleAiGeminiChatModel`の作成時または呼び出し時に指定できます。

特にJson形式の場合、対応するJavaオブジェクトを作成してプログラムでスキーマを定義するか、生のjsonスキーマを提供するかを選択できます。 
#### レスポンススキーマ
`GoogleAiGeminiChatModel`作成時にレシピのJSONスキーマを定義する例を見てみましょう。
この例では、`JsonObjectSchema`クラスを使用してjsonスキーマを宣言します。
```java
ResponseFormat responseFormat = ResponseFormat.builder()
        .type(ResponseFormatType.JSON)
        .jsonSchema(JsonSchema.builder() // see [1] below
                .rootElement(JsonObjectSchema.builder()
                        .addStringProperty("title")
                        .addIntegerProperty("preparationTimeMinutes")
                        .addProperty("ingredients", JsonArraySchema.builder()
                                .items(new JsonStringSchema())
                                .build())
                        .addProperty("steps", JsonArraySchema.builder()
                                .items(new JsonStringSchema())
                                .build())
                        .build())
                .build())
        .build();

ChatModel gemini = GoogleAiGeminiChatModel.builder()
        .apiKey(System.getenv("GEMINI_AI_KEY"))
        .modelName("gemini-2.5-flash")
        .responseFormat(responseFormat)
        .build();

String recipeResponse = gemini.chat("Suggest a dessert recipe with strawberries");

System.out.println(recipeResponse);
```
注：
- [1] - `JsonSchema`は、`JsonSchemas.jsonSchemaFrom()`ヘルパーメソッドを使用してクラスから自動生成できます。
```java
JsonSchema jsonSchema = JsonSchemas.jsonSchemaFrom(TripItinerary.class).get();
```
`GoogleAiGeminiChatModel`呼び出し時にレシピのJSONスキーマを定義する例を見てみましょう：
```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
        .apiKey(System.getenv("GEMINI_AI_KEY"))
        .modelName("gemini-2.5-flash")
        .build();

ResponseFormat responseFormat = ...;

ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("Suggest a dessert recipe with strawberries"))
        .responseFormat(responseFormat)
        .build();

ChatResponse chatResponse = gemini.chat(chatRequest);

System.out.println(chatResponse.aiMessage().text());
```
#### 生のレスポンススキーマ
別の例では、Gemini APIの`responseJsonSchema`を使用して、`JsonRawSchema`クラスで生のJSONスキーマを提供する方法を示します。  
Gemini APIの[サポートされている型](https://ai.google.dev/gemini-api/docs/structured-output?example=recipe#json_schema_support)のみを使用するよう注意してください。
```
String rawSchema = """
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "birthDate": {
      "type": "string",
      "format": "date"
    },
    "preferredContactTime": {
      "type": "string",
      "format": "time"
      },
    "height": {
      "type": "number",
      "minimum": 1.83,
      "maximum": 1.88
    },
    "role": {
      "type": "string",
      "enum": ["developer", "maintainer", "researcher"]
    },
    "isAvailable": { "type": "boolean" },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "minItems": 1,
      "maxItems": 5
    },
    "address": {
      "type": "object",
      "properties": {
        "city": { "type": "string" },
        "streetName": { "type": "string" },
        "streetNumber": { "type": "string" }
      },
      "required": ["city", "streetName", "streetNumber"],
      "additionalProperties": true
    }
  },
  "required": ["name", "birthDate", "height", "role", "tags", "address"]
}
""";

JsonRawSchema jsonRawSchema = JsonRawSchema.builder().schema(rawSchema).build();
JsonSchema jsonSchema = JsonSchema.builder().rootElement(jsonRawSchema).build();
        
ResponseFormat responseFormat = ResponseFormat.builder()
        .type(ResponseFormatType.JSON)
        .jsonSchema(jsonSchema)
        .build();

GoogleAiGeminiChatModel gemini = GoogleAiGeminiChatModel.builder()
        .apiKey(GOOGLE_AI_GEMINI_API_KEY)
        .modelName("gemini-2.5-flash-lite")
        .logRequests(true)
        .logResponses(true)
        .responseFormat(responseFormat)
        .build();
        
UserMessage userMessage = UserMessage.from(
        """
           Tell me about a detective named Sherlock Holmes,
           who was born on November 28 1852 and sees the world over six feet from the ground.
           He is a trouble-seeker, an active volunteer and lives in London at 221B Baker Street.
           He plays the violin and he likes to conduct various physics and chemistry experiments.
           He accepts clients or prefers to be contacted at 09:00am.
           """);

ChatResponse response = gemini.chat(ChatRequest.builder()
        .messages(userMessage)
        .build());
```
### JSONモード

GeminiにJSONで返信するよう強制できます：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .responseFormat(ResponseFormat.JSON)
    .build();

String roll = gemini.chat("Roll a 6-sided dice");

System.out.println(roll);
// {"roll": "3"}
```
システムプロンプトで、JSON出力がどのようにあるべきかをさらに記述できます。
Geminiは通常、提案されたスキーマに従いますが、保証はされません。
JSONスキーマの確実な適用が必要な場合は、前のセクションで説明したようにレスポンス形式を定義する必要があります。


## Pythonコード実行

関数呼び出しに加えて、Google AI Geminiではサンドボックス環境でPythonコードを作成して実行できます。
これは、より高度な計算やロジックが必要な状況で特に興味深い機能です。

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .allowCodeExecution(true)
    .includeCodeExecutionOutput(true)
    .build();
```
ビルダーメソッドは2つあります：
* `allowCodeExecution(true)`：GeminiにPythonコーディングができることを知らせる
* `includeCodeExecutionOutput(true)`：実際に作成したPythonスクリプトとその実行出力を確認したい場合

```java
ChatResponse mathQuizz = gemini.chat(
    SystemMessage.from("""
        You are an expert mathematician.
        When asked a math problem or logic problem,
        you can solve it by creating a Python program,
        and execute it to return the result.
        """),
    UserMessage.from("""
        Implement the Fibonacci and Ackermann functions.
        What is the result of `fibonacci(22)` - ackermann(3, 4)?
        """)
);
```
GeminiはPythonスクリプトを作成し、サーバー上で実行して結果を返します。
コードと実行出力の確認を求めたため、回答は次のようになります：

~~~
Code executed:
```python
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

def ackermann(m, n):
    if m == 0:
        return n + 1
    elif n == 0:
        return ackermann(m - 1, 1)
    else:
        return ackermann(m - 1, ackermann(m, n - 1))

print(fibonacci(22) - ackermann(3, 4))
```
Output:
```
17586
```
The result of `fibonacci(22) - ackermann(3, 4)` is **17586**.

I implemented the Fibonacci and Ackermann functions in Python.
Then I called `fibonacci(22) - ackermann(3, 4)` and printed the result.
~~~
コード/出力を要求しなかった場合、次のテキストのみを受け取ります：

```
The result of `fibonacci(22) - ackermann(3, 4)` is **17586**.

I implemented the Fibonacci and Ackermann functions in Python.
Then I called `fibonacci(22) - ackermann(3, 4)` and printed the result.
```
## マルチモーダル

Geminiはマルチモーダルモデルであり、テキスト以外の異なる_モダリティ_を受け取り、生成できます。

### 入力モダリティ

入力として、Geminiは次を受け付けます：
* 画像（`ImageContent`）
* 動画（`VideoContent`）
* 音声ファイル（`AudioContent`）
* PDFファイル（`PdfFileContent`）

次の例は、テキストプロンプトと画像を組み合わせる方法を示します：

```java
// PNG of the cute colorful parrot mascot of the LangChain4j project
String base64Img = b64encoder.encodeToString(readBytes(
  "https://avatars.githubusercontent.com/u/132277850?v=4"));

ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

ChatResponse response = gemini.chat(
    UserMessage.from(
        ImageContent.from(base64Img, "image/png"),
        TextContent.from("""
            Do you think this logo fits well
            with the project description?
            """)
    )
);
```
### 画像生成出力

一部のGeminiモデル（例：`gemini-2.5-flash-image`）は、レスポンスの一部として画像を生成できます。画像が生成されると、`AiMessage`の属性に保存され、`GeneratedImageHelper`ユーティリティクラスを使用してアクセスできます。

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey("Your API Key")
    .modelName("gemini-2.5-flash-image")
    .build();

ChatResponse response = gemini.chat(UserMessage.from("A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug in matte black"));

// Extract generated images from the response
AiMessage aiMessage = response.aiMessage();
List<Image> generatedImages = GeneratedImageHelper.getGeneratedImages(aiMessage);

if (GeneratedImageHelper.hasGeneratedImages(aiMessage)) {
    System.out.println("Generated " + generatedImages.size() + " image(s)");
    System.out.println("Text response: " + aiMessage.text());

    for (Image image : generatedImages) {
        String base64Data = image.base64Data();
        String mimeType = image.mimeType();
        
        // You can now save the image, display it, or process it further
        // For example, save to file:
        byte[] imageBytes = Base64.getDecoder().decode(base64Data);
        Files.write(Paths.get("generated_image.png"), imageBytes);
    }
} else {
    System.out.println("Text response: " + aiMessage.text());
}
```
### メディア解像度

モデルに送信するメディア（画像、動画、PDF）の解像度を制御できます。グローバルまたはパートごと（画像ごと）に設定できます。

#### グローバルメディア解像度

リクエスト内のすべてのメディアパートのメディア解像度を設定するには、`.mediaResolution()`ビルダーメソッドを使用します：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .mediaResolution(GeminiMediaResolutionLevel.MEDIA_RESOLUTION_LOW) // or MEDIUM, HIGH, ULTRA_HIGH, UNSPECIFIED
    .build();
```
#### パートごとのメディア解像度（Gemini 3）

Gemini 3では、`ImageContent`の`DetailLevel`を使用して個々の画像の解像度を指定できます。
まずビルダーでこの機能を有効にし、次に`ImageContent`で詳細レベルを設定します：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-3-pro-preview")
    .mediaResolutionPerPartEnabled(true)
    .build();

ChatResponse response = gemini.chat(
    UserMessage.from(
        ImageContent.from(url1, ImageContent.DetailLevel.LOW),
        ImageContent.from(url2, ImageContent.DetailLevel.HIGH),
        TextContent.from("Compare these two images")
    )
);
```
サポートされている`DetailLevel`の値とGeminiの解像度レベルへのマッピング：
- `LOW` -> `MEDIA_RESOLUTION_LOW`
- `MEDIUM` -> `MEDIA_RESOLUTION_MEDIUM`
- `HIGH` -> `MEDIA_RESOLUTION_HIGH`
- `ULTRA_HIGH` -> `MEDIA_RESOLUTION_ULTRA_HIGH`（最高のトークン数。コンピュータ使用などの特定のユースケースで必要）
- `AUTO` -> `MEDIA_RESOLUTION_UNSPECIFIED`

## Thinking

`GoogleAiGeminiChatModel`と`GoogleAiGeminiStreamingChatModel`の両方が
[thinking](https://ai.google.dev/gemini-api/docs/thinking)をサポートします。

次のパラメータもthinkingの動作を制御します：
- `GeminiThinkingConfig.includeThoughts`と`thinkingBudget`：thinkingを有効にします。詳細は[こちら](https://ai.google.dev/gemini-api/docs/thinking)。
- `returnThinking`：利用可能な場合に`AiMessage.thinking()`内でthinkingを返すかどうか、
  および`GoogleAiGeminiStreamingChatModel`使用時に`StreamingChatResponseHandler.onPartialThinking()`と`TokenStream.onPartialThinking()`
  コールバックを呼び出すかどうかを制御します。
  デフォルトでは無効です。有効にすると、thinkingシグネチャも`AiMessage.attributes()`内に保存および返されます。
- `sendThinking`：`AiMessage`に保存されたthinkingとシグネチャを後続リクエストでLLMに送信するかどうかを制御します。
- デフォルトでは無効です。

:::note
`returnThinking`が設定されていない（`null`）かつ`thinkingConfig`が設定されている場合、
thinkingテキストは`AiMessage.text()`フィールド内の実際のレスポンスの前に付加され、
`StreamingChatResponseHandler.onPartialThinking()`の代わりに
`StreamingChatResponseHandler.onPartialResponse()`が呼び出されることに注意してください。
:::

thinkingを設定する例は次のとおりです：
```java
GeminiThinkingConfig thinkingConfig = GeminiThinkingConfig.builder()
        .includeThoughts(true)
        .thinkingBudget(250)
        .build();

ChatModel model = GoogleAiGeminiChatModel.builder()
        .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
        .modelName("gemini-2.5-flash")
        .thinkingConfig(thinkingConfig)
        .returnThinking(true)
        .sendThinking(true)
        .build();
```
### Gemini 3 Pro

Gemini 3 Proでは、thinking設定に_thinking level_が導入され、`"low"`または`"high"`（デフォルトはhigh）のいずれかです。
thinking設定内でレベルを設定できます：
```java
GoogleAiGeminiChatModel modelHigh = GoogleAiGeminiChatModel.builder()
        .modelName("gemini-3-pro-preview")
        .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
        .thinkingConfig(GeminiThinkingConfig.builder()
                .thinkingLevel(LOW) // or HIGH
                .build())
        .sendThinking(true)
        .returnThinking(true)
        .build();
```
文字列`"high"` / `"low"`、または`GeminiThinkingConfig.GeminiThinkingLevel.HIGH`
/ `GeminiThinkingConfig.GeminiThinkingLevel.LOW`列挙値を渡せます。

Gemini 3 Proを使用する場合、[thought signatures](https://ai.google.dev/gemini-api/docs/thought-signatures)がモデルに正しく渡されるよう、
`sendThinking()`と`returnThinking()`を`true`に設定することが必須です。

## Gemini Files API

Gemini Files APIを使用すると、Geminiモデルで使用するメディアファイルをアップロードおよび管理できます。合計リクエストサイズが20 MBを超える場合に特に便利で、ファイルを個別にアップロードしてコンテンツ生成リクエストで参照できます。

### 主な機能

- **マルチモーダルサポート**：画像、音声、動画、ドキュメントをアップロード
- **ストレージ**：ファイルは48時間保存されます
- **容量**：プロジェクトあたり最大20 GBのファイル、個別ファイルは最大2 GB
- **無料**：Files APIは無料で利用できます

### ファイルのアップロード

ファイルは2つの方法でアップロードできます：

**ファイルパスから：**

```java
GeminiFiles filesApi = GeminiFiles.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .build();

// Upload from a file path
Path filePath = Paths.get("path/to/your/file.pdf");
GeminiFile uploadedFile = filesApi.uploadFile(filePath, "My Document");

System.out.println("File uploaded: " + uploadedFile.name());
System.out.println("File URI: " + uploadedFile.uri());
```
**バイト配列から：**

```java
byte[] fileBytes = Files.readAllBytes(Paths.get("path/to/file.jpg"));
GeminiFile uploadedFile = filesApi.uploadFile(
    fileBytes,
    "image/jpeg",
    "My Image"
);
```
### ファイルの管理

**アップロード済みの全ファイルを一覧表示：**

```java
List<GeminiFile> files = filesApi.listFiles();
for (GeminiFile file : files) {
    System.out.println("File: " + file.displayName() + " (" + file.name() + ")");
}
```
**ファイルメタデータを取得：**

```java
GeminiFile file = filesApi.getMetadata("files/abc123");
System.out.println("File size: " + file.sizeBytes() + " bytes");
System.out.println("MIME type: " + file.mimeType());
System.out.println("Created: " + file.createTime());
System.out.println("Expires: " + file.expirationTime());
```
**ファイルを削除：**

```java
filesApi.deleteFile("files/abc123");
System.out.println("File deleted successfully");
```
### ファイルの状態

ファイルはライフサイクル中に異なる状態になり得ます：

```java
GeminiFile file = filesApi.getMetadata("files/abc123");

if (file.isActive()) {
    System.out.println("File is ready to use");
} else if (file.isProcessing()) {
    System.out.println("File is still being processed");
} else if (file.isFailed()) {
    System.out.println("File processing failed");
}
```
## バッチ処理

### GoogleAiBatchChatModel

`GoogleAiBatchChatModel`は、大量のチャットリクエストを低コストで非同期処理するインターフェースを提供します[（標準価格の50%）](https://ai.google.dev/gemini-api/docs/batch-api)。非緊急の大規模タスクに理想的で、24時間のターンアラウンドSLOがあります。

### バッチジョブの作成

**インラインバッチ作成：**

```java
GoogleAiGeminiBatchChatModel batchModel = GoogleAiGeminiBatchChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

// Create batch requests
List<ChatRequest> requests = List.of(
    ChatRequest.builder()
        .messages(UserMessage.from("What is the capital of France?"))
        .build(),
    ChatRequest.builder()
        .messages(UserMessage.from("What is the capital of Germany?"))
        .build(),
    ChatRequest.builder()
        .messages(UserMessage.from("What is the capital of Italy?"))
        .build()
);

// Submit the batch (generic API, no Gemini-specific options)
BatchResponse<ChatResponse> response = batchModel.submit(new BatchRequest<>(requests));

// Or, to set a Gemini-specific display name and priority, use GeminiBatchRequest:
BatchResponse<ChatResponse> response = batchModel.submit(GeminiBatchRequest.from(
    requests,
    "Geography Questions Batch", // display name
    0L                           // priority (optional, defaults to 0)
));
```
**ファイルベースのバッチ作成：**

より大きなバッチの場合、またはリクエスト形式をより細かく制御する必要がある場合、アップロード済みファイルからバッチを作成できます：

```java
// First, upload a file with batch requests
GeminiFiles filesApi = GeminiFiles.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .build();

GeminiFile uploadedFile = filesApi.uploadFile(
    Paths.get("batch_chat_requests.jsonl"),
    "Batch Chat Requests"
);

// Wait for file to be active
while (uploadedFile.isProcessing()) {
    Thread.sleep(1000);
    uploadedFile = filesApi.getMetadata(uploadedFile.name());
}

// Create batch from file
BatchResponse<ChatResponse> response = batchModel.submit("My Batch Job", uploadedFile);
```
### バッチレスポンスの処理

`BatchResponse`は現在の`state()`とともに、リクエストごとの`results()`と
`responses()` / `errors()`の便利なビューを公開します。`state()`で分岐します（`state().isTerminal()`を使用して
バッチがまだ進行中かどうかを判断）：

```java
BatchResponse<ChatResponse> response = batchModel.submit(new BatchRequest<>(requests));

if (!response.state().isTerminal()) {
    System.out.println("Batch is " + response.state());
    System.out.println("Batch ID: " + response.batchId());
} else if (response.state() == BatchState.SUCCEEDED) {
    System.out.println("Batch completed successfully!");

    // Process successful responses
    for (ChatResponse chatResponse : response.responses()) {
        System.out.println(chatResponse.aiMessage().text());
    }

    // Check for individual request errors within the batch
    if (!response.errors().isEmpty()) {
        System.out.println("Some requests failed:");
        for (BatchError error : response.errors()) {
            System.err.println("Error code: " + error.code() + ", message: " + error.message());
        }
    }
} else {
    System.err.println("Batch " + response.state() + ": " + response.errors());
}
```
**注：** `state() == SUCCEEDED`のバッチはバッチジョブが完了したことを示しますが、バッチ内の個別
リクエストが失敗している可能性があります。`errors()`リストには個別リクエストの
失敗（例：タイムアウト、レート制限）が含まれ、`responses()`には成功したレスポンスが含まれます。
どちらも便利なビューであり、決して`null`ではありません（報告するものがない場合は空）ので、
`!responses().isEmpty()` / `!errors().isEmpty()`を確認して部分的な失敗を適切に処理してください。

### 結果とリクエストの対応付け

`responses()`と`errors()`はフラットなビューであり、どの入力がどの結果を生み出したかの追跡を失います。
すべての結果を元のリクエストに対応付ける必要がある場合は、代わりに`results()`を使用します：
リクエストごとに1つの`BatchItemResult`を返し、**提出されたリクエストと同じ順序**なので、
i番目の結果はi番目のリクエストに対応します。各結果は`BatchItemResult.Success`
（`response()`を持つ）または`BatchItemResult.Failure`（`error()`を持つ）のいずれかです：

```java
BatchResponse<ChatResponse> result = batchModel.submit(new BatchRequest<>(requests));
// ... poll until terminal ...

List<BatchItemResult<ChatResponse>> results = result.results();
for (int i = 0; i < results.size(); i++) {
    BatchItemResult<ChatResponse> item = results.get(i);
    if (item.isSuccess()) {
        System.out.println("Request #" + i + " -> " + item.response().aiMessage().text());
    } else {
        BatchError error = item.error();
        System.err.println("Request #" + i + " failed: " + error.code() + " - " + error.message());
    }
}
```
### 結果のポーリング

バッチ処理は非同期であるため、結果をポーリングする必要があります（結果の処理には最大24時間かかる場合があります）：

```java
BatchResponse<ChatResponse> result = batchModel.submit(new BatchRequest<>(requests));
String batchId = result.batchId();

// Poll until the batch reaches a terminal state
while (!result.state().isTerminal()) {
    Thread.sleep(5000); // Wait 5 seconds between polls
    result = batchModel.retrieve(batchId);
}

// Process final result
if (result.state() == BatchState.SUCCEEDED) {
    System.out.println("Successful responses: " + result.responses().size());
    for (ChatResponse chatResponse : result.responses()) {
        System.out.println(chatResponse.aiMessage().text());
    }

    // Handle any individual request failures
    if (!result.errors().isEmpty()) {
        System.out.println("Failed requests: " + result.errors().size());
        for (BatchError error : result.errors()) {
            System.err.println("Error: " + error.code() + " - " + error.message());
        }
    }
} else {
    System.err.println("Batch did not succeed: " + result.state());
}
```
### バッチジョブの管理

**バッチジョブをキャンセル：**

```java
String batchId = // ... obtained from submit(...)

try {
    batchModel.cancel(batchId);
    System.out.println("Batch cancelled successfully");
} catch (HttpException e) {
    System.err.println("Failed to cancel batch: " + e.getMessage());
}
```
**バッチジョブを削除：**

```java
batchModel.deleteBatchJob(batchId);
System.out.println("Batch deleted successfully");
```
**バッチジョブを一覧表示：**

```java
// List first page of batch jobs
BatchPage<ChatResponse> page = batchModel.list(new BatchPagination(10, null));

for (BatchResponse<ChatResponse> batch : page.batches()) {
    System.out.println("Batch: " + batch);
}

// Get next page if available
if (page.nextPageToken() != null) {
    BatchPage<ChatResponse> nextPage = batchModel.list(new BatchPagination(10, page.nextPageToken()));
}
```
### ファイルベースのバッチ処理

高度なユースケースでは、バッチリクエストをJSONLファイルに書き込んでアップロードできます：

```java
// Create a JSONL file with batch requests
Path batchFile = Files.createTempFile("batch", ".jsonl");

try (JsonLinesWriter writer = new StreamingJsonLinesWriter(batchFile)) {
    List<BatchFileRequest<ChatRequest>> fileRequests = List.of(
        new BatchFileRequest<>("request-1", ChatRequest.builder()
            .messages(UserMessage.from("Question 1"))
            .build()),
        new BatchFileRequest<>("request-2", ChatRequest.builder()
            .messages(UserMessage.from("Question 2"))
            .build())
    );
    
    batchModel.writeBatchToFile(writer, fileRequests);
}

// Upload the file
GeminiFiles filesApi = GeminiFiles.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .build();

GeminiFile uploadedFile = filesApi.uploadFile(batchFile, "Batch Chat Requests");

// Create batch from file
BatchResponse<ChatResponse> response = batchModel.submit("File-Based Chat Batch", uploadedFile);
```
### バッチジョブの状態

`BatchState`列挙型は、バッチジョブの可能な状態を表します：

- `PENDING`：バッチはキューに入り、処理待ち
- `RUNNING`：バッチは現在処理中
- `SUCCEEDED`：バッチは正常に完了（終端）
- `FAILED`：バッチ処理が失敗（終端）
- `CANCELLED`：バッチがユーザーによりキャンセルされた（終端）
- `EXPIRED`：完了前にバッチが期限切れ（終端）
- `UNSPECIFIED`：状態が不明または未提供

ポーリングを停止できるタイミングを検出するには、`BatchResponse.state()`に対して`BatchState.isTerminal()`を使用します。

### バッチ優先度の設定

優先度の高いバッチは、優先度の低いバッチより先に処理されます。`GeminiBatchRequest`で優先度を設定します：

```java
// High priority batch
BatchResponse<ChatResponse> highPriority = batchModel.submit(GeminiBatchRequest.from(
    urgentRequests, "Urgent Batch", 100L));

// Low priority batch
BatchResponse<ChatResponse> lowPriority = batchModel.submit(GeminiBatchRequest.from(
    backgroundRequests, "Background Batch", -50L));
```
### 設定

`GoogleAiGeminiBatchChatModel`は、`GoogleAiGeminiChatModel`と同じ設定オプションをサポートします：

```java
GoogleAiGeminiBatchChatModel batchModel = GoogleAiGeminiBatchChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .temperature(0.7)
    .topP(0.95)
    .topK(40)
    .maxOutputTokens(2048)
    .maxRetries(3)
    .timeout(Duration.ofMinutes(5))
    .logRequestsAndResponses(true)
    .build();
```
### 重要な制約

- **モデルの一貫性**：バッチ内のすべてのリクエストは同じモデルを使用する必要があります
- **サイズ制限**：インラインAPIは合計リクエストサイズ20MB以下をサポートします
- **コスト**：バッチ処理はリアルタイムリクエストと比較して50%のコスト削減を提供します
- **ターンアラウンド**：24時間のSLOですが、多くの場合より早く完了します
- **ユースケース**：データ前処理や評価などの大規模で非緊急のタスクに最適


### 例：完全なワークフロー

```java
GoogleAiGeminiBatchChatModel batchModel = GoogleAiGeminiBatchChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

// Prepare batch requests
List<ChatRequest> requests = new ArrayList<>();
for (int i = 0; i < 50; i++) {
    requests.add(ChatRequest.builder()
        .messages(UserMessage.from("Generate a creative story idea #" + i))
        .build());
}

// Submit batch
BatchResponse<ChatResponse> result = batchModel.submit(GeminiBatchRequest.from(
    requests, "Story Ideas Batch", 0L));
String batchId = result.batchId();

// Poll for completion
int attempts = 0;
int maxAttempts = 720; // 1 hour with 5-second intervals
while (!result.state().isTerminal()) {
    if (attempts++ >= maxAttempts) {
        throw new RuntimeException("Batch processing timeout");
    }
    Thread.sleep(5000);
    result = batchModel.retrieve(batchId);
    System.out.println("Status: " + result.state());
}

// Process results
if (result.state() == BatchState.SUCCEEDED) {
    System.out.println("Generated " + result.responses().size() + " stories");
    for (int i = 0; i < result.responses().size(); i++) {
        ChatResponse chatResponse = result.responses().get(i);
        System.out.println("Story #" + i + ": " + chatResponse.aiMessage().text());
    }

    // Report any failures
    if (!result.errors().isEmpty()) {
        System.err.println(result.errors().size() + " requests failed:");
        for (BatchError error : result.errors()) {
            System.err.println("  - Code " + error.code() + ": " + error.message());
        }
    }
} else {
    System.err.println("Batch did not succeed: " + result.state());
}
```
## 詳細情報

Google AI Geminiモデルについてさらに知りたい場合は、その
[ドキュメント](https://ai.google.dev/gemini-api/docs/models/gemini)をご覧ください。
