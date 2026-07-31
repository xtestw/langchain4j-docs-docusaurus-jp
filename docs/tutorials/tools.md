---
sidebar_position: 7
---

# ツール（関数呼び出し）

テキスト生成に加えて、一部のLLMは操作をトリガーすることもできます。

:::note
ツールをサポートするすべてのLLMは[こちら](/integrations/language-models)で確認できます（「Tools」列を参照）。
:::

:::note
すべてのLLMがツールを同等にサポートしているわけではありません。
ツールを理解、選択、正しく使用する能力は、特定のモデルとその能力に大きく依存します。
一部のモデルはツールをまったくサポートしない場合があり、他のモデルは慎重なプロンプトエンジニアリングや
追加のシステム指示が必要な場合があります。
:::

「ツール」または「関数呼び出し」と呼ばれる概念があります。
これは、LLMが必要に応じて1つ以上の利用可能なツール（通常は開発者によって定義されます）を呼び出すことを可能にします。
ツールは、ウェブ検索、外部APIの呼び出し、特定のコードスニペットの実行など、何でも構いません。
LLMは実際にはツールを自分で呼び出すことはできません。代わりに、応答の中で
特定のツールを呼び出す意図を表現します（プレーンテキストで返信する代わりに）。
開発者である私たちは、その後、提供された引数でそのツールを実行し、
ツールの実行結果をLLMに返す必要があります。

例えば、LLM自体は数学が得意ではないことが知られています。
ユースケースで数学計算が時折必要になる場合、LLMに「数学ツール」を提供するとよいでしょう。
LLMに送信するリクエストで1つ以上のツールを宣言することで、
LLMは適切と判断した場合にそれらの1つを呼び出すことを決定できます。
数学の問題と一連の数学ツールが与えられた場合、LLMは正しく回答するために、
提供された数学ツールの1つを先に呼び出すべきだと判断するかもしれません。

実際にどのように機能するかを見てみましょう（ツールありの場合となしの場合）。

ツールなしのメッセージ交換の例：
```
Request:
- messages:
    - UserMessage:
        - text: What is the square root of 475695037565?

Response:
- AiMessage:
    - text: The square root of 475695037565 is approximately 689710.
```
近いですが、正しくありません。

以下のツールを使用したメッセージ交換の例：
```java
@Tool("Sums 2 given numbers")
double sum(double a, double b) {
    return a + b;
}

@Tool("Returns a square root of a given number")
double squareRoot(double x) {
    return Math.sqrt(x);
}
```
申し訳ありませんが、翻訳するための中国語のMarkdown断片が提供されていません。翻訳対象のテキストを入力してください。
```
Request 1:
- messages:
    - UserMessage:
        - text: What is the square root of 475695037565?
- tools:
    - sum(double a, double b): Sums 2 given numbers
    - squareRoot(double x): Returns a square root of a given number

Response 1:
- AiMessage:
    - toolExecutionRequests:
        - squareRoot(475695037565)


... here we are executing the squareRoot method with the "475695037565" argument and getting "689706.486532" as a result ...


Request 2:
- messages:
    - UserMessage:
        - text: What is the square root of 475695037565?
    - AiMessage:
        - toolExecutionRequests:
            - squareRoot(475695037565)
    - ToolExecutionResultMessage:
        - text: 689706.486532

Response 2:
- AiMessage:
    - text: The square root of 475695037565 is 689706.486532.
```

ご覧のとおり、LLMがツールにアクセスできる場合、適切なタイミングでそのうちの1つを呼び出すことを決定できます。

これは非常に強力な機能です。
この簡単な例では、LLMに基本的な数学ツールを提供しましたが、
例えば `googleSearch` や `sendEmail` ツールを提供し、
「私の友人がAI分野の最新ニュースを知りたがっています。簡単な要約をfriend@email.comに送信してください」のようなクエリを与えた場合を想像してみてください。
LLMは `googleSearch` ツールを使用して最新ニュースを検索し、
その後 `sendEmail` ツールを使用して要約を送信することができます。

:::note
LLMが正しいパラメータで正しいツールを呼び出す可能性を高めるために、
明確で曖昧さのないものを提供する必要があります：
- ツール名
- ツールが何をするか、いつ使用すべきかの説明
- 各ツールパラメータの説明

経験則：人間がツールの目的と使用方法を理解できるなら、
LLMもおそらく理解できるでしょう。
:::

LLMは、いつツールを呼び出すか、どのように呼び出すかを検出するために特別に微調整されています。
一部のモデルは一度に複数のツールを呼び出すこともできます。例えば
[OpenAI](https://platform.openai.com/docs/guides/function-calling/parallel-function-calling) などです。

:::note
すべてのモデルがツールをサポートしているわけではないことに注意してください。

ツールをサポートするモデルを確認するには、[この](https://docs.langchain4j.dev/integrations/language-models/)ページの「Tools」列を参照してください。
:::

:::note
ツール/関数呼び出しは [JSON モード](/tutorials/ai-services#json-mode) とは異なることに注意してください。
:::

# 2つの抽象化レベル

LangChain4j はツールを使用するための2つの抽象化レベルを提供します：
- 低レベル：`ChatModel` と `ToolSpecification` API を使用
- 高レベル：[AI Services](/tutorials/ai-services) と `@Tool` アノテーションが付いた Java メソッドを使用

## 低レベルツール API

低レベルでは、`ChatModel` の `chat(ChatRequest)` メソッドを使用できます。
`StreamingChatModel` にも同様のメソッドがあります。

`ChatRequest` を作成する際に、1つ以上の `ToolSpecification` を指定できます。

`ToolSpecification` はツールに関するすべての情報を含むオブジェクトです：
- ツールの `name`
- ツールの `description`
- ツールの `parameters` とその説明
- ツールの `metadata`。
デフォルトでは LLM プロバイダーに送信されず、`ChatModel` を作成する際にどのメタデータキーを送信するかを明示的に指定する必要があります。
現在、ツールメタデータは `langchain4j-anthropic` モジュールのみでサポートされています。
ツールが [McpToolProvider](/tutorials/mcp#mcp-tool-provider) によって提供される場合、
`metadata` には MCP 固有のエントリを含めることができます。

ツールに関する詳細情報を提供することをお勧めします：
明確な名前、包括的な説明、各パラメータの説明など。

### ツール仕様の作成

`ToolSpecification` を作成するには2つの方法があります：

1. 手動で作成
```java
ToolSpecification toolSpecification = ToolSpecification.builder()
    .name("getWeather")
    .description("Returns the weather forecast for a given city")
    .parameters(JsonObjectSchema.builder()
        .addStringProperty("city", "The city for which the weather forecast should be returned")
        .addEnumProperty("temperatureUnit", List.of("CELSIUS", "FAHRENHEIT"))
        .required("city") // the required properties should be specified explicitly
        .build())
    .build();
```

`JsonObjectSchema` の詳細については、[こちら](/tutorials/structured-outputs#jsonobjectschema) を参照してください。

2. ヘルパーメソッドを使用する：
- `ToolSpecifications.toolSpecificationsFrom(Class)`
- `ToolSpecifications.toolSpecificationsFrom(Object)`
- `ToolSpecifications.toolSpecificationFrom(Method)`

```java
class WeatherTools { 
  
    @Tool("Returns the weather forecast for a given city")
    String getWeather(
            @P("The city for which the weather forecast should be returned") String city,
            TemperatureUnit temperatureUnit
    ) {
        ...
    }
}

List<ToolSpecification> toolSpecifications = ToolSpecifications.toolSpecificationsFrom(WeatherTools.class);
```

### JSON シリアライゼーション

`ToolSpecification` は、`toJson()` メソッドと `fromJson()` メソッドを使用して JSON にシリアライズし、元に戻すことができます。
これは、例えばツール仕様をデータベースに保存したり、ネットワーク経由で転送したりする場合に便利です。

```java
String json = toolSpecification.toJson();

ToolSpecification deserialized = ToolSpecification.fromJson(json);
```

デフォルトでは、専用のJackson `ObjectMapper`がJSON変換に使用されます。
`ToolSpecificationJsonCodecFactory`を実装し、
`META-INF/services/dev.langchain4j.spi.agent.tool.ToolSpecificationJsonCodecFactory`に登録することで、
SPIを介して独自の`ToolSpecificationJsonCodec`実装を提供できます。

### `ChatModel` の使用

`List<ToolSpecification>`を取得したら、モデルを呼び出すことができます：
```java
ChatRequest request = ChatRequest.builder()
    .messages(UserMessage.from("What will the weather be like in London tomorrow?"))
    .toolSpecifications(toolSpecifications)
    .build();
ChatResponse response = model.chat(request);
AiMessage aiMessage = response.aiMessage();
```

LLM がツール呼び出しを決定した場合、返される `AiMessage` には
`toolExecutionRequests` フィールドにデータが含まれます。
このとき、`AiMessage.hasToolExecutionRequests()` は `true` を返します。
LLM によっては、1 つまたは複数の `ToolExecutionRequest` オブジェクトが含まれることがあります
（一部の LLM は複数のツールの並列呼び出しをサポートしています）。

各 `ToolExecutionRequest` には以下が含まれる必要があります：
- ツール呼び出しの `id`。一部の LLM プロバイダー（例：Google、Ollama）ではこの ID が省略される場合があることに注意してください。
- 呼び出すツールの `name`（例：`getWeather`）
- `arguments`（例：`{ "city": "London", "temperatureUnit": "CELSIUS" }`）

`ToolExecutionRequest` の情報を使用して、ツールを手動で実行する必要があります。

ツールの実行結果を LLM に送り返すには、
`ToolExecutionResultMessage`（各 `ToolExecutionRequest` につき 1 つ）を作成し、
それを以前のすべてのメッセージと一緒に送信する必要があります：
```java

String result = "It is expected to rain in London tomorrow.";
ToolExecutionResultMessage toolExecutionResultMessage = ToolExecutionResultMessage.from(toolExecutionRequest, result);
ChatRequest request2 = ChatRequest.builder()
        .messages(List.of(userMessage, aiMessage, toolExecutionResultMessage))
        .toolSpecifications(toolSpecifications)
        .build();
ChatResponse response2 = model.chat(request2);
```

#### マルチモーダルツール結果

`ToolExecutionResultMessage` は、画像などの非テキストコンテンツも保持できます。
`text()` を使用するだけでなく、`contents()` を備えたビルダーも使用できます：
```java
ToolExecutionResultMessage toolExecutionResultMessage = ToolExecutionResultMessage.builder()
        .id(toolExecutionRequest.id())
        .toolName(toolExecutionRequest.name())
        .contents(
                TextContent.from("Here is the photo"),
                ImageContent.from(Image.builder()
                        .base64Data(base64Data)
                        .mimeType("image/png")
                        .build())
        )
        .build();
```

:::note
すべてのLLMプロバイダーがマルチモーダルツール結果をサポートしているわけではありません。
プロバイダーのサポート状況の詳細については、[画像とマルチモーダルコンテンツの返却](/tutorials/tools#returning-images-and-multimodal-content)を参照してください。
:::

### `StreamingChatModel` の使用

`List<ToolSpecification>` を取得したら、モデルを呼び出すことができます：
```java
ChatRequest request = ChatRequest.builder()
    .messages(UserMessage.from("What will the weather be like in London tomorrow?"))
    .toolSpecifications(toolSpecifications)
    .build();

model.chat(request, new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.println("onPartialResponse: " + partialResponse);
    }

    @Override
    public void onPartialToolCall(PartialToolCall partialToolCall) {
        System.out.println("onPartialToolCall: " + partialToolCall);
    }

    @Override
    public void onCompleteToolCall(CompleteToolCall completeToolCall) {
        System.out.println("onCompleteToolCall: " + completeToolCall);
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        System.out.println("onCompleteResponse: " + completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        error.printStackTrace();
    }
});
```

LLM がツール呼び出しを決定した場合、`onPartialToolCall(PartialToolCall)` コールバックは、
通常、最終的に `onCompleteToolCall(CompleteToolCall)` が呼び出される前に複数回呼び出されます。
後者は、そのツール呼び出しのストリーミング出力が完了したことを示します。

:::note
すべての LLM プロバイダーが部分的なツール呼び出しをストリーミングするわけではないことに注意してください。
一部のプロバイダー（例：Bedrock、Google、Mistral、Ollama）は完全なツール呼び出しのみを返します。
これらの場合、`onPartialToolCall` コールバックは呼び出されず、`onCompleteToolCall` のみが呼び出されます。
:::

単一のツール呼び出しのストリーミング出力は次のようになります：
```
onPartialToolCall(index = 0, id = "call_abc", name = "get_weather", partialArguments = "{\"")
onPartialToolCall(index = 0, id = "call_abc", name = "get_weather", partialArguments = "city")
onPartialToolCall(index = 0, id = "call_abc", name = "get_weather", partialArguments = ""\":\"")
onPartialToolCall(index = 0, id = "call_abc", name = "get_weather", partialArguments = "London")
onPartialToolCall(index = 0, id = "call_abc", name = "get_weather", partialArguments = "\"}")
onCompleteToolCall(index = 0, id = "call_abc", name = "get_weather", arguments = "{\"city\":\"London\"}")
```

LLMが複数のツール呼び出しを開始した場合、`index`は増加し、異なる`PartialToolCall`同士や、最終的な`CompleteToolCall`との対応付けが可能になります。

完全なレスポンスのストリーミングが終了し、`onCompleteResponse(ChatResponse)`が呼び出されると、
`ChatResponse`内の`AiMessage`には、ストリーミング中に発生したすべてのツール呼び出しが含まれます。

## 高レベルツールAPI

高レベルの抽象化では、任意のJavaメソッドに`@Tool`アノテーションを付与し、
[AIサービス](/tutorials/ai-services#tools-function-calling)を作成する際に指定できます。

AIサービスは、そのようなメソッドを自動的に`ToolSpecification`に変換し、
LLMとの各やり取りのリクエストに含めます。
LLMがツールを呼び出すことを決定した場合、AIサービスは自動的に対応するメソッドを実行し、
メソッドの戻り値（存在する場合）はLLMに送り返されます。
実装の詳細は`DefaultToolExecutor`にあります。

ツールの例をいくつか示します。
```java
@Tool("Searches Google for relevant URLs, given the query")
public List<String> searchGoogle(@P("search query") String query) {
    return googleSearchService.search(query);
}

@Tool("Returns the content of a web page, given the URL")
public String getWebPageContent(@P("URL of the page") String url) {
    Document jsoupDocument = Jsoup.connect(url).get();
    return jsoupDocument.body().text();
}
```

### ツールメソッドの制限

`@Tool` で注釈されたメソッドは:
- 静的メソッドまたは非静的メソッドのいずれかを使用できます
- 任意の可視性（public、private など）を持つことができます

### ツールメソッドのパラメータ

`@Tool` で注釈されたメソッドは、さまざまな型の任意の数のパラメータを受け入れることができます:
- プリミティブ型: `int`、`double` など
- オブジェクト型: `String`、`Integer`、`Double` など
- カスタム POJO（ネストされた POJO を含むことができます）
- `enum`
- ポリモーフィック型（sealed インターフェース/クラス、または Jackson の `@JsonSubTypes` / `@JsonTypeInfo` で注釈された型）— [ポリモーフィックツールパラメータ](#polymorphic-tool-parameters) を参照してください
- 上記の型のいずれかである `List<T>` / `Set<T>`
- `Map<K,V>`（`@P` を使用してパラメータの説明に `K` と `V` の型を手動で指定する必要があります）

パラメータのないメソッドもサポートされています。

#### パラメータ名

デフォルトでは、`@P` の `name` 属性が指定されていない場合、パラメータ名はリフレクションによって取得されます。
ただし、`-parameters` javac オプションがない場合、リフレクションは `arg0`、`arg1` などの汎用的な名前を返します。
パラメータの意味が失われ、LLM を混乱させる可能性があります。

`@P` で `name` を設定することは、次の 2 つの場合に役立ちます:

1. **`-parameters` javac オプションがない場合** — LLM が参照するであろう汎用的な `arg0` / `arg1` という名前を避けるためです。
   Quarkus や Spring などのフレームワークはデフォルトで `-parameters` を有効にするため、
   実際のメソッドパラメータ名が保持され、これらのフレームワークを使用する場合は通常 `name` を設定する必要がないことに注意してください。
2. **LLM 用のカスタム名** — ソースコード内のパラメータ名とは異なるパラメータ名を LLM に表示したい場合
   （たとえば、特定の API 契約に一致させるため、またはより説明的な名前を提供するため）。

**例:**
```java
@Tool
void getTemperature(
        @P("Temperature value") double value,
        @P("Unit of temperature") Optional<String> unit) {
    ...
}
```

#### 必須とオプション

デフォルトでは、すべてのツールメソッドのパラメータは**_必須_**と見なされます。
これは、パラメータが LLM に送信される JSON スキーマの `required` 配列にリストされ、
値の生成が指示されることを意味します。
パラメータに `@P(required = false)` アノテーションを付けることで、オプションにすることができます：
```java
@Tool
String getTemperature(String location, @P(required = false) Unit unit) {
    ...
}
```

または、パラメータを `Optional<T>` として宣言することもできます：
```java
@Tool
String getTemperature(String location, Optional<Unit> unit) {
    ...
}
```

複雑なパラメータのフィールドとサブフィールドも、デフォルトでは**_必須_**と見なされます。
フィールドに `@JsonProperty(required = false)` アノテーションを付けることで、任意指定にできます：
```java
record User(String name, @JsonProperty(required = false) String email) {}

@Tool
void add(User user) {
    ...
}
```

:::note
[结构化输出](/tutorials/structured-outputs)と併用する場合、
すべてのフィールドとサブフィールドはデフォルトで**_オプション_**として扱われることに注意してください。
:::

:::caution Required は推奨事項です：LLM がパラメータを省略する可能性があります
`required` フラグは LLM に送信される JSON スキーマを制御します（必須パラメータは
スキーマの `required` 配列にリストされます）。LLM がこれに従うことが期待されますが、実際には
スキーマを無視してパラメータを省略する可能性があります。

LangChain4j 1.x では、これは**プリミティブ型**パラメータ（`int`、`long`、`boolean` など）に対してのみ検出されます——
欠落したプリミティブ型は `ToolArgumentsErrorHandler` をトリガーします（下記の[エラーハンドリング](#handling-tool-arguments-errors)を参照）。
**欠落したオブジェクトパラメータは検証されません**：スキーマがパラメータを必須とマークしていても、
`@Tool` アノテーション付きメソッドには `null` が渡されます。

LangChain4j 2.0 ではこの非対称性を解消し、すべての必須パラメータを
一貫して検証することを計画しています。この計画の変更がユースケースに影響する場合は、
[issue を提出](https://github.com/langchain4j/langchain4j/issues)してください。実装前にフィードバックを反映します。

`null` の代わりに実際のフォールバック値を使用したい場合（またはプリミティブ型パラメータのエラーの代わりに）、
[`@P(defaultValue = ...)`](#default-parameter-values) を使用してください。
:::

#### デフォルトパラメータ値

`@P(defaultValue = "...")` は、LLM がパラメータを省略した場合に LangChain4j が置き換える値を宣言します。

これはパラメータをオプションにし、ツールメソッドに合理的なフォールバック値を提供する最も簡単な方法です。

```java
enum SortBy { RELEVANCE, DATE, RATING }

@Tool
List<Article> searchArticles(
    String query,
    @P(defaultValue = "10") int limit,
    @P(defaultValue = "[\"en\"]") List<String> languages,
    @P(defaultValue = "RELEVANCE") SortBy sortBy
) {
    // When the LLM omits them:
    //   'limit'     -> 10
    //   'languages' -> ["en"]
    //   'sortBy'    -> SortBy.RELEVANCE
}
```

**`defaultValue` を設定すると、JSON スキーマ上ではオプション扱いになります** — `@P(required)` の指定に関係なく、そのパラメータはスキーマの `required` 配列には*含まれません*。LLM にはこのパラメータを省略してもよいと伝えられ、省略された場合、LangChain4j はメソッド呼び出し前にデフォルト値を代入します。

**サポートされる型：**

| 型                         | 形式                   | 例                                  |
|------------------------------|--------------------------|------------------------------------------|
| `String`                     | そのまま使用            | `defaultValue = "USD"`                   |
| プリミティブ型 / ラッパー型  | 型固有の変換 | `"10"`、`"3.14"`、`"true"`               |
| `enum`                       | 列挙定数名       | `defaultValue = "EUR"`                   |
| `UUID`                       | `UUID.fromString`        | `"550e8400-e29b-41d4-a716-446655440000"` |
| `BigDecimal`、`BigInteger`   | 数値リテラル          | `"1.5"`、`"100"`                         |
| `List<T>` / `Set<T>` / 配列 | JSON 配列               | `"[\"a\",\"b\"]"`, `"[1,2,3]"`           |
| `Map<K,V>`                   | JSON オブジェクト               | `"{\"a\":1,\"b\":2}"`                    |
| POJO（ネストを含む）     | JSON オブジェクト              | `"{\"name\":\"Klaus\",\"age\":42}"`      |

デフォルト値の文字列は AI Service の登録時に解析されます。パラメータ型に変換できない場合、AI Service の構築は問題のあるパラメータを指摘して即座に `IllegalConfigurationException` で失敗します。つまり、タイプミスは最初の LLM 呼び出し時ではなく、起動時に検出されます。

**デフォルト値は「欠落」に対してのみ適用され、「不正な値」には適用されません。** LLM が提供したパラメータの型変換に失敗した場合（例：`int` に対して `"banana"` が渡された場合）、変換エラーは通常どおり伝播します。デフォルト値がフォールバックとして使用されることは*ありません*。

**デフォルト値は呼び出しのたびに再解析されるため、** 可変なデフォルトの `List` / `Map` / POJO を変更するツールが後続の呼び出しに影響を与えることはありません。









```java
@Tool
void process(@P(defaultValue = "[\"a\",\"b\"]") List<String> tags) {
    tags.add("processed"); // safe — next invocation still receives ["a","b"]
}
```

**制限**（登録時に `IllegalConfigurationException` で拒否されます）：

- `defaultValue` は `Optional<T>` と組み合わせられません — `Optional` はすでに
  「欠落」をエンコードしています。どちらか一方のメカニズムを選択してください。
- `defaultValue` は LangChain4j が注入するパラメータ（`@ToolMemoryId`、
  `InvocationContext` など）には設定できません — これらは LLM から提供されるものではないためです。

#### ポリモーフィックなツールパラメータ

ツールパラメータはポリモーフィック型にできます — つまり、具体的なサブタイプが
呼び出し時に LLM によって決定される基本型です。sealed インターフェースと sealed クラスは
アノテーションなしで機能します。通常の抽象クラスとインターフェースは、Jackson の
`@JsonSubTypes` を使用してサブタイプを宣言する必要があります。
LLM に送信されるスキーマには、許可されたサブタイプの `anyOf` が含まれ、それぞれに
判別子プロパティ（デフォルトは `"type"`）があり、LLM が生成する具体的な
型を伝えられるようになっています。LangChain4j はツールメソッドを呼び出す前に、LLM のパラメータを正しいサブタイプに逆シリアル化します。

これは、パラメータとしてのポリモーフィック型、ポリモーフィック型の `List<T>` / `Set<T>`、
および別の POJO パラメータ内にネストされたポリモーフィック型に対して機能します。

**sealed インターフェースとクラス — アノテーション不要：**


```java
sealed interface Animal permits Dog, Cat {}

record Dog(String name, String breed) implements Animal {}

record Cat(String name, boolean indoor) implements Animal {}

class AnimalRegistry {

    @Tool("Registers a single animal")
    void registerAnimal(Animal animal) { /* dispatched to Dog or Cat */ }

    @Tool("Registers a batch of animals")
    void registerAnimals(List<Animal> animals) { /* mixed Dog / Cat */ }

    @Tool("Registers an owner with their pet")
    void registerOwner(Owner owner) { /* Owner.pet is dispatched */ }
}

record Owner(String name, Animal pet) {}
```

**Jackson `@JsonSubTypes` / `@JsonTypeInfo`** もサポートされており、オンライン上の
名前を Java クラス名から切り離すことができます：

```java
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "kind")
@JsonSubTypes({
    @JsonSubTypes.Type(value = Square.class, name = "square"),
    @JsonSubTypes.Type(value = Circle.class, name = "circle")
})
interface Shape {}

class ShapeRegistry {

    @Tool("Registers a shape")
    void registerShape(Shape shape) { /* dispatched to Square or Circle */ }
}
```

サポートされている`@JsonTypeInfo`オプションのセット、判別子名の解決順序、
`defaultImpl`の動作、`visible`フラグ、およびフィールド衝突の検出については、
構造化出力の[ポリモーフィック型](/tutorials/structured-outputs#polymorphic-types)で
詳しく説明されています。これらはツールパラメータにも同様に適用されます。

#### 再帰的パラメータ

再帰的パラメータ（例：`Set<Person> children`フィールドを持つ`Person`クラス）は、
現在OpenAIでのみサポートされています。

### ツールメソッドの戻り値の型
`@Tool`でアノテーションされたメソッドは、`void`を含む任意の型を返すことができます。
メソッドの戻り値の型が`void`の場合、メソッドが正常に戻れば「Success」という文字列がLLMに送信されます。

メソッドの戻り値の型が`String`の場合、戻り値は変換なしでそのままLLMに送信されます。

その他の戻り値の型の場合、戻り値はLLMに送信される前にJSON文字列に変換されます。

#### 画像およびマルチモーダルコンテンツの返却

ツールは画像やその他のテキスト以外のコンテンツも返すことができます。ツールが以下の型のいずれかを返す場合、
結果はJSONテキストにシリアライズされる代わりに、マルチモーダルコンテンツ（例：画像）としてLLMに送信されます：

- `Image` — 単一の画像として送信
- `ImageContent` — 単一の画像コンテンツとして送信
- `Content` — 単一のコンテンツ要素として送信（例：`TextContent`、`ImageContent`）
- `List<Content>` — 複数のコンテンツ要素として送信
- `Content[]` — 複数のコンテンツ要素として送信

例えば、写真を撮って画像を返すツールは次のようになります：
```java
@Tool("Takes a photo and returns it")
Image takePhoto() {
    byte[] imageBytes = camera.capture();
    return Image.builder()
            .base64Data(Base64.getEncoder().encodeToString(imageBytes))
            .mimeType("image/png")
            .build();
}
```

またはテキストと画像を返すツール：
```java
@Tool("Takes a photo and returns it with a description")
List<Content> takePhoto() {
    Image image = camera.capture();
    return List.of(
            TextContent.from("Photo taken at " + LocalDateTime.now()),
            ImageContent.from(image)
    );
}
```

:::note
すべての LLM プロバイダーがマルチモーダルなツール結果をサポートしているわけではありません。

現在、ツール結果内の画像をサポートしているプロバイダーには、Anthropic、Amazon Bedrock、Google AI Gemini が含まれます。
ツールが非テキストコンテンツを返す場合、他のプロバイダーは `UnsupportedFeatureException` をスローします。
:::

### AI サービスを他の AI サービスのツールとして使用する

AI サービスは、他の AI サービスのツールとしても使用できます。これは、多くのエージェントのユースケースで役立ちます。ある AI サービスが、特定のタスクを実行するために、より専門的な別の AI サービスの支援を要求できるからです。例えば、以下の AI サービスを定義した場合を考えてみましょう。
```java
    interface RouterAgent {

        @dev.langchain4j.service.UserMessage("""
            Analyze the following user request and categorize it as 'legal', 'medical' or 'technical',
            then forward the request as it is to the corresponding expert provided as a tool.
            Finally return the answer that you received from the expert without any modification.

            The user request is: '{{it}}'.
            """)
        String askToExpert(String request);
    }

    interface MedicalExpert {

        @dev.langchain4j.service.UserMessage("""
            You are a medical expert.
            Analyze the following user request under a medical point of view and provide the best possible answer.
            The user request is {{it}}.
            """)
        @Tool("A medical expert")
        String medicalRequest(String request);
    }

    interface LegalExpert {

        @dev.langchain4j.service.UserMessage("""
            You are a legal expert.
            Analyze the following user request under a legal point of view and provide the best possible answer.
            The user request is {{it}}.
            """)
        @Tool("A legal expert")
        String legalRequest(String request);
    }

    interface TechnicalExpert {

        @dev.langchain4j.service.UserMessage("""
            You are a technical expert.
            Analyze the following user request under a technical point of view and provide the best possible answer.
            The user request is {{it}}.
            """)
        @Tool("A technical expert")
        String technicalRequest(String request);
    }
```

`RouterAgent` は、ユーザーのリクエストをそのうちの1つにルーティングするために、他の3つの特定分野の専門家AIサービスをツールとして使用するように設定できます。

```java
MedicalExpert medicalExpert = AiServices.builder(MedicalExpert.class)
        .chatModel(model)
        .build();
LegalExpert legalExpert = AiServices.builder(LegalExpert.class)
        .chatModel(model)
        .build();
TechnicalExpert technicalExpert = AiServices.builder(TechnicalExpert.class)
        .chatModel(model)
        .build();

RouterAgent routerAgent = AiServices.builder(RouterAgent.class)
        .chatModel(model)
        .tools(medicalExpert, legalExpert, technicalExpert)
        .build();

routerAgent.askToExpert("I broke my leg what should I do");
```

:::note
AI サービスを他の AI サービスのツールとして使用することは、複雑なエージェントシステムを構築するための強力な機能です。ただし、この方法には注意すべき関連する欠点もいくつかあります：
- この実装では、LLM がユーザーのリクエストをツール呼び出しとしてそのままコピー＆ペーストする必要があり、これはエラーが発生しやすい操作となる可能性があります。
- 別の LLM をツールとして呼び出す LLM は、（他のツール呼び出しと同様に）その応答を再処理する必要があり、時間と消費されるトークンの点で無駄な計算となる可能性があります。
- ツールとして機能するエージェントは完全に分離された AI サービスであり、それを呼び出すエージェントのチャットメモリにアクセスできないため、チャットメモリを使用してより情報に基づいた回答を提供することはできません。
:::


### `@Tool`

`@Tool` アノテーションが付けられ、AI サービスの構築時に*明示的に*指定された Java メソッドは、すべて LLM によって実行できます：
```java
interface MathGenius {
    
    String ask(String question);
}

class Calculator {
    
    @Tool
    double add(int a, int b) {
        return a + b;
    }

    @Tool
    double squareRoot(double x) {
        return Math.sqrt(x);
    }
}

MathGenius mathGenius = AiServices.builder(MathGenius.class)
    .chatModel(model)
    .tools(new Calculator())
    .build();

String answer = mathGenius.ask("What is the square root of 475695037565?");

System.out.println(answer); // The square root of 475695037565 is 689706.486532.
```

`ask` メソッドを呼び出すと、前述の章で説明したように、LLM との間で 2 回のやり取りが発生します。
これらのやり取りの間に、`squareRoot` メソッドが自動的に呼び出されます。

`@Tool` アノテーションには、次のフィールドがあります：
- `name`：ツール名。指定しない場合、メソッド名がツール名として使用されます。
- `value`：ツールの説明。
- `returnBehavior`：詳細は[こちら](/tutorials/tools#returning-immediately-the-result-of-a-tool-execution-request)を参照してください。
- `metadata`：LLM プロバイダー固有のツールメタデータエントリを含む有効な JSON 文字列。

デフォルトでは LLM プロバイダーに送信されず、`ChatModel` を作成する際に、どのメタデータキーを送信するかを明示的に指定する必要があります。
現在、ツールメタデータは `langchain4j-anthropic` モジュールのみでサポートされています。

ツールによっては、説明がなくても LLM が十分に理解できる場合もありますが
（例：`add(a, b)` は明らかです）、
通常は、明確で意味のある名前と説明を提供するのが最善です。

そうすることで、LLM は特定のツールを呼び出すかどうか、またどのように呼び出すかを決定するための情報をより多く得られます。

### 継承とツールの発見

具体的な `@Tool` アノテーション付きメソッドは、スーパークラスとインターフェースから継承されます。AI Service にツールオブジェクトを渡すと、LangChain4j はオブジェクトのクラス、そのすべてのスーパークラス（`Object` は除く）、および実装されたインターフェースの `default` メソッドと `static` メソッドから `@Tool` メソッドを発見します。
```java
class BaseMathTools {

    @Tool("Calculates the sum of two numbers")
    int sum(int a, int b) {
        return a + b;
    }
}

class AdvancedMathTools extends BaseMathTools {

    @Tool("Calculates the product of two numbers")
    int multiply(int a, int b) {
        return a * b;
    }
}

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .tools(new AdvancedMathTools()) // both "sum" and "multiply" are available
    .build();
```

子クラスは親クラスの `@Tool` メソッドをオーバーライドできます。この場合、子クラスのバージョン（その `@Tool` アノテーションを含む）のみが使用されます：

```java
class ParentTools {

    @Tool("Returns the greeting")
    String greet(String name) {
        return "Hello, " + name;
    }
}

class ChildTools extends ParentTools {

    @Override
    @Tool(name = "greet_formal", value = "Returns a formal greeting")
    String greet(String name) {
        return "Good day, " + name;
    }
}
```

ここで、LLM は `greet_formal` という名前で、「正式な挨拶を返す」と説明された単一のツールを参照します。

サブクラスが親メソッドと同じ名前だが異なるパラメータを持つメソッドを宣言する場合（オーバーライドではなくオーバーロード）、両方のメソッドが検出されます。ツール名は一意である必要があり、デフォルトではメソッド名になるため、少なくとも一方に明示的な名前を付ける必要があります。

```java
class ParentTools {

    @Tool(name = "process_text", value = "Processes a text input")
    String process(String input) {
        return input.toUpperCase();
    }
}

class ChildTools extends ParentTools {

    @Tool(name = "process_number", value = "Processes a numeric input")
    int process(int input) {
        return input * 2;
    }
}
```

両方のメソッドが同じツール名に解決される場合、AIサービスの作成時に`IllegalArgumentException`がスローされます。

### `@P`

メソッドのパラメータには、任意で`@P`を付与できます。

`@P`アノテーションには、以下の任意フィールドがあります：

- `name`：LLMから見えるパラメータ名。指定しない場合、実際のメソッドパラメータ名が使用されます。
- `description`：パラメータの説明（`value`のエイリアス）。デフォルトは空です。
- `value`：パラメータの説明（`description`のエイリアス）。デフォルトは空です。
- `required`：パラメータが必須かどうか。デフォルトは`true`です。

#### パラメータ名

`name`属性は、LLMが参照するパラメータ名を上書きします。
`name`を設定すると便利なケースは2つあります：

1. **`-parameters` javacオプションがない場合。**
   `-parameters` javacオプションがないと、Javaリフレクションは`arg0`、`arg1`などの汎用的な名前を返します。
   パラメータの意味が失われ、LLMを混乱させる可能性があります。
   `name`を設定することで、意味のある名前を復元できます。
   QuarkusやSpringなどのフレームワークはデフォルトで`-parameters`を有効にするため、
   実際のメソッドパラメータ名が保持され、これらのフレームワークを使用する場合は通常`name`を設定する必要はありません。

2. **LLM用のカスタム名。**
   開発者がソースコードで使用しているパラメータ名とは異なる名前をLLMに表示したい場合
   （たとえば、特定のAPI契約に合わせる場合や、より説明的な名前を提供する場合）。

#### パラメータの説明

`description`と`value`は相互に置き換え可能です。どちらもLLMが参照するパラメータの説明を設定します。
説明のみが必要な場合は、短縮形の`value`形式を使用します：
```java
@Tool
void getWeather(@P("The city name") String city) { ... }
```

名前と説明の両方が必要な場合は、名前付き属性を使用します。
```java
@Tool
void getWeather(@P(name = "city", description = "The city name") String city) { ... }
```

### `@Description`

クラスとフィールドの説明は、`@Description` アノテーションを使用して指定できます：
```java
@Description("Query to execute")
class Query {

  @Description("Fields to select")
  private List<String> select;

  @Description("Conditions to filter on")
  private List<Condition> where;
}

@Tool
Result executeQuery(Query query) {
  ...
}
```

:::note
`enum` 値に付与された `@Description` は **_効果がなく_**、生成される JSON スキーマには **_含まれない_** ことに注意してください：
:::
```java
enum Priority {

    @Description("Critical issues such as payment gateway failures or security breaches.") // this is ignored
    CRITICAL,
    
    @Description("High-priority issues like major feature malfunctions or widespread outages.") // this is ignored
    HIGH,
    
    @Description("Low-priority issues such as minor bugs or cosmetic problems.") // this is ignored
    LOW
}
```
::: 

### `InvocationParameters`
AI Service を呼び出す際にツールへ追加データを渡したい場合は、
`InvocationParameters` を使用できます：
```java

interface Assistant {
    String chat(@UserMessage String userMessage, InvocationParameters parameters);
}

class Tools {
    @Tool
    String getWeather(String city, InvocationParameters parameters) {
        String userId = parameters.get("userId");
        UserPreferences preferences = getUserPreferences(userId);
        return weatherService.getWeather(city, preferences.temperatureUnits());
    }
}

InvocationParameters parameters = InvocationParameters.from(Map.of("userId", "12345"));
String response = assistant.chat("What is the weather in London?", parameters);
```

この場合、LLM はこれらのパラメータを認識しません。
それらは LangChain4j とユーザーコードにのみ表示されます。

`InvocationParameters` は、他の AI Service コンポーネントでもアクセスできます。例：
- [`ToolProvider`](/tutorials/tools#specifying-tools-dynamically)：`ToolProviderRequest` 内
- [`ToolArgumentsErrorHandler`](/tutorials/tools#handling-tool-arguments-errors)
および [`ToolExecutionErrorHandler`](https://docs.langchain4j.dev/tutorials/tools#handling-tool-execution-errors)：
`ToolErrorContext` 内
- [RAG コンポーネント](/tutorials/rag/)：`Query` -> `Metadata` 内

パラメータは、可変でスレッドセーフな `Map` に格納されます。

データは、AI Service の単一呼び出し中に、`InvocationParameters` を介して
AI Service コンポーネント間で受け渡しできます（例：あるツールから別のツールへ、または RAG コンポーネントからツールへ）。

### `InvocationContext`

`InvocationParameters` と同様に、`@Tool` アノテーションが付いたメソッドは
`InvocationContext` パラメータを受け入れて、AI Service 呼び出しに関する情報に
アクセスできます。


```java
class Tools {
    @Tool
    String getWeather(String city, InvocationContext context) {
        UUID invocationId = context.invocationId();
        String aiServiceInterfaceName = context.interfaceName();
        ...
    }
}
```

この場合、LLM はこれらのパラメータを認識しません。
それらは LangChain4j とユーザーコードにのみ表示されます。

### `@ToolMemoryId`

AI Service メソッドに `@MemoryId` アノテーションが付いたパラメータがある場合、
`@Tool` メソッドのパラメータにも `@ToolMemoryId` アノテーションを付けることができます：
```java
interface Assistant{
    String chat(@UserMessage String userMessage, @MemoryId memoryId);
}

class Tools {
    @Tool
    String addCalendarEvent(CalendarEvent event, @ToolMemoryId memoryId) {
        ...
    }
}

String answer = assistant.chat("Tomorrow I will have a meeting with Klaus at 14:00", "12345");
```

AI Service メソッドに提供された値は、自動的に `@Tool` メソッドへ渡されます。
複数のユーザーがいる場合や、ユーザーごとに複数のチャット/メモリがある場合に、
`@Tool` メソッド内でそれらを区別したい場合に、この機能は役立ちます。

### ツールの並行実行

デフォルトでは、LLM が一度に**_複数の_**ツールを呼び出す場合（並列ツール呼び出しとも呼ばれます）、
AI Service はそれらを順次実行します。ツールを並行して実行したい場合は、
AI Service の構築時に `executeToolsConcurrently()` または `executeToolsConcurrently(Executor)` を呼び出します。
これらのオプションのいずれかを有効にすると、ツールは並行して実行され（1つの例外があります——下記参照）、
デフォルトまたは指定された `Executor` が使用されます。

#### `ChatModel` を使用する場合：

- LLM が複数のツールを呼び出すと、それらは `Executor` を使用して別々のスレッドで並行実行されます。
- LLM が単一のツールを呼び出す場合、それは同じ（呼び出し元）スレッドで実行され、
リソースの無駄を避けるために `Executor` は**_使用されません_**。

#### `StreamingChatModel` を使用する場合：

- LLM が複数のツールを呼び出すと、それらは `Executor` を使用して別々のスレッドで並行実行されます。
各ツールは、`StreamingChatResponseHandler.onCompleteToolCall(CompleteToolCall)` が呼び出された時点で
直ちに実行され、他のツールやレスポンスのストリーミング出力の完了を待つことはありません。
- LLM が単一のツールを呼び出す場合、それは `Executor` を使用して別々のスレッドで実行されます。
この時点では LLM がいくつのツールを呼び出すかまだ不明なため、
同じスレッド内で実行することはできません。

### 実行済みツールへのアクセス
AI Service の呼び出し中に実行されたツールにアクセスしたい場合は、
戻り値の型を `Result` クラスでラップするだけで簡単に実現できます。
```java
interface Assistant {

    Result<String> chat(String userMessage);
}

Result<String> result = assistant.chat("Cancel my booking 123-456");

String answer = result.content();
List<ToolExecution> toolExecutions = result.toolExecutions();

ToolExecution toolExecution = toolExecutions.get(0);
ToolExecutionRequest request = toolExecution.request();
String result = toolExecution.result(); // tool execution result as text
List<Content> resultContents = toolExecution.resultContents(); // tool execution result as content list (may include images)
Object resultObject = toolExecution.resultObject(); // actual value returned by the tool
```

ストリーミングモードでは、`onToolExecuted` コールバックを指定することで実現できます。
```java
interface Assistant {

    TokenStream chat(String message);
}

TokenStream tokenStream = assistant.chat("Cancel my booking");

tokenStream
    .onToolExecuted((ToolExecution toolExecution) -> System.out.println(toolExecution))
    .onPartialResponse(...)
    .onCompleteResponse(...)
    .onError(...)
    .start();
```

### プログラムによるツールの指定

AI Services を使用する際、ツールをプログラム的に指定することもできます。
この方法は、ツールをデータベースや設定ファイルなどの外部ソースから読み込むことができるため、非常に柔軟性が高くなります。

ツール名、説明、パラメータ名と説明は、
すべて `ToolSpecification` を通じて設定できます。

```java
ToolSpecification toolSpecification = ToolSpecification.builder()
        .name("get_booking_details")
        .description("Returns booking details")
        .parameters(JsonObjectSchema.builder()
                .properties(Map.of(
                        "bookingNumber", JsonStringSchema.builder()
                                .description("Booking number in B-12345 format")
                                .build()
                ))
                .build())
        .build();
```

各 `ToolSpecification` には、LLM が生成したツール実行リクエストを処理するための `ToolExecutor` 実装を提供する必要があります。

```java
ToolExecutor toolExecutor = (toolExecutionRequest, memoryId) -> {
    Map<String, Object> arguments = fromJson(toolExecutionRequest.arguments());
    String bookingNumber = arguments.get("bookingNumber").toString();
    Booking booking = getBooking(bookingNumber);
    return booking.toString();
};
```

LangChain4j は `DefaultToolExecutor` も提供しており、Java オブジェクト上のメソッドを自動的に呼び出し、パラメータのマッピングを処理できます。

```java
class BookingTools {
    String getBookingDetails(String bookingNumber) {
        Booking booking = loadBookingFromDatabase(bookingNumber);
        return booking.toString();
    }
}

BookingTools tools = new BookingTools();
Method method = BookingTools.class.getMethod("getBookingDetails", String.class);
ToolExecutor toolExecutor = new DefaultToolExecutor(tools, method);
```

ToolSpecificationとToolExecutorのペアが1つ以上できたら、
各ペアを`AiServiceTool`でラップし、そのリストをAIサービスに渡します：
```java
AiServiceTool tool = AiServiceTool.builder()
        .toolSpecification(toolSpecification)
        .toolExecutor(toolExecutor)
        .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .tools(List.of(tool))
    .build();
```

#### プログラムツールの即時リターンを設定する

ツールに
[即時リターン動作](/tutorials/tools#returning-immediately-the-result-of-a-tool-execution-request)
を指定する必要がある場合は、`AiServiceTool` ビルダーでその `ReturnBehavior` を設定します。

```java
AiServiceTool bookingTool = AiServiceTool.builder()
        .toolSpecification(bookingToolSpec)
        .toolExecutor(bookingExecutor)
        .returnBehavior(IMMEDIATE)
        .build();

AiServiceTool closeTool = AiServiceTool.builder()
        .toolSpecification(closeToolSpec)
        .toolExecutor(closeExecutor)
        .returnBehavior(IMMEDIATE_IF_LAST)
        .build();

AiServiceTool weatherTool = AiServiceTool.builder()
        .toolSpecification(weatherToolSpec)
        .toolExecutor(weatherExecutor)
        // ReturnBehavior.TO_LLM by default
        .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .tools(List.of(bookingTool, closeTool, weatherTool))
    .build();
```

### 動的にツールを指定する

AI サービスを使用する際、呼び出しごとにツールを動的に指定することもできます。
`ToolProvider` を設定すると、AI サービスを呼び出すたびにそれが呼び出され、
現在 LLM に送信するリクエストに含めるべきツールが提供されます。
`ToolProvider` は `ToolProviderRequest`
（`UserMessage`、チャットメモリ ID、[`InvocationParameters`](/tutorials/tools#invocationparameters) を含む）を受け取り、
現在の AI サービス呼び出しのツールを含む `ToolProviderResult` を返します。

以下は、ユーザーメッセージに「booking」という単語が含まれる場合にのみ `get_booking_details` ツールを追加する例です。
```java
ToolProvider toolProvider = (toolProviderRequest) -> {
    if (toolProviderRequest.userMessage().singleText().contains("booking")) {
        ToolSpecification toolSpecification = ToolSpecification.builder()
            .name("get_booking_details")
            .description("Returns booking details")
            .parameters(JsonObjectSchema.builder()
                .addStringProperty("bookingNumber")
                .build())
            .build();
        return ToolProviderResult.builder()
            .add(toolSpecification, toolExecutor)
            .build();
    } else {
        return null;
    }
};

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .toolProvider(toolProvider)
    .build();
```

同一AIサービス呼び出し内で、静的に指定されたツール（`@Tool`アノテーションが付与されたメソッドとプログラム的に設定されたツールの両方）と、動的に指定されたツールを混在させることが可能です。
この場合、すべての静的ツールと動的ツールがマージされます。

#### 動的ツールの即時返却の設定

`ToolProviderResult`を構築する際、`ToolProviderResult.builder()`を使用してツールを
[即時返却](/tutorials/tools#returning-immediately-the-result-of-a-tool-execution-request)
としてマークできます。`add(ToolSpecification, ToolExecutor, ReturnBehavior)`オーバーロードは、
`TO_LLM`、`IMMEDIATE`、`IMMEDIATE_IF_LAST`のいずれかを受け入れます：


```java
ToolProvider toolProvider = (toolProviderRequest) -> {
    return ToolProviderResult.builder()
        .add(bookingToolSpec, bookingExecutor, ReturnBehavior.IMMEDIATE)
        .add(closeToolSpec, closeExecutor, ReturnBehavior.IMMEDIATE_IF_LAST)
        .add(weatherToolSpec, weatherExecutor) // ReturnBehavior.TO_LLM by default
        .build();
};
```

### ツール検索

多数のツールを扱う場合、
すべてのツールを毎回のリクエストで送信すると、トークン使用量が大幅に増加し、モデルのパフォーマンスが低下する可能性があります。
この問題に対処するため、LangChain4j はツール検索メカニズムを提供しています。

これにより、ツールを事前に公開するのではなく、LLM 自身が動的にツールを発見できるようになります。

核となるアイデアはシンプルです：
- 最初に、LLM には 1 つ以上の特別なツール検索ツールが公開されます
- LLM はこれらのツールを呼び出して、関連するツールを検索できます
- 関連するツールが見つかると、それらは後続の LLM へのリクエストに含まれます

これにより、スケーラブルでトークン効率が高く、モデル駆動型のツール発見が可能になります。

#### ツール検索の仕組み

ツール検索フローは通常、次のようになります：

1. 初期リクエスト：
   - LLM にはツール検索ツールのみが表示されます（完全なツールセットは表示されません）
2. ツール検索
   - LLM がツール検索ツールを呼び出し、必要なツールの種類を説明します
   - ツール検索ストラテジーが、利用可能なツールに対してリクエストを照合します
4. ツールの公開
   - 一致したツールが次の LLM へのリクエストに追加されます
5. ツールの実行
   - LLM は見つかったツールを通常どおり呼び出すことができます

以前に見つかったツールは、複数のツール検索呼び出しにわたって蓄積されます。
LLM がツール検索ツールを呼び出すたびに、
新しく一致したツールが、LLM に表示される既存のツールセットに追加されます（置き換えではなくマージされます）。
つまり、LLM に表示されるツールのリストは時間の経過とともに増加する可能性があります。
見つかったツールは、対応する `ToolExecutionResultMessage` が
`ChatMemory` から削除されるまで、そして少なくとも AI サービス呼び出しの終了までは、LLM に表示されたままになります。

`ChatMemory` が設定されていない場合、見つかったツールは
AI サービス呼び出しの終了時までのみ LLM に表示されたままになります。

#### ToolSearchStrategy

ツール検索は `ToolSearchStrategy` インターフェースを介して実装されます：
```java
@Experimental
public interface ToolSearchStrategy {

    List<ToolSpecification> getToolSearchTools(InvocationContext invocationContext);

    ToolSearchResult search(ToolSearchRequest toolSearchRequest);
}
```

`ToolSearchStrategy` は以下を担当します：
- ツール検索ツールを LLM に公開する
- LLM が生成したツール検索リクエストを実行する
- 一致したツール名を返し、その後解析されて公開される

LangChain4j は現在、すぐに使える実装を2つ提供しています：
- `SimpleToolSearchStrategy` – キーワードベースのマッチング
- `VectorToolSearchStrategy` – 埋め込みを使用したセマンティック検索

詳細はこれらのクラスの Javadoc を参照してください。

カスタム戦略を実装することもできます。

#### AI Services でのツール検索の設定

ツール検索は AI Service レベルで設定されます：

```java
Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .chatMemory(chatMemory)
    .tools(tools) // tool search works for static tools
    .toolProvider(mcpToolProvider) // tool search works for tools provided dynamically (e.g., MCP)
    .toolSearchStrategy(new SimpleToolSearchStrategy())
    .build();
```

設定が完了すると：
- LLM はすべてのツールを事前に閲覧できなくなります
- ツールの発見は、明示的でモデル駆動型のステップになります
- 特に大規模なツールセットの場合、トークン使用量が削減されます

#### ツール検索を使用するタイミング

ツール検索は、以下の状況で特に役立ちます：
- 多数のツール（数十個または数百個）がある場合
- ツールがドメイン固有または使用頻度が低い場合
- ツールの利用可能性がコンテキスト、ユーザー、または権限に依存する場合
- LLM に長いリストから推測させるのではなく、必要なツールを推論させたい場合

ツールが少数しかない場合、またはすべてのツールが常に関連する場合は、
通常のアプローチの方が簡単な場合があります。

#### 常時表示のツール

ツール検索を有効にすると、ツールは通常、ツール検索呼び出しで発見されるまで LLM から隠されます。
ただし、特定のツールを LLM に常に表示したい場合があります。

典型的なユースケース：
- 常にアクセス可能であるべきコアツール
- 検索オーバーヘッドが不要な頻繁に使用されるツール
- ユーティリティツール

LangChain4j は、`ALWAYS_VISIBLE` ツール検索動作を通じてこれをサポートします。

##### 仕組み

ツールが `ALWAYS_VISIBLE` とマークされると：
- 最初のリクエストで LLM に公開されます
- ツール検索による発見は不要です
- AI サービス呼び出し全体を通じて表示されたままになります
- 検索可能なツール候補には含まれません

他のすべてのツールは、通常のツール検索フローに従い続けます。

##### `@Tool` アノテーションの使用

`@Tool` アノテーションを使用して、ツールを常時表示としてマークできます：
```java
@Tool(searchBehavior = ALWAYS_VISIBLE)
String getWeather(String city) {
    return weatherService.getWeather(city);
}
```

##### `McpToolProvider` の使用

MCP ツール（`McpToolProvider` 経由）を使用する場合、`alwaysVisibleToolNames` で常に表示されるツールを設定できます：

```java
McpToolProvider.builder()
    .mcpClients(mcpClient)
    .alwaysVisibleToolNames("getWeather")
    .build();
```

##### `ToolSpecification` の使用

ツールをプログラムで設定する場合、`metadata` を使用してそれらを常に表示するようにマークできます：
```java
ToolSpecification toolSpecification = ToolSpecification.builder()
    .name("getWeather")
    .parameters(JsonObjectSchema.builder()
        .addStringProperty("city")
        .required("city")
        .build())
    .metadata(Map.of(ToolSpecification.METADATA_SEARCH_BEHAVIOR, SearchBehavior.ALWAYS_VISIBLE))
    .build();
```

#### 注意点と制限事項

:::note
ツール検索は、LLMがいつどのようにツールを検索すべきかを理解する能力に依存しています。
この機能の効果は、選択したモデルに大きく依存します。
:::

:::note

ツール検索は現在実験的な機能として位置付けられており、将来のリリースで変更される可能性があります。
:::

### ツール実行リクエストの結果を即座に返す

デフォルトでは、ツール実行リクエストの結果はLLMに送り返され、LLMはその結果を使用してさらに再処理を行います。しかし、状況によっては、そのツール実行リクエストによって生成された結果が、すでにAIサービスの呼び出しの期待される結果を表している場合があります。このような場合、ツールがその結果を即座に直接返すように構成し、LLMによる無駄でリソースを消費する再処理をスキップすることが可能です。これは、次の例のように`@Tool`アノテーションの`returnBehavior`フィールドを構成することで実現できます：






```java
class CalculatorWithImmediateReturn {
    
    @Tool(returnBehavior = ReturnBehavior.IMMEDIATE)
    double add(int a, int b) {
        return a + b;
    }
}
```

このように、以下に示す `Assistant` サービスは、

```java
interface Assistant {
    Result<String> chat(String userMessage);
}
```

上記の `CalculatorWithImmediateReturn` ツールを使用するように設定する

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(model)
        .tools(new CalculatorWithImmediateReturn())
        .build();
```

ツール呼び出しから直接応答を返します。例えば、以下の方法でアシスタントにプロンプトを送ります。

```java
Result<String> result = assistant.chat("How much is 37 plus 87?");
```

`Result` が生成され、その `Result.content() == null` となり、
実際の応答 `124` は `result.toolExecutions()` から取得する必要があります。

即時返却がない場合、LLM は `add` ツール実行要求の結果を再処理する必要があり、
`37 と 87 を足すと 124 になります。` のような応答を返すことになります。

#### 非 `Result` の AI Service メソッド戻り値型

AI Service メソッドのシグネチャが `Result` 型を返さない場合、即時ツール呼び出しが存在する際に、
チャットメソッド呼び出しは成功する場合も失敗する場合もあり、その規則は以下の通りです：

* AI Service メソッドの戻り値型が void の場合、リクエストは成功します。

* 非即時ツール呼び出しが存在する場合、リクエストは `IllegalConfigurationException` で失敗します。
* すべてのツール実行結果が null（または void）であり、戻り値型がプリミティブ型でない場合、リクエストは成功し、戻り値は `null` になります。
* 非 null のツール実行結果がちょうど 1 つあり、その結果が戻り値型に解決可能な場合、リクエストは成功し、そのツール結果を返します。

* 非 null のツール実行結果が複数ある場合、リクエストは `IllegalConfigurationException` で失敗します。
* ツール実行結果が 1 つあり、それが戻り値型に解決できない場合、リクエストは `IllegalConfigurationException` で失敗します。

#### 単一応答内の複数ツール呼び出しにおける即時返却ルール

LLM が単一の応答で複数のツール呼び出しを返す場合、
ループは以下の**2 つ**の条件が両方とも満たされた場合にのみ即時返却されます（結果を LLM に送り返さない）：

1. **ツールエラーがないこと。** いずれかのツール呼び出しでエラーが発生すると、LLM が次のラウンドでエラーに反応できるよう、強制的に再処理されます。
2. 応答内のツールが**すべて** `IMMEDIATE` である（`TO_LLM` ツールが混在していない）**か**、最後のツールが `IMMEDIATE_IF_LAST` である（次のセクションを参照）こと。

例（ツールは LLM が単一の応答で返した順にリストされています。
`(err)` は実行中にエラーが発生したツールを示します）：

| 応答内のツール呼び出し                     | 結果            | 理由                                                          |
|------------------------------------------------|--------------------|--------------------------------------------------------------|
| `[IMMEDIATE]`                                  | 即時返却 | 唯一のツールが `IMMEDIATE` である                                     |
| `[IMMEDIATE, IMMEDIATE]`                       | 即時返却 | すべてのツールが `IMMEDIATE`/`IMMEDIATE_IF_LAST` である                |
| `[IMMEDIATE, TO_LLM]`                          | 再処理          | `TO_LLM` によりすべての即時ルールが無効になる                 |
| `[IMMEDIATE_IF_LAST]`                          | 即時返却 | 最後のツールが `IMMEDIATE_IF_LAST` である                             |
| `[TO_LLM, IMMEDIATE_IF_LAST]`                  | 即時返却 | 最後のツールが `IMMEDIATE_IF_LAST` である                             |
| `[IMMEDIATE_IF_LAST, TO_LLM]`                  | 再処理          | 最後ではない、かつ `TO_LLM` によりすべての即時ルールが無効になる   |
| `[IMMEDIATE, IMMEDIATE_IF_LAST]`               | 即時返却 | 最後のツールが `IMMEDIATE_IF_LAST` である                             |
| `[IMMEDIATE_IF_LAST, IMMEDIATE]`               | 即時返却 | すべてのツールが `IMMEDIATE`/`IMMEDIATE_IF_LAST` である                |
| `[TO_LLM, IMMEDIATE_IF_LAST, IMMEDIATE]`       | 再処理          | 最後ではない、かつ `TO_LLM` によりすべての即時ルールが無効になる   |
| `[IMMEDIATE_IF_LAST(err)]`                     | 再処理          | いずれかのエラーにより即時返却が無効になる                          |
| `[TO_LLM(err), IMMEDIATE_IF_LAST]`             | 再処理          | いずれかのエラーにより即時返却が無効になる                          |

即時返却と再処理の完全なマトリックスは `ReturnBehavior` の Javadoc を参照してください。

#### 操作シーケンスを明示的に終了するツールのための `IMMEDIATE_IF_LAST`

`ReturnBehavior.IMMEDIATE_IF_LAST` は、LLM が多段階操作の終了を明示的に示すために使用するツールに適しています。例えば、LLM が一連のクリックやナビゲーションなどの後に追加する
`endExecutionAndGetFinalResult` ツールなどです。

`IMMEDIATE_IF_LAST` がない場合、LLM は通常、実行を終了するために 2 ラウンド必要です：
1 ラウンド目は作業ツール（`TO_LLM`）と終了ツールを混在させ、
2 ラウンド目は LLM がすべての結果を確認した後に終了ツールを単独で呼び出します。ループが即時返却されるのはこの 2 ラウンド目のみです。

`IMMEDIATE_IF_LAST` を使用すると、LLM がそのツールを応答の最後に配置する限り、
ループは即時返却されます——呼び出しごとに LLM のラウンドトリップを 1 回丸ごと節約できます。
```java
class ScreenAutomation {

    @Tool
    String leftMouseClick(int x, int y) { /* ... */ }

    @Tool
    String typeText(String text) { /* ... */ }

    @Tool(returnBehavior = ReturnBehavior.IMMEDIATE_IF_LAST)
    String endExecutionAndGetFinalResult(String summary) { return summary; }
}
```

LLM の応答 `[leftMouseClick, typeText, endExecutionAndGetFinalResult]` の場合、
ループは3つのツールすべてを実行した直後に戻ります。
LLM が終了ツールを最後以外の位置に置いた場合
（例: `[endExecutionAndGetFinalResult, leftMouseClick]`）、
ループは継続し、すべての結果を LLM に送り返します。

`IMMEDIATE_IF_LAST` は、`IMMEDIATE` のすべての即時ルールも継承します:
`IMMEDIATE` および/または `IMMEDIATE_IF_LAST` ツールのみで構成される応答は、
どれが最後にあるかに関係なく即座に戻ります（エラーなしルールの制約は依然として適用されます）。

`IMMEDIATE` と同様に、`IMMEDIATE_IF_LAST` は戻り値の型が `Result<T>` の AI サービスのみで使用できます。

### エラー処理

#### ツール名エラーの処理

LLM はツール呼び出しに関して幻覚を起こす可能性があります。
言い換えると、存在しない名前のツールを要求する可能性があります。
この場合、デフォルトでは LangChain4j は問題を報告する例外をスローしますが、
AI サービスに対して、この状況で使用する異なる戦略を設定することができます。

この戦略は `Function<ToolExecutionRequest, ToolExecutionResultMessage>` の実装であり、
利用できないツールを呼び出すリクエストを含む `ToolExecutionRequest` に対して、
どの `ToolExecutionResultMessage` を結果として生成すべきかを定義します。例えば、AI サービスに、
以前要求されたツールが存在しないため、異なるツール呼び出しを再試行するよう LLM に促すことを目的とした応答を返す戦略を設定できます。以下の例のとおりです。
```java
AssistantHallucinatedTool assistant = AiServices.builder(AssistantHallucinatedTool.class)
        .chatModel(chatModel)
        .tools(new HelloWorld())
        .hallucinatedToolNameStrategy(toolExecutionRequest -> ToolExecutionResultMessage.from(
                toolExecutionRequest, "Error: there is no tool called " + toolExecutionRequest.name()))
        .build();
```

#### ツール引数エラーの処理

デフォルトでは、ツール引数に問題がある場合（例：LLMが無効なJSONを生成した、必須パラメータを省略したなど）、AIサービスはツールを実行できず、例外で失敗します。

:::caution 推奨：引数エラーをLLMにフィードバックする

現在のデフォルト（例外をスローする）は、通常望ましい動作ではありません。
引数エラーは通常LLMに起因するものであり、LLMは明確なエラーメッセージを与えれば、一般的に自己修正が可能です。
エラーテキストを返す`ToolArgumentsErrorHandler`を設定し、LLMが修正された引数で再試行できるようにしてください。

LangChain4j 2.0では、この動作をデフォルトに変更することを計画しています。この変更予定がお客様のユースケースに影響を与える場合は、[issueを開いて](https://github.com/langchain4j/langchain4j/issues)、変更が確定する前にフィードバックをお聞かせください。
:::

この動作は、AIサービスに`ToolArgumentsErrorHandler`を設定することでカスタマイズできます：





```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(tools)
        .toolArgumentsErrorHandler((error, errorContext) -> ...)
        .build();
```

現在、`ToolArgumentsErrorHandler` 内にはエラーを処理する2つの方法があります：

- LLM に送り返すテキストメッセージ（例：エラーの説明）を返し、
  それに適切に対応させる（例：エラーを修正して再試行する）。
- 例外をスローする：これにより AI サービスのフローが停止します。

**推奨（LLM に再試行させる）：**

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(tools)
        .toolArgumentsErrorHandler((error, errorContext) -> ToolErrorHandlerResult.text(error.getMessage()))
        .build();
```

**厳格モード（いずれかのパラメータエラーでフローを停止）：**

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(tools)
        .toolArgumentsErrorHandler((error, errorContext) -> { throw MyCustomException(error); })
        .build();

try {
    assistant.chat(...);
} catch (MyCustomException e) {
    // handle e
}
```

##### 生の例外へのアクセス

ツールが別の例外をラップした例外をスローする場合（例：`SecurityException` をラップする `ToolGuardrailException`）、
LangChain4j は `getCause()` を使用して内部の原因を抽出し、それを `error` パラメータとして渡します。
`errorContext.rawError()` を使用して、最初にスローされた外部例外にアクセスします——これは
ラッパーの型（原因ではなく）がエラーの処理方法を決定する場合に役立ちます。

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(tools)
        .toolArgumentsErrorHandler((error, errorContext) -> {
            if (errorContext.rawError() instanceof MyCriticalException) {
                throw (MyCriticalException) errorContext.rawError();
            }
            return ToolErrorHandlerResult.text(error.getMessage());
        })
        .build();
```

#### ツール実行エラーの処理

デフォルトでは、`@Tool` アノテーションが付与されたメソッドが `Exception` をスローした場合、
その `Exception` のメッセージ（`e.getMessage()`）がツール実行の結果として LLM に送信されます。
これにより、LLM は必要に応じて自身の誤りを修正し、再試行することができます。

:::warning 推奨事項: 本番環境では生の例外メッセージを LLM に送信しないでください
現在のデフォルトでは、生の例外メッセージが LLM に送信されます。本番環境では、これにより内部アプリケーションデータが漏洩する可能性があります：スタックトレース、ファイルパス、エラー文字列に埋め込まれた認証情報、ダウンストリーム API の応答、エラーメッセージに含まれる PII などです。

LLM に取り込まれると、このコンテンツは応答、チャット履歴、可観測性パイプライン、および LLM プロバイダーのログに流れ込む可能性があります。

汎用メッセージまたは精査・サニタイズされた障害の説明を返す `ToolExecutionErrorHandler` を設定し、根本的な詳細についてはログと可観測性イベントに依存してください。

LangChain4j 2.0 では、デフォルトを「例外をスローして AI サービスの呼び出しを中止する」に変更する予定です。この変更がお客様のユースケースに影響を与える場合は、変更が適用される前にフィードバックをお聞かせいただくため、[issue を開いて](https://github.com/langchain4j/langchain4j/issues)ください。
:::

AI サービスで `ToolExecutionErrorHandler` を設定することで、この動作をカスタマイズできます：







```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(tools)
        .toolExecutionErrorHandler((error, errorContext) -> ToolErrorHandlerResult.text("Tool execution failed."))
        .build();
```

`ToolArgumentsErrorHandler`と同様に、`ToolExecutionErrorHandler`でエラーを処理する方法は2つあります：
テキストメッセージを返すか、例外をスローするかです。エラーの処理方法を決定する際に、原因のアンラップ前に`errorContext.rawError()`を使用して生のエラーを検査できます。

### 補償ツールアクション

AIサービスがタスクを達成するために複数のツールを使用する場合、1つのツールの失敗によりシステムが不整合な状態になる可能性があります — 一部のツールはすでに正常に実行された一方で、他のツールは実行されていない状態です。例えば、銀行振込では、LLMが受取人の口座に先に入金し、その後、送金元の口座から残高不足で引き落としに失敗すると、受取人に余分なお金が残ることになります。

これを処理するには、**ツールエラー時の補償**を有効にできます。有効にすると、ツールの実行が失敗した場合、補償アクションを宣言している以前に成功したすべてのツール呼び出しが、逆順で自動的に取り消されます。

#### `@CompensateFor`による補償アクションの宣言

メソッドに`@CompensateFor`アノテーションを使用して、`@Tool`の補償アクションとして宣言します。`value`は、LLMに公開されるツール名と一致する必要があります — `@Tool(name = ...)`属性が設定されている場合はその値、それ以外の場合は`@Tool`メソッド名（デフォルトでツール名として使用）です。
補償メソッドは、ツールと同じパラメータ型を持つか、単一の`ToolExecution`パラメータを受け入れる必要があります。

**オプション1：同じパラメータ型** — 補償メソッドは、元のツールに渡されたものと同じ引数を受け取ります：













```java
class BankAccountService {

    @Tool("credits money to a bank account")
    void credit(String name, double amount) {
        accounts.merge(name, amount, Double::sum);
    }

    @CompensateFor("credit")
    void uncredit(String name, double amount) {
        accounts.merge(name, -amount, Double::sum);
    }

    @Tool("withdraws money from a bank account")
    void withdraw(String name, double amount) {
        if (accounts.getOrDefault(name, 0.0) < amount) {
            throw new RuntimeException("Insufficient funds");
        }
        accounts.merge(name, -amount, Double::sum);
    }

    @CompensateFor("withdraw")
    void unwithdraw(String name, double amount) {
        accounts.merge(name, amount, Double::sum);
    }
}
```

**オプション 2：`ToolExecution` パラメータ** — 補償メソッドは完全な
`ToolExecution` を受け取り、元のパラメータとツールの
**戻り値**にアクセスできます。元の実行で生成された情報（例：トランザクション ID）が取り消し操作に必要な場合に役立ちます：


```java
class BankAccountService {

    @Tool("credits money to a bank account")
    String credit(String name, double amount) {
        accounts.merge(name, amount, Double::sum);
        return createTransactionRecord(name, amount); // e.g. "TX-42"
    }

    @CompensateFor("credit")
    void uncredit(ToolExecution toolExecution) {
        String transactionId = toolExecution.result(); // "TX-42"
        reverseTransaction(transactionId);
    }
}
```

#### 補償の有効化

AI Service を構築する際に `.compensateOnToolErrors(true)` を呼び出します：

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(model)
        .tools(new BankAccountService())
        .compensateOnToolErrors(true)
        .build();
```

この設定により、LLM が `credit("Dmytro", 100)` を呼び出し、その後
失敗する `withdraw("Mario", 100)` を呼び出した場合、フレームワークは自動的に
`uncredit("Dmytro", 100)` を呼び出してクレジットを取り消します。フレームワークは例外をスローせず、
各ツールに対して LLM に情報提供用の結果メッセージを送信します：
ロールバックされたツールには _"Tool 'credit' was executed successfully but
was rolled back due to failure of tool 'withdraw'"_ のようなメッセージが送信され、失敗したツールには
通常のエラーメッセージが送信されます。これにより `ChatMemory` の一貫性が保たれ、LLM が
次に何をするか（再試行、ユーザーへの通知、または別のアプローチ）を決定できるようになります。

`.compensateOnToolErrors(true)` がない場合、`@CompensateFor` アノテーションが存在しても
エラーは通常どおり LLM に送信され、補償は行われません。

#### 検証

`.compensateOnToolErrors(true)` を有効にすると、各 `@CompensateFor` が検証されます：
- 参照されるツールは（名前によって）同じオブジェクト上に存在する必要があります。
- 補償メソッドはツールと完全に同じパラメータ型を持つか、
  単一の `ToolExecution` パラメータを受け入れる必要があります。

いずれかのチェックが失敗すると、`IllegalConfigurationException` が即座にスローされるため、
設定ミスは実行時ではなく起動時に捕捉されます。
`.compensateOnToolErrors(true)` が有効でない場合、`@CompensateFor` アノテーションは
静かに無視され、検証は実行されません。

#### 注意事項と制限

:::note
補償はベストエフォートです：補償操作自体が例外をスローした場合、それは
WARN レベルで記録され、残りの補償操作は実行を継続します。
:::

:::note

`@CompensateFor` メソッドは LLM に公開されません。これらは内部の補償
インフラストラクチャであり、ツール仕様には表示されません。
:::

:::note
補償操作は、ツール実行が `.executeToolsConcurrently()` によって並行実行されるように
設定されている場合でも、常に逆順で順次実行されます。
:::

:::note
`@CompensateFor` メソッドは、`@Tool` メソッドの検出方法と同様に、
スーパークラスから継承できます。
:::

:::note

`@CompensateFor` は `@Tool` アノテーションが付いたメソッドにのみ適用されます。プログラムによる定義や
動的定義のツール（MCP ツール、`ToolSpecification` 経由で登録されたツールなど）は
サポートされていません。
:::

:::note
補償ツール操作は現在実験的としてマークされており、将来のバージョンで進化する可能性があります。
:::

## モデルコンテキストプロトコル（MCP）

[MCP サーバーからツールをインポート](https://modelcontextprotocol.io/docs/concepts/tools)することもできます。
詳細については、[こちら](/tutorials/mcp/#creating-an-mcp-tool-provider)を参照してください。

## 関連チュートリアル

- [Tools の素晴らしいガイド](https://www.youtube.com/watch?v=cjI_6Siry-s)
  著者：[Tales from the jar side (Ken Kousen)](https://www.youtube.com/@talesfromthejarside)

## 例

- [ツールを使用した例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithToolsExample.java)
- [動的ツールを使用した例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithDynamicToolsExample.java)
