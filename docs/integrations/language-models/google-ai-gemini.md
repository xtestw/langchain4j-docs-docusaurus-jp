---
sidebar_position: 7
---

# Google AI Gemini

https://ai.google.dev/gemini-api/docs

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-google-ai-gemini</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

## APIキー

無料でAPIキーを取得するには：https://ai.google.dev/gemini-api/docs/api-key

## 利用可能なモデル

ドキュメントで[利用可能なモデル](https://ai.google.dev/gemini-api/docs/models/gemini)のリストを確認してください。

* `gemini-2.0-flash`
* `gemini-1.5-flash`
* `gemini-1.5-pro`
* `gemini-1.0-pro`

## GoogleAiGeminiChatModel

通常の`chat(...)`メソッドが利用可能です：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-1.5-flash")
    ...
    .build();

String response = gemini.chat("Hello Gemini!");
```

また、`ChatResponse chat(ChatRequest req)`メソッドも利用できます：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-1.5-flash")
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
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-1.5-flash")
    .temperature(1.0)
    .topP(0.95)
    .topK(64)
    .maxOutputTokens(8192)
    .timeout(Duration.ofSeconds(60))
    .candidateCount(1)
    .responseFormat(ResponseFormat.JSON) // または .responseFormat(ResponseFormat.builder()...build()) 
    .stopSequences(List.of(...))
    .toolConfig(GeminiFunctionCallingConfig.builder()...build()) // または以下
    .toolConfig(GeminiMode.ANY, List.of("fnOne", "fnTwo"))
    .allowCodeExecution(true)
    .includeCodeExecution(output)
    .logRequestsAndResponses(true)
    .safetySettings(List<GeminiSafetySetting> または Map<GeminiHarmCategory, GeminiHarmBlockThreshold>)
    .build();
```

## GoogleAiGeminiStreamingChatModel
`GoogleAiGeminiStreamingChatModel`は、レスポンスのテキストをトークンごとにストリーミングすることができます。
レスポンスは`StreamingChatResponseHandler`で処理する必要があります。
```java
StreamingChatModel gemini = GoogleAiGeminiStreamingChatModel.builder()
        .apiKey(System.getenv("GEMINI_AI_KEY"))
        .modelName("gemini-1.5-flash")
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

ツール（別名：関数呼び出し）は、並列呼び出しを含めてサポートされています。
`ToolSpecification`で設定された`ChatRequest`を受け入れる`chat(ChatRequest)`メソッドを使用して、Geminiに関数を呼び出すことができることを知らせることができます。
または、LangChain4jの`AiServices`を使用して定義することもできます。

以下は`AiServices`を使用した天気ツールの例です：

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
    .modelName("gemini-1.5-flash")
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

構造化出力の詳細については[こちら](/tutorials/structured-outputs)をご覧ください。

### 自由形式テキストからの型安全なデータ抽出
大規模言語モデルは、非構造化テキストから構造化情報を抽出するのに優れています。
次の例では、`AiServices`のおかげで、天気予報テキストから型安全な`WeatherForecast`オブジェクトを取得します：
```java
// 天気予報を表す型安全/強く型付けされたオブジェクト

record WeatherForecast(
    @Description("minimum temperature")
    Integer minTemperature,
    @Description("maximum temperature")
    Integer maxTemperature,
    @Description("chances of rain")
    boolean rain
) { }

// Geminiとやり取りするためのインターフェース契約

interface WeatherForecastAssistant {
    WeatherForecast extract(String forecast);
}

// データを抽出しましょう：

ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-1.5-flash")
    .responseFormat(ResponseFormat.JSON) // 構造化出力機能を有効にするために必要
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

### レスポンスフォーマット / レスポンススキーマ
`GoogleAiGeminiChatModel`を作成するとき、または呼び出すときに`ResponseFormat`を指定できます。
`GoogleAiGeminiChatModel`を作成するときにレシピのJSONスキーマを定義する例を見てみましょう：
```java
ResponseFormat responseFormat = ResponseFormat.builder()
        .type(ResponseFormatType.JSON)
        .jsonSchema(JsonSchema.builder() // 下記[1]参照
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
        .modelName("gemini-1.5-flash")
        .responseFormat(responseFormat)
        .build();

String recipeResponse = gemini.chat("Suggest a dessert recipe with strawberries");

System.out.println(recipeResponse);
```
注意：
- [1] - `JsonSchema`は`JsonSchemas.jsonSchemaFrom()`ヘルパーメソッドを使用してクラスから自動生成できます。
```java
JsonSchema jsonSchema = JsonSchemas.jsonSchemaFrom(TripItinerary.class).get();
```

`GoogleAiGeminiChatModel`を呼び出すときにレシピのJSONスキーマを定義する例を見てみましょう：
```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
        .apiKey(System.getenv("GEMINI_AI_KEY"))
        .modelName("gemini-1.5-flash")
        .build();

ResponseFormat responseFormat = ...;

ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("Suggest a dessert recipe with strawberries"))
        .responseFormat(responseFormat)
        .build();

ChatResponse chatResponse = gemini.chat(chatRequest);

System.out.println(chatResponse.aiMessage().text());
```

### JSONモード

GeminiにJSON形式で返答させることができます：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-1.5-flash")
    .responseFormat(ResponseFormat.JSON)
    .build();

String roll = gemini.chat("Roll a 6-sided dice");

System.out.println(roll);
// {"roll": "3"}
```

システムプロンプトを使用して、JSONの出力がどのようになるべきかをさらに詳しく説明することができます。
Geminiは通常、提案されたスキーマに従いますが、保証されているわけではありません。
JSONスキーマの確実な適用を望む場合は、前のセクションで説明したようにレスポンスフォーマットを定義する必要があります。

## Pythonコード実行

関数呼び出しの他に、Google AI Geminiはサンドボックス環境でPythonコードを作成して実行することができます。
これは、より高度な計算やロジックが必要な状況で特に興味深いです。

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-1.5-flash")
    .allowCodeExecution(true)
    .includeCodeExecutionOutput(true)
    .build();
```

2つのビルダーメソッドがあります：
* `allowCodeExecution(true)`：GeminiにPythonコーディングができることを知らせる
* `includeCodeExecutionOutput(true)`：実際に作成したPythonスクリプトとその実行結果を見たい場合

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

Geminiはpythonスクリプトを作成し、サーバー上で実行して結果を返します。
コードと実行結果を見るように依頼したので、回答は次のようになります：

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

コード/出力を要求していなかった場合、次のテキストのみを受け取っていたでしょう：

```
The result of `fibonacci(22) - ackermann(3, 4)` is **17586**.

I implemented the Fibonacci and Ackermann functions in Python.
Then I called `fibonacci(22) - ackermann(3, 4)` and printed the result.
```

## マルチモダリティ

Geminiはマルチモーダルモデルであり、テキストを出力しますが、入力ではテキスト以外にも以下のような「モダリティ」を受け入れます：
* 画像（`ImageContent`）
* 動画（`VideoContent`）
* 音声ファイル（`AudioContent`）
* PDFファイル（`PdfFileContent`）

以下の例は、テキストプロンプトと画像を組み合わせる方法を示しています：

```java
// LangChain4jプロジェクトのかわいいカラフルなオウムのマスコットのPNG
String base64Img = b64encoder.encodeToString(readBytes(
  "https://avatars.githubusercontent.com/u/132277850?v=4"));

ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-1.5-flash")
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

## 詳細情報

Google AI Geminiモデルについてもっと知りたい場合は、[ドキュメント](https://ai.google.dev/gemini-api/docs/models/gemini)をご覧ください。
