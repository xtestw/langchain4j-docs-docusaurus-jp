---
sidebar_position: 7
---

# ツール（関数呼び出し）

一部のLLMは、テキスト生成に加えて、アクションをトリガーすることもできます。

:::note
ツールをサポートするすべてのLLMは[こちら](/integrations/language-models)で確認できます（「ツール」列を参照）。
:::

:::note
すべてのLLMが同じようにツールをサポートしているわけではありません。
ツールを理解し、選択し、正しく使用する能力は、特定のモデルとその機能に大きく依存します。
一部のモデルはツールをまったくサポートしていない場合もあれば、慎重なプロンプトエンジニアリングや
追加のシステム指示が必要な場合もあります。
:::

「ツール」または「関数呼び出し」と呼ばれる概念があります。
これにより、LLMは必要に応じて、通常は開発者によって定義された1つまたは複数の利用可能なツールを呼び出すことができます。
ツールは何でも構いません：ウェブ検索、外部APIの呼び出し、特定のコードの実行など。
LLMは実際にツール自体を呼び出すことはできません。代わりに、（プレーンテキストで応答する代わりに）
特定のツールを呼び出す意図を応答で表現します。
開発者である私たちは、提供された引数でこのツールを実行し、ツール実行の結果を報告する必要があります。

例えば、LLM自体は数学が得意ではないことが知られています。
ユースケースに時々数学計算が含まれる場合、LLMに「数学ツール」を提供したいかもしれません。
LLMへのリクエストで1つまたは複数のツールを宣言することで、
適切だと判断した場合、それらのうちの1つを呼び出すことを決定できます。
数学の質問と一連の数学ツールが与えられた場合、LLMは質問に適切に答えるために、
まず提供された数学ツールの1つを呼び出すべきだと判断するかもしれません。

これが実際にどのように機能するか見てみましょう（ツールありとなし）：

ツールなしのメッセージ交換の例：
```
リクエスト：
- メッセージ：
    - UserMessage：
        - テキスト：475695037565の平方根は何ですか？

レスポンス：
- AiMessage：
    - テキスト：475695037565の平方根は約689710です。
```
近いですが、正確ではありません。

以下のツールを使用したメッセージ交換の例：
```java
@Tool("2つの数値を合計します")
double sum(double a, double b) {
    return a + b;
}

@Tool("与えられた数値の平方根を返します")
double squareRoot(double x) {
    return Math.sqrt(x);
}
```

```
リクエスト1：
- メッセージ：
    - UserMessage：
        - テキスト：475695037565の平方根は何ですか？
- ツール：
    - sum(double a, double b)：2つの数値を合計します
    - squareRoot(double x)：与えられた数値の平方根を返します

レスポンス1：
- AiMessage：
    - toolExecutionRequests：
        - squareRoot(475695037565)


... ここで「475695037565」引数でsquareRootメソッドを実行し、結果として「689706.486532」を取得します ...


リクエスト2：
- メッセージ：
    - UserMessage：
        - テキスト：475695037565の平方根は何ですか？
    - AiMessage：
        - toolExecutionRequests：
            - squareRoot(475695037565)
    - ToolExecutionResultMessage：
        - テキスト：689706.486532

レスポンス2：
- AiMessage：
    - テキスト：475695037565の平方根は689706.486532です。
```

ご覧のように、LLMがツールにアクセスできる場合、適切なときにそれらの1つを呼び出すことを決定できます。

これは非常に強力な機能です。
この単純な例では、LLMに基本的な数学ツールを与えましたが、
例えば、`googleSearch`と`sendEmail`ツールを与え、
「友人がAI分野の最新ニュースを知りたがっています。friend@email.comに短い要約を送ってください」というクエリを与えた場合、
`googleSearch`ツールを使用して最新ニュースを見つけ、
それを要約して`sendEmail`ツールを使用してメールで要約を送信することができます。

:::note
LLMが正しいツールを正しい引数で呼び出す可能性を高めるために、
明確で曖昧さのない以下の情報を提供する必要があります：
- ツールの名前
- ツールの機能と使用すべき状況の説明
- 各ツールパラメータの説明

良い経験則：人間がツールの目的と使用方法を理解できれば、
LLMも理解できる可能性が高いです。
:::

LLMはツールを呼び出すタイミングと方法を検出するために特別に微調整されています。
一部のモデルは複数のツールを一度に呼び出すこともできます。例えば、
[OpenAI](https://platform.openai.com/docs/guides/function-calling/parallel-function-calling)。

:::note
すべてのモデルがツールをサポートしているわけではないことに注意してください。
どのモデルがツールをサポートしているかを確認するには、[こちら](https://docs.langchain4j.dev/integrations/language-models/)のページの「ツール」列を参照してください。
:::

:::note
ツール/関数呼び出しは[JSONモード](/tutorials/ai-services#json-mode)と同じではないことに注意してください。
:::

# 2つの抽象化レベル

LangChain4jはツールを使用するための2つの抽象化レベルを提供しています：
- 低レベル：`ChatModel`と`ToolSpecification` APIを使用
- 高レベル：[AIサービス](/tutorials/ai-services)と`@Tool`アノテーション付きJavaメソッドを使用

## 低レベルツールAPI

低レベルでは、`ChatModel`の`chat(ChatRequest)`メソッドを使用できます。
同様のメソッドは`StreamingChatModel`にも存在します。

`ChatRequest`を作成する際に1つ以上の`ToolSpecification`を指定できます。

`ToolSpecification`はツールに関するすべての情報を含むオブジェクトです：
- ツールの`name`
- ツールの`description`
- ツールの`parameters`とその説明

ツールについてできるだけ多くの情報を提供することをお勧めします：
明確な名前、包括的な説明、各パラメータの説明など。

`ToolSpecification`を作成するには2つの方法があります：

1. 手動で
```java
ToolSpecification toolSpecification = ToolSpecification.builder()
    .name("getWeather")
    .description("指定された都市の天気予報を返します")
    .parameters(JsonObjectSchema.builder()
        .addStringProperty("city", "天気予報を取得する都市")
        .addEnumProperty("temperatureUnit", List.of("CELSIUS", "FAHRENHEIT"))
        .required("city") // 必須プロパティは明示的に指定する必要があります
        .build())
    .build();
```

`JsonObjectSchema`の詳細については[こちら](/tutorials/structured-outputs#jsonobjectschema)をご覧ください。

2. ヘルパーメソッドを使用：
- `ToolSpecifications.toolSpecificationsFrom(Class)`
- `ToolSpecifications.toolSpecificationsFrom(Object)`
- `ToolSpecifications.toolSpecificationFrom(Method)`

```java
class WeatherTools { 
  
    @Tool("指定された都市の天気予報を返します")
    String getWeather(
            @P("天気予報を取得する都市") String city,
            TemperatureUnit temperatureUnit
    ) {
        ...
    }
}

List<ToolSpecification> toolSpecifications = ToolSpecifications.toolSpecificationsFrom(WeatherTools.class);
```

`List<ToolSpecification>`を取得したら、モデルを呼び出すことができます：
```java
ChatRequest request = ChatRequest.builder()
    .messages(UserMessage.from("明日のロンドンの天気はどうなりますか？"))
    .toolSpecifications(toolSpecifications)
    .build();
ChatResponse response = model.chat(request);
AiMessage aiMessage = response.aiMessage();
```

LLMがツールを呼び出すことを決定した場合、返された`AiMessage`は`toolExecutionRequests`フィールドにデータを含みます。
この場合、`AiMessage.hasToolExecutionRequests()`は`true`を返します。
LLMによっては、1つまたは複数の`ToolExecutionRequest`オブジェクトを含むことがあります
（一部のLLMは複数のツールを並列で呼び出すことをサポートしています）。

各`ToolExecutionRequest`には以下が含まれるはずです：
- ツール呼び出しの`id`（一部のLLMはこれを提供しません）
- 呼び出すツールの`name`、例：`getWeather`
- `arguments`、例：`{ "city": "London", "temperatureUnit": "CELSIUS" }`

`ToolExecutionRequest`からの情報を使用して、ツールを手動で実行する必要があります。

ツール実行の結果をLLMに送り返したい場合は、
`ToolExecutionResultMessage`を作成し（各`ToolExecutionRequest`に対して1つ）、
以前のすべてのメッセージと一緒に送信する必要があります：
```java

String result = "明日はロンドンで雨が予想されます。";
ToolExecutionResultMessage toolExecutionResultMessage = ToolExecutionResultMessage.from(toolExecutionRequest, result);
ChatRequest request2 = ChatRequest.builder()
        .messages(List.of(userMessage, aiMessage, toolExecutionResultMessage))
        .toolSpecifications(toolSpecifications)
        .build();
ChatResponse response2 = model.chat(request2);
```

## 高レベルツールAPI
高レベルの抽象化では、任意のJavaメソッドに`@Tool`アノテーションを付け、
[AIサービス](/tutorials/ai-services#tools-function-calling)を作成する際に指定できます。

AIサービスは自動的にそのようなメソッドを`ToolSpecification`に変換し、
LLMとの各対話のリクエストに含めます。
LLMがツールを呼び出すことを決定すると、AIサービスは自動的に適切なメソッドを実行し、
メソッドの戻り値（もしあれば）がLLMに送り返されます。
実装の詳細は`DefaultToolExecutor`で確認できます。

いくつかのツールの例：
```java
@Tool("関連URLをGoogleで検索します")
public List<String> searchGoogle(@P("検索クエリ") String query) {
    return googleSearchService.search(query);
}

@Tool("指定されたURLのウェブページの内容を返します")
public String getWebPageContent(@P("ページのURL") String url) {
    Document jsoupDocument = Jsoup.connect(url).get();
    return jsoupDocument.body().text();
}
```

### ツールメソッドの制限
`@Tool`アノテーションが付いたメソッド：
- staticまたは非staticのいずれでも可能
- 任意の可視性（public、privateなど）を持つことができます。

### ツールメソッドのパラメータ
`@Tool`アノテーションが付いたメソッドは、様々な型の任意の数のパラメータを受け入れることができます：
- プリミティブ型：`int`、`double`など
- オブジェクト型：`String`、`Integer`、`Double`など
- カスタムPOJO（ネストされたPOJOを含むことができます）
- `enum`
- `List<T>`/`Set<T>`（`T`は上記の型のいずれか）
- `Map<K,V>`（`K`と`V`の型を`@P`でパラメータ説明に手動で指定する必要があります）

パラメータのないメソッドもサポートされています。

#### 必須とオプション

デフォルトでは、すべてのツールメソッドパラメータは**_必須_**と見なされます。
これは、LLMがそのようなパラメータの値を生成する必要があることを意味します。
パラメータは`@P(required = false)`でアノテーションを付けることでオプションにできます：
```java
@Tool
void getTemperature(String location, @P(required = false) Unit unit) {
    ...
}
```

複雑なパラメータのフィールドとサブフィールドもデフォルトでは**_必須_**と見なされます。
`@JsonProperty(required = false)`でアノテーションを付けることでフィールドをオプションにできます：
```java
record User(String name, @JsonProperty(required = false) String email) {}

@Tool
void add(User user) {
    ...
}
```

:::note
[構造化出力](/tutorials/structured-outputs)で使用する場合、すべてのフィールドとサブフィールドはデフォルトで**_オプション_**と見なされることに注意してください。
:::

再帰的なパラメータ（例：`Person`クラスが`Set<Person> children`フィールドを持つ場合）
は現在OpenAIでのみサポートされています。

### ツールメソッドの戻り値の型
`@Tool`アノテーションが付いたメソッドは、`void`を含む任意の型を返すことができます。
メソッドの戻り値の型が`void`の場合、メソッドが正常に戻ると「Success」という文字列がLLMに送信されます。

メソッドの戻り値の型が`String`の場合、返された値は変換なしにそのままLLMに送信されます。

その他の戻り値の型については、返された値はLLMに送信される前にJSON文字列に変換されます。

### 例外処理
`@Tool`アノテーションが付いたメソッドが`Exception`をスローする場合、
`Exception`のメッセージ（`e.getMessage()`）がツール実行の結果としてLLMに送信されます。
これにより、LLMは必要と判断した場合、ミスを修正して再試行することができます。

### `@Tool`
`@Tool`でアノテーションが付けられた任意のJavaメソッドで、
AIサービスのビルド時に_明示的に_指定されたものはLLMによって実行できます：
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

String answer = mathGenius.ask("475695037565の平方根は何ですか？");

System.out.println(answer); // 475695037565の平方根は689706.486532です。
```

`ask`メソッドが呼び出されると、前のセクションで説明したように、LLMとの2つの対話が発生します。
それらの対話の間に、`squareRoot`メソッドが自動的に呼び出されます。

`@Tool`アノテーションには2つのオプションフィールドがあります：
- `name`：ツールの名前。これが提供されない場合、メソッドの名前がツールの名前として使用されます。
- `value`：ツールの説明。

ツールによっては、LLMは説明がなくてもそれをよく理解するかもしれません
（例えば、`add(a, b)`は明白です）、
しかし通常は明確で意味のある名前と説明を提供する方が良いです。
このようにして、LLMは与えられたツールを呼び出すかどうか、そしてどのように呼び出すかを決定するためのより多くの情報を持ちます。

### `@P`
メソッドパラメータはオプションで`@P`でアノテーションを付けることができます。

`@P`アノテーションには2つのフィールドがあります
- `value`：パラメータの説明。必須フィールド。
- `required`：パラメータが必須かどうか、デフォルトは`true`。オプションフィールド。

### `@Description`
クラスとフィールドの説明は`@Description`アノテーションを使用して指定できます：

```java
@Description("実行するクエリ")
class Query {

  @Description("選択するフィールド")
  private List<String> select;

  @Description("フィルタリングする条件")
  private List<Condition> where;
}

@Tool
Result executeQuery(Query query) {
  ...
}
```

:::note
`enum`値に配置された`@Description`は**_効果がなく_**、生成されたJSONスキーマに**_含まれない_**ことに注意してください：
```java
enum Priority {

    @Description("決済ゲートウェイの障害やセキュリティ侵害などの重大な問題。") // これは無視されます
    CRITICAL,
    
    @Description("主要な機能の不具合や広範囲にわたる停止などの高優先度の問題。") // これは無視されます
    HIGH,
    
    @Description("軽微なバグや見た目の問題などの低優先度の問題。") // これは無視されます
    LOW
}
```
:::

### `@ToolMemoryId`
AIサービスメソッドに`@MemoryId`でアノテーションが付いたパラメータがある場合、
`@Tool`メソッドのパラメータにも`@ToolMemoryId`でアノテーションを付けることができます。
AIサービスメソッドに提供された値は自動的に`@Tool`メソッドに渡されます。
この機能は、複数のユーザーや1ユーザーあたり複数のチャット/メモリがあり、
`@Tool`メソッド内でそれらを区別したい場合に役立ちます。

### 実行されたツールへのアクセス
AIサービスの呼び出し中に実行されたツールにアクセスしたい場合、
戻り値の型を`Result`クラスでラップすることで簡単に行えます：
```java
interface Assistant {

    Result<String> chat(String userMessage);
}

Result<String> result = assistant.chat("予約123-456をキャンセルしてください");

String answer = result.content();
List<ToolExecution> toolExecutions = result.toolExecutions();
```

ストリーミングモードでは、`onToolExecuted`コールバックを指定することでアクセスできます：
```java
interface Assistant {

    TokenStream chat(String message);
}

TokenStream tokenStream = assistant.chat("予約をキャンセルしてください");

tokenStream
    .onToolExecuted((ToolExecution toolExecution) -> System.out.println(toolExecution))
    .onPartialResponse(...)
    .onCompleteResponse(...)
    .onError(...)
    .start();
```

### プログラムによるツールの指定

AIサービスを使用する場合、ツールをプログラムで指定することもできます。
このアプローチは、ツールをデータベースや設定ファイルなどの外部ソースから
ロードできるため、多くの柔軟性を提供します。

ツール名、説明、パラメータ名、説明はすべて`ToolSpecification`を使用して設定できます：
```java
ToolSpecification toolSpecification = ToolSpecification.builder()
        .name("get_booking_details")
        .description("予約の詳細を返します")
        .parameters(JsonObjectSchema.builder()
                .properties(Map.of(
                        "bookingNumber", JsonStringSchema.builder()
                                .description("B-12345形式の予約番号")
                                .build()
                ))
                .build())
        .build();
```

各`ToolSpecification`に対して、LLMによって生成されたツール実行リクエストを
処理する`ToolExecutor`実装を提供する必要があります：
```java
ToolExecutor toolExecutor = (toolExecutionRequest, memoryId) -> {
    Map<String, Object> arguments = fromJson(toolExecutionRequest.arguments());
    String bookingNumber = arguments.get("bookingNumber").toString();
    Booking booking = getBooking(bookingNumber);
    return booking.toString();
};
```

1つまたは複数の（`ToolSpecification`、`ToolExecutor`）ペアを取得したら、
AIサービスを作成する際にそれらを指定できます：
```java
Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .tools(Map.of(toolSpecification, toolExecutor))
    .build();
```

### 動的なツールの指定

AIサービスを使用する場合、ツールを各呼び出しごとに動的に指定することもできます。
AIサービスが呼び出されるたびに呼び出され、現在のLLMへのリクエストに含めるべきツールを
提供する`ToolProvider`を設定できます。
`ToolProvider`は`UserMessage`とチャットメモリIDを含む`ToolProviderRequest`を受け取り、
`ToolSpecification`から`ToolExecutor`へのマップ形式のツールを含む`ToolProviderResult`を返します。

ユーザーのメッセージに「booking」という単語が含まれる場合にのみ`get_booking_details`ツールを追加する例：
```java
ToolProvider toolProvider = (toolProviderRequest) -> {
    if (toolProviderRequest.userMessage().singleText().contains("booking")) {
        ToolSpecification toolSpecification = ToolSpecification.builder()
            .name("get_booking_details")
            .description("予約の詳細を返します")
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

AIサービスは同じ呼び出しでプログラムによって指定されたツールと動的に指定されたツールの両方を使用することが可能です。

### ツール幻覚戦略

LLMがツール呼び出しで幻覚を起こす、つまり存在しない名前のツールを使用するよう要求することがあるかもしれません。この場合、デフォルトではLangChain4jは問題を報告する例外をスローしますが、この状況で使用する戦略を提供することで異なる動作を設定することが可能です。

この戦略は、利用できないツールを呼び出すリクエストを含む`ToolExecutionRequest`に対して生成すべき`ToolExecutionResultMessage`を定義する`Function<ToolExecutionRequest, ToolExecutionResultMessage>`の実装です。例えば、以前に要求されたツールが存在しないことを知り、異なるツール呼び出しを再試行するようLLMを促す応答を返す戦略でAIサービスを設定することが可能です：

```java
AssistantHallucinatedTool assistant = AiServices.builder(AssistantHallucinatedTool.class)
        .chatModel(chatModel)
        .tools(new HelloWorld())
        .hallucinatedToolNameStrategy(toolExecutionRequest -> ToolExecutionResultMessage.from(
                toolExecutionRequest, "エラー：" + toolExecutionRequest.name() + "というツールはありません"))
        .build();
```

## モデルコンテキストプロトコル（MCP）

[MCPサーバーからツールをインポート](https://modelcontextprotocol.io/docs/concepts/tools)することもできます。
これに関する詳細は[こちら](/tutorials/mcp/#creating-an-mcp-tool-provider)で確認できます。

## 関連チュートリアル

- [ツールに関する優れたガイド](https://www.youtube.com/watch?v=cjI_6Siry-s)
  by [Tales from the jar side (Ken Kousen)](https://www.youtube.com/@talesfromthejarside)

## 例

- [ツールを使用した例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithToolsExample.java)
- [動的ツールを使用した例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithDynamicToolsExample.java)
