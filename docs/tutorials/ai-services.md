---
sidebar_position: 6
---

# AIサービス

ここまでは、`ChatModel`、`ChatMessage`、`ChatMemory` などの低レベルコンポーネントを扱ってきました。
このレベルで作業すると非常に柔軟で完全な自由度が得られますが、同時に大量のボイラープレートコードを書かざるを得なくなります。
LLM 駆動のアプリケーションでは、通常、単一のコンポーネントだけでなく、複数のコンポーネントが連携して動作する必要があり
（例：プロンプトテンプレート、チャットメモリ、LLM、出力パーサー、RAG コンポーネント：埋め込みモデルとストア）、
さらに複数のやり取りを伴うことが多いため、それらすべてをオーケストレーションするのはさらに煩雑になります。

私たちは、低レベルの実装詳細ではなく、ビジネスロジックに集中してほしいと考えています。
そのため、LangChain4j には現在、それを支援する 2 つの高レベル概念があります：AIサービスとチェーンです。

## チェーン（レガシー）

チェーンの概念は、Python 版 LangChain（LCEL 導入前）に由来します。
アイデアは、チャットボットや RAG など、一般的なユースケースごとに `Chain` を持つことです。
チェーンは複数の低レベルコンポーネントを組み合わせ、それらの間のやり取りをオーケストレーションします。
主な問題は、何かをカスタマイズする必要がある場合に硬直的すぎることです。
LangChain4j では現在、2 つのチェーン（`ConversationalChain` と `ConversationalRetrievalChain`）のみが実装されており、
現時点ではこれ以上追加する予定はありません。

## AIサービス

私たちは、Java 向けに調整された別のソリューションとして、AIサービスを提案します。
アイデアは、LLM やその他のコンポーネントとのやり取りの複雑さを、シンプルな API の背後に隠すことです。

このアプローチは Spring Data JPA や Retrofit に非常に似ています：望ましい API を持つインターフェースを宣言的に定義すると、
LangChain4j がそのインターフェースを実装するオブジェクト（プロキシ）を提供します。
AIサービスは、アプリケーションのサービス層のコンポーネントと考えることができます。
それは *AI* サービスを提供します。これが名前の由来です。

AIサービスは最も一般的な操作を処理します：
- LLM 向けの入力のフォーマット
- LLM からの出力の解析

また、より高度な機能もサポートします：
- チャットメモリ
- ツール
- RAG

AIサービスは、やり取りを往復させるステートフルなチャットボットの構築にも、
各 LLM 呼び出しが独立しているプロセスの自動化にも使用できます。

まずは、可能な限りシンプルな AIサービスを見てみましょう。その後、より複雑な例を探ります。

## 最もシンプルな AIサービス

まず、入力として `String` を受け取り、`String` を返す単一のメソッド `chat` を持つインターフェースを定義します。
```java
interface Assistant {

    String chat(String userMessage);
}
```

次に、低レベルコンポーネントを作成します。これらのコンポーネントは AIサービスの裏側で使用されます。
この場合、必要なのは `ChatModel` だけです：
```java
ChatModel model = OpenAiChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();
```

最後に、`AiServices` クラスを使って AIサービスのインスタンスを作成できます：
```java
Assistant assistant = AiServices.create(Assistant.class, model);
```
:::note
[Quarkus](https://docs.quarkiverse.io/quarkus-langchain4j/dev/ai-services.html)
および [Spring Boot](/tutorials/spring-boot-integration#spring-boot-starter-for-declarative-ai-services) アプリケーションでは、
オートコンフィギュレーションが `Assistant` Bean の作成を処理します。
つまり、`AiServices.create(...)` を呼び出す必要はなく、必要な場所で `Assistant` を注入/オートワイヤするだけで済みます。
:::

これで `Assistant` を使用できます：
```java
String answer = assistant.chat("Hello");
System.out.println(answer); // Hello, how can I help you?
```

## どのように動作するのか？

インターフェースの `Class` を低レベルコンポーネントとともに `AiServices` に渡すと、
`AiServices` はこのインターフェースを実装するプロキシオブジェクトを作成します。
現在はリフレクションを使用していますが、代替手段も検討しています。
このプロキシオブジェクトが、入力と出力のすべての変換を処理します。
この場合、入力は単一の `String` ですが、使用している `ChatModel` は入力として `ChatMessage` を受け取ります。
そのため、`AiService` は自動的にそれを `UserMessage` に変換し、`ChatModel` を呼び出します。
`chat` メソッドの出力型が `String` であるため、`ChatModel` が `AiMessage` を返した後、
`chat` メソッドから返される前に `String` に変換されます。

## Quarkus アプリケーションにおける AIサービス
[LangChain4j Quarkus 拡張](https://docs.quarkiverse.io/quarkus-langchain4j/dev/index.html)
は、Quarkus アプリケーションでの AIサービスの利用を大幅に簡素化します。

詳細は[こちら](https://docs.quarkiverse.io/quarkus-langchain4j/dev/ai-services.html)をご覧ください。

## Spring Boot アプリケーションにおける AIサービス
[LangChain4j Spring Boot starter](/tutorials/spring-boot-integration/#spring-boot-starter-for-declarative-ai-services)
は、Spring Boot アプリケーションでの AIサービスの利用を大幅に簡素化します。

## @SystemMessage

では、より複雑な例を見てみましょう。
LLM にスラングで返信させるように強制します 😉

これは通常、`SystemMessage` に指示を与えることで実現します。

```java
interface Friend {

    @SystemMessage("You are a good friend of mine. Answer using slang.")
    String chat(String userMessage);
}

Friend friend = AiServices.create(Friend.class, model);

String answer = friend.chat("Hello"); // Hey! What's up?
```

この例では、使用したいシステムプロンプトテンプレート付きの `@SystemMessage` アノテーションを追加しました。
これは裏側で `SystemMessage` に変換され、`UserMessage` とともに LLM に送信されます。

`@SystemMessage` はリソースからプロンプトテンプレートを読み込むこともできます：
`@SystemMessage(fromResource = "my-prompt-template.txt")`

### システムメッセージプロバイダー
システムメッセージは、システムメッセージプロバイダーを使って動的に定義することもできます：
```java
Friend friend = AiServices.builder(Friend.class)
    .chatModel(model)
    .systemMessageProvider(chatMemoryId -> "You are a good friend of mine. Answer using slang.")
    .build();
```
ご覧のとおり、チャットメモリ ID（ユーザーまたは会話）に基づいて異なるシステムメッセージを提供できます。

### システムメッセージトランスフォーマー

システムメッセージトランスフォーマーを使うと、毎回の呼び出しでシステムメッセージを動的に変更できます。
タイミングは、`@SystemMessage` または `systemMessageProvider` から解決された後、
[`chatRequestTransformer`](#programmatic-chatrequest-rewriting) が実行される前です。
システムメッセージがどのように設定されたかに関係なく、内容を追加または前置する必要がある場合に便利です。

```java
Friend friend = AiServices.builder(Friend.class)
    .chatModel(model)
    .systemMessageProvider(chatMemoryId -> "You are a good friend of mine. Answer using slang.")
    .systemMessageTransformer(systemMessage -> systemMessage + " Today's date is " + LocalDate.now() + ".")
    .build();
```

システムメッセージが設定されていない場合、トランスフォーマーは `null` を受け取ります。

呼び出しコンテキスト（例：メソッド名やその引数）にもアクセスする必要がある場合は、
`InvocationContext` を受け取る 2 引数のオーバーロードを使用してください：

```java
Friend friend = AiServices.builder(Friend.class)
    .chatModel(model)
    .systemMessageProvider(chatMemoryId -> "You are a good friend of mine. Answer using slang.")
    .systemMessageTransformer((systemMessage, context) ->
            systemMessage + " Tenant: " + context.invocationParameters().get("tenant") + ".")
    .build();
```

## @UserMessage

では、使用しているモデルがシステムメッセージをサポートしていない、
あるいはその目的で `UserMessage` を使いたいと仮定しましょう。
```java
interface Friend {

    @UserMessage("You are a good friend of mine. Answer using slang. {{it}}")
    String chat(String userMessage);
}

Friend friend = AiServices.create(Friend.class, model);

String answer = friend.chat("Hello"); // Hey! What's shakin'?
```
`@SystemMessage` アノテーションを `@UserMessage` に置き換え、
唯一のメソッド引数を参照する変数 `it` を含むプロンプトテンプレートを指定しました。

`String userMessage` に `@V` を付けて、
プロンプトテンプレート変数にカスタム名を割り当てることも可能です：
```java
interface Friend {

    @UserMessage("You are a good friend of mine. Answer using slang. {{message}}")
    String chat(@V("message") String userMessage);
}
```

:::note
Quarkus または Spring Boot と一緒に LangChain4j を使用する場合、`@V` は必要ないことに注意してください。
このアノテーションは、Java コンパイル時に `-parameters` オプションが *有効でない* 場合にのみ必要です。
:::

`@UserMessage` もリソースからプロンプトテンプレートを読み込めます：
`@UserMessage(fromResource = "my-prompt-template.txt")`

## プログラムによる ChatRequest の書き換え

状況によっては、`ChatRequest` を LLM に送信する前に変更すると便利な場合があります。たとえば、ユーザーメッセージに追加のコンテキストを付け加えたり、外部条件に基づいてシステムメッセージを変更したりする必要があるかもしれません。

変換を適用する `UnaryOperator<ChatRequest>` を実装し、それを使って AIサービスを設定することで可能です：

```java
Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .chatRequestTransformer(transformingFunction)  // Configures the transformation function to be applied to the ChatRequest
    .build();
```

必要な `ChatRequest` 変換を実装するために `ChatMemory` にもアクセスする必要がある場合は、`chatRequestTransformer` メソッドを `BiFunction<ChatRequest, Object, ChatRequest>` で設定することもできます。この関数に渡される第 2 引数はメモリ ID です。

## ChatRequestParameters

もう一つの自由度は、呼び出しごとにパラメータ（例：temperature、toolsChoice、最大トークン数など）を設定できることです。たとえば、一部のリクエストをより「創造的」に（高い temperature）、他のリクエストをより決定論的に（低い temperature）したい場合があります。

これを実現するには、`ChatRequestParameters` 型（または `OpenAiChatRequestParameters` のようなプロバイダー固有の型）の引数も受け取る AIサービスメソッドを作成します。これにより、LangChain4j は各呼び出し時にこれらのパラメータを受け入れてマージします。

:::note
`ChatRequestParameters` で指定された `toolSpecifications` と `responseFormat` は、AIサービスによって生成されたものを上書きすることに注意してください。
:::

第 2 引数付きでインターフェースを定義します：

```java
interface AssistantWithChatParams {

    String chat(@UserMessage String userMessage, ChatRequestParameters params);
}
```

AIサービスを構築します：

java
```java
AssistantWithChatParams assistant = AiServices.builder(AssistantWithChatParams.class)
    .chatModel(openAiChatModel)  // or whichever model
    .build();
```

呼び出しごとの任意のパラメータで呼び出します：

```java
ChatRequestParameters customParams = ChatRequestParameters.builder()
    .temperature(0.85)
    .build();

String answer = assistant.chat("Hi there!", customParams);
```

AIサービスメソッドの引数として渡された `ChatRequestParameters` は、前のセクションで説明した `chatRequestTransformer` にも伝播されるため、必要に応じてそこでアクセスおよび変更することもできます。

## 有効な AIサービスメソッドの例

以下は、有効な AIサービスメソッドの例です。

<details>
<summary>`UserMessage`</summary>

```java
String chat(String userMessage);

String chat(@UserMessage String userMessage);

String chat(@UserMessage String userMessage, ChatRequestParameters parameters);

String chat(@UserMessage String userMessage, @V("country") String country); // userMessage contains "{{country}}" template variable

String chat(@UserMessage String userMessage, @UserMessage Content content); // content can be one of: TextContent, ImageContent, AudioContent, VideoContent, PdfFileContent

String chat(@UserMessage String userMessage, @UserMessage ImageContent image); // second argument can be one of: TextContent, ImageContent, AudioContent, VideoContent, PdfFileContent

String chat(@UserMessage String userMessage, @UserMessage List<Content> contents);

String chat(@UserMessage String userMessage, @UserMessage List<ImageContent> images);

@UserMessage("What is the capital of Germany?")
String chat();

@UserMessage("What is the capital of {{it}}?")
String chat(String country);

@UserMessage("What is the capital of {{country}}?")
String chat(@V("country") String country);

@UserMessage("What is the {{something}} of {{country}}?")
String chat(@V("something") String something, @V("country") String country);

@UserMessage("What is the capital of {{country}}?")
String chat(String country); // this works only in Quarkus and Spring Boot applications
```
</details>

<details>
<summary>`SystemMessage` と `UserMessage`</summary>

```java
@SystemMessage("Given a name of a country, answer with a name of it's capital")
String chat(String userMessage);

@SystemMessage("Given a name of a country, answer with a name of it's capital")
String chat(@UserMessage String userMessage);

@SystemMessage("Given a name of a country, {{answerInstructions}}")
String chat(@V("answerInstructions") String answerInstructions, @UserMessage String userMessage);

@SystemMessage("Given a name of a country, answer with a name of it's capital")
String chat(@UserMessage String userMessage, @V("country") String country); // userMessage contains "{{country}}" template variable

@SystemMessage("Given a name of a country, {{answerInstructions}}")
String chat(@V("answerInstructions") String answerInstructions, @UserMessage String userMessage, @V("country") String country); // userMessage contains "{{country}}" template variable

@SystemMessage("Given a name of a country, answer with a name of it's capital")
@UserMessage("Germany")
String chat();

@SystemMessage("Given a name of a country, {{answerInstructions}}")
@UserMessage("Germany")
String chat(@V("answerInstructions") String answerInstructions);

@SystemMessage("Given a name of a country, answer with a name of it's capital")
@UserMessage("{{it}}")
String chat(String country);

@SystemMessage("Given a name of a country, answer with a name of it's capital")
@UserMessage("{{country}}")
String chat(@V("country") String country);

@SystemMessage("Given a name of a country, {{answerInstructions}}")
@UserMessage("{{country}}")
String chat(@V("answerInstructions") String answerInstructions, @V("country") String country);
```
</details>

## マルチモーダリティ

テキストコンテンツに加えて、またはテキストコンテンツの代わりに、
AIサービスメソッドは 1 つまたは複数の `Content` または `List<Content>` 引数を受け入れることができます：

```java
String chat(@UserMessage String userMessage, @UserMessage Content content);

String chat(@UserMessage String userMessage, @UserMessage ImageContent image);

String chat(@UserMessage String userMessage, @UserMessage ImageContent image, @UserMessage AudioContent audio);

String chat(@UserMessage String userMessage, @UserMessage List<Content> contents);

String chat(@UserMessage String userMessage, @UserMessage List<ImageContent> images);

String chat(Content content);

String chat(AudioContent content);

String chat(List<Content> contents);

String chat(List<AudioContent> contents);

String chat(@UserMessage Content content1, @UserMessage Content content2);

String chat(@UserMessage AudioContent audio, @UserMessage ImageContent image);
```

AIサービスは、パラメータ宣言の順序ですべてのコンテンツを最終的な `UserMessage` に入れます。

利用可能なコンテンツタイプの詳細については、[Content API](/tutorials/chat-and-language-models#multimodality)
を確認してください。


## 戻り値の型

AIサービスメソッドは、次の型のいずれかを返すことができます：
- `String` —— この場合、LLM が生成した出力は処理/解析なしで返されます
- [構造化出力](/tutorials/structured-outputs#supported-types) がサポートする任意の型 —— この場合、
AIサービスは返す前に LLM が生成した出力を望ましい型に解析します

任意の型はさらに `Result<T>` でラップして、AIサービス呼び出しに関する追加のメタデータを取得できます：
- `TokenUsage` —— AIサービス呼び出し中に使用されたトークンの合計数。AIサービスが
LLM に複数回呼び出しを行った場合（例：ツールが実行されたため）、すべての呼び出しのトークン使用量を合計します。
- ソース —— [RAG](/tutorials/ai-services#rag) 検索中に取得された `Content`
- AIサービス呼び出し中に実行されたすべての[ツール](/tutorials/ai-services#tools-function-calling)（リクエストと結果の両方）
- 最終チャット応答の `FinishReason`
- すべての中間 `ChatResponse`
- 最終的な `ChatResponse`

例：
```java
interface Assistant {
    
    @UserMessage("Generate an outline for the article on the following topic: {{it}}")
    Result<List<String>> generateOutlineFor(String topic);
}

Result<List<String>> result = assistant.generateOutlineFor("Java");

List<String> outline = result.content();
TokenUsage tokenUsage = result.tokenUsage();
List<Content> sources = result.sources();
List<ToolExecution> toolExecutions = result.toolExecutions();
FinishReason finishReason = result.finishReason();
```

## 構造化出力

LLM から構造化出力（例：`String` 内の非構造化テキストではなく、複雑な Java オブジェクト）を
受け取りたい場合は、
AIサービスメソッドの戻り値の型を `String` から別の型に変更できます。

:::note
構造化出力の詳細は[こちら](/tutorials/structured-outputs)をご覧ください。
:::

いくつかの例：

### 戻り値の型としての `boolean`

```java
interface SentimentAnalyzer {

    @UserMessage("Does {{it}} has a positive sentiment?")
    boolean isPositive(String text);

}

SentimentAnalyzer sentimentAnalyzer = AiServices.create(SentimentAnalyzer.class, model);

boolean positive = sentimentAnalyzer.isPositive("It's wonderful!");
// true
```

### 戻り値の型としての `Enum`
```java
enum Priority {
    CRITICAL, HIGH, LOW
}

interface PriorityAnalyzer {
    
    @UserMessage("Analyze the priority of the following issue: {{it}}")
    Priority analyzePriority(String issueDescription);
}

PriorityAnalyzer priorityAnalyzer = AiServices.create(PriorityAnalyzer.class, model);

Priority priority = priorityAnalyzer.analyzePriority("The main payment gateway is down, and customers cannot process transactions.");
// CRITICAL
```

### 戻り値の型としての POJO
```java
class Person {

    @Description("first name of a person") // you can add an optional description to help an LLM have a better understanding
    String firstName;
    String lastName;
    LocalDate birthDate;
    Address address;
}

@Description("an address") // you can add an optional description to help an LLM have a better understanding
class Address {
    String street;
    Integer streetNumber;
    String city;
}

interface PersonExtractor {

    @UserMessage("Extract information about a person from {{it}}")
    Person extractPersonFrom(String text);
}

PersonExtractor personExtractor = AiServices.create(PersonExtractor.class, model);

String text = """
            In 1968, amidst the fading echoes of Independence Day,
            a child named John arrived under the calm evening sky.
            This newborn, bearing the surname Doe, marked the start of a new journey.
            He was welcomed into the world at 345 Whispering Pines Avenue
            a quaint street nestled in the heart of Springfield
            an abode that echoed with the gentle hum of suburban dreams and aspirations.
            """;

Person person = personExtractor.extractPersonFrom(text);

System.out.println(person); // Person { firstName = "John", lastName = "Doe", birthDate = 1968-07-04, address = Address { ... } }
```

## JSON モード

カスタム POJO を抽出する場合（実際には JSON で、それが POJO に解析されます）、
モデル設定で「JSON モード」を有効にすることを推奨します。
こうすることで、LLM は有効な JSON で応答するよう強制されます。

:::note
JSON モードとツール/関数呼び出しは似た機能ですが、
API が異なり、用途も異なります。

JSON モードは、LLM からの応答を *常に* 構造化形式（有効な JSON）で必要とする場合に有用です。
また、通常は状態/メモリは不要で、LLM との各やり取りは他と独立しています。
たとえば、テキストから情報を抽出したい場合（そのテキストで言及された人物のリストなど）、
または自由形式の製品レビューを
`String productName`、`Sentiment sentiment`、`List<String> claimedProblems` などのフィールドを持つ構造化フォームに変換したい場合などです。

一方、ツール/関数は、LLM が何らかのアクションを実行できるべき場合に有用です
（例：データベースの検索、Web 検索、ユーザーの予約キャンセルなど）。
この場合、期待される JSON スキーマを持つツールのリストが LLM に提供され、
ユーザーのリクエストを満たすためにそれらを呼び出すかどうかを自律的に決定します。

以前は、構造化データ抽出に関数呼び出しがよく使われていましたが、
現在はより適した JSON モード機能があります。
:::

JSON モードを有効にする方法は次のとおりです：

- OpenAI の場合：
  - [構造化出力](https://openai.com/index/introducing-structured-outputs-in-the-api/)をサポートする新しいモデル（例：`gpt-4o-mini`、`gpt-4o-2024-08-06`）の場合：
    ```java
    OpenAiChatModel.builder()
        ...
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)
        .strictJsonSchema(true)
        .build();
    ```
    詳細は[こちら](/integrations/language-models/open-ai#structured-outputs)をご覧ください。
  - 古いモデル（例：gpt-3.5-turbo、gpt-4）の場合：
    ```java
    OpenAiChatModel.builder()
        ...
        .responseFormat("json_object")
        .build();
    ```

- Azure OpenAI の場合：
```java
AzureOpenAiChatModel.builder()
    ...
    .responseFormat(new ChatCompletionsJsonResponseFormat())
    .build();
```

- Vertex AI Gemini の場合：
```java
VertexAiGeminiChatModel.builder()
    ...
    .responseMimeType("application/json")
    .build();
```

または、Java クラスから明示的なスキーマを指定します：

```java
VertexAiGeminiChatModel.builder()
    ...
    .responseSchema(SchemaHelper.fromClass(Person.class))
    .build();
```

JSON スキーマから：

```java
VertexAiGeminiChatModel.builder()
    ...
    .responseSchema(Schema.builder()...build())
    .build();
```

- Google AI Gemini の場合：
```java
GoogleAiGeminiChatModel.builder()
    ...
    .responseFormat(ResponseFormat.JSON)
    .build();
```

または、Java クラスから明示的なスキーマを指定します：

```java
GoogleAiGeminiChatModel.builder()
    ...
    .responseFormat(ResponseFormat.builder()
        .type(JSON)
        .jsonSchema(JsonSchemas.jsonSchemaFrom(Person.class).get())
        .build())
    .build();
```

JSON スキーマから：

```java
GoogleAiGeminiChatModel.builder()
    ...
    .responseFormat(ResponseFormat.builder()
        .type(JSON)
        .jsonSchema(JsonSchema.builder()...build())
        .build())
    .build();
```

- Mistral AI の場合：
```java
MistralAiChatModel.builder()
    ...
    .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)
    .strictJsonSchema(true)
    .build();
```

- Ollama の場合：
```java
OllamaChatModel.builder()
    ...
    .responseFormat(JSON)
    .build();
```

- その他のモデルプロバイダーの場合：基盤となるモデルプロバイダーが JSON モードをサポートしていない場合、
プロンプトエンジニアリングが最善の策です。また、より決定論的にするために `temperature` を下げてみてください。

[その他の例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/OtherServiceExamples.java)


## ストリーミング

`TokenStream` 戻り値の型を使用すると、AIサービスは[トークンごとにレスポンスをストリーミング](/tutorials/response-streaming)できます：
```java

interface Assistant {

    TokenStream chat(String message);
}

StreamingChatModel model = OpenAiStreamingChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();

Assistant assistant = AiServices.create(Assistant.class, model);

TokenStream tokenStream = assistant.chat("Tell me a joke");

CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();

tokenStream
    .onPartialResponse((String partialResponse) -> System.out.println(partialResponse))
    .onPartialThinking((PartialThinking partialThinking) -> System.out.println(partialThinking))
    .onRetrieved((List<Content> contents) -> System.out.println(contents))
    .onIntermediateResponse((ChatResponse intermediateResponse) -> System.out.println(intermediateResponse))
     // This will be invoked every time a new partial tool call (usually containing a single token of the tool's arguments) is available.
    .onPartialToolCall((PartialToolCall partialToolCall) -> System.out.println(partialToolCall))
     // This will be invoked right before a tool is executed. BeforeToolExecution contains ToolExecutionRequest (e.g. tool name, tool arguments, etc.)
    .beforeToolExecution((BeforeToolExecution beforeToolExecution) -> System.out.println(beforeToolExecution))
     // This will be invoked right after a tool is executed. ToolExecution contains ToolExecutionRequest and tool execution result.
    .onToolExecuted((ToolExecution toolExecution) -> System.out.println(toolExecution))
     // This will be invoked for raw provider streaming events that are not already exposed via the typed callbacks above (e.g. server-tool lifecycle events). See the "Unmapped Raw Events" section of Response Streaming.
    .onUnmappedRawEvent((Object rawEvent) -> System.out.println(rawEvent))
    .onCompleteResponse((ChatResponse response) -> futureResponse.complete(response))
    .onError((Throwable error) -> futureResponse.completeExceptionally(error))
    .start();

futureResponse.join(); // Blocks the main thread until the streaming process (running in another thread) is complete
```

### ストリーミングのキャンセル

ストリーミングをキャンセルしたい場合は、次のコールバックのいずれかから行えます：
- `onPartialResponseWithContext(BiConsumer<PartialResponse, PartialResponseContext>)`
- `onPartialThinkingWithContext(BiConsumer<PartialThinking, PartialThinkingContext>)`

例：
```java
tokenStream
    .onPartialResponseWithContext((PartialResponse partialResponse, PartialResponseContext context) -> {
        process(partialResponse);
        if (shouldCancel()) {
            context.streamingHandle().cancel();
        }
    })
    .onCompleteResponse((ChatResponse response) -> futureResponse.complete(response))
    .onError((Throwable error) -> futureResponse.completeExceptionally(error))
    .start();
```

`StreamingHandle.cancel()` が呼び出されると、LangChain4j は接続を閉じてストリーミングを停止します。
`StreamingHandle.cancel()` が呼び出されると、`TokenStream` はそれ以上コールバックを受け取りません。

### Flux
`TokenStream` の代わりに `Flux<String>` を使用することもできます。
そのためには、`langchain4j-reactor` モジュールをインポートしてください：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-reactor</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```
```java
interface Assistant {

  Flux<String> chat(String message);
}
```

[ストリーミングの例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithStreamingExample.java)


## チャットメモリ

AIサービスは、以前のやり取りを「記憶」するために[チャットメモリ](/tutorials/chat-memory)を使用できます：
```java
Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
    .build();
```
このシナリオでは、AIサービスのすべての呼び出しに同じ `ChatMemory` インスタンスが使用されます。
ただし、複数のユーザーがいる場合、このアプローチは機能しません。
各ユーザーが個々の会話を維持するために、独自の `ChatMemory` インスタンスを必要とするためです。

この問題の解決策は、`ChatMemoryProvider` を使用することです：
```java

interface Assistant  {
    String chat(@MemoryId int memoryId, @UserMessage String message);
}

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(10))
    .build();

String answerToKlaus = assistant.chat(1, "Hello, my name is Klaus");
String answerToFrancine = assistant.chat(2, "Hello, my name is Francine");
```
このシナリオでは、各メモリ ID に対して `ChatMemoryProvider` から 2 つの異なる `ChatMemory` インスタンスが提供されます。

このように `ChatMemory` を使用する場合、メモリリークを避けるために、不要になった会話のメモリを削除することも重要です。AIサービスが内部で使用するチャットメモリにアクセスできるようにするには、それを定義するインターフェースが `ChatMemoryAccess` を拡張すれば十分です。
```java

interface Assistant extends ChatMemoryAccess {
    String chat(@MemoryId int memoryId, @UserMessage String message);
}
```
これにより、単一の会話の `ChatMemory` インスタンスにアクセスでき、会話が終了したときにそれを削除することも可能になります。

```java
String answerToKlaus = assistant.chat(1, "Hello, my name is Klaus");
String answerToFrancine = assistant.chat(2, "Hello, my name is Francine");

List<ChatMessage> messagesWithKlaus = assistant.getChatMemory(1).messages();
boolean chatMemoryWithFrancineEvicted = assistant.evictChatMemory(2);
```

:::note
AIサービスメソッドに `@MemoryId` でアノテーションされたパラメータがない場合、
`ChatMemoryProvider` の `memoryId` の値はデフォルトで文字列 `"default"` になることに注意してください。
:::

:::note
同じ `@MemoryId` に対して AIサービスを同時に呼び出すべきではないことに注意してください。
`ChatMemory` が破損する可能性があるためです。
現在、AIサービスは同じ `@MemoryId` に対する同時呼び出しを防ぐメカニズムを実装していません。
:::

- [単一の ChatMemory の例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithMemoryExample.java)
- [ユーザーごとの ChatMemory の例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithMemoryForEachUserExample.java)
- [単一の永続化 ChatMemory の例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithPersistentMemoryExample.java)
- [ユーザーごとの永続化 ChatMemory の例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithPersistentMemoryForEachUserExample.java)


## ツール（関数呼び出し）

AIサービスは、LLM が使用できるツールで設定できます：

```java

class Tools {
    
    @Tool
    int add(int a, int b) {
        return a + b;
    }

    @Tool
    int multiply(int a, int b) {
        return a * b;
    }
}

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .tools(new Tools())
    .build();

String answer = assistant.chat("What is 1+2 and 3*4?");
```
このシナリオでは、LLM は最終回答を提供する前に、`add(1, 2)` と `multiply(3, 4)` メソッドの実行を要求します。
LangChain4j はこれらのメソッドを自動的に実行します。

ツールの詳細は[こちら](/tutorials/tools#high-level-tool-api)をご覧ください。


## RAG

AIサービスは、[ナイーブ RAG](/tutorials/rag#naive-rag) を有効にするために `ContentRetriever` で設定できます：
```java

EmbeddingStore embeddingStore  = ...
EmbeddingModel embeddingModel = ...

ContentRetriever contentRetriever = new EmbeddingStoreContentRetriever(embeddingStore, embeddingModel);

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .contentRetriever(contentRetriever)
    .build();
```

`RetrievalAugmentor` を設定するとさらに柔軟性が高まり、
クエリ変換や再ランキングなどの[高度な RAG](/tutorials/rag#advanced-rag) 機能が可能になります：
```java
RetrievalAugmentor retrievalAugmentor = DefaultRetrievalAugmentor.builder()
        .queryTransformer(...)
        .queryRouter(...)
        .contentAggregator(...)
        .contentInjector(...)
        .executor(...)
        .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .retrievalAugmentor(retrievalAugmentor)
    .build();
```

### ツールとしての RAG

デフォルトでは、コンテンツ検索はすべてのユーザークエリに対して実行されます。
あるいは、検索をツールのような能力として扱い、モデルが追加のコンテキストが必要と判断したときだけ呼び出すこともできます。
このアプローチでは、検索は RAG パイプラインの一部であり続けますが条件付きで実行され、単純なクエリに対する不要な検索を避けられます。

これを実装するには、`ContentRetriever` を `@Tool` 内にカプセル化し、AiServices に登録します。これにより、LLM はツールの説明に基づいて検索をトリガーするかどうかを自律的に判断できます。

#### 1. 検索ツールの定義

`ContentRetriever` をラップするクラスを作成します。  
`@Tool` の説明は重要です。LLM にいつ検索を呼び出すかを伝えるためです。

```java
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.query.Query;

import java.util.stream.Collectors;

static class SearchTool {

    private final ContentRetriever contentRetriever;

    SearchTool(ContentRetriever contentRetriever) {
        this.contentRetriever = contentRetriever;
    }

    @Tool("Search for technical information about LangChain4j and RAG configurations")
    public String search(String query) {
        // This logic is only executed when the LLM determines retrieval is necessary
        return contentRetriever.retrieve(new Query(query)).stream()
                .map(content -> content.textSegment().text())
                .collect(Collectors.joining("\n\n"));
    }
}
```

#### 2. ツールを AiServices に登録

グローバルな RetrievalAugmentor を使う代わりに、検索ロジックをツールとして登録します。

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(model)
        .tools(new SearchTool(contentRetriever))
        .build();
```

#### 3. 期待される動作

LLM はツールの説明に対してユーザーの意図を評価し、検索を実行するかどうかを決定します。

**シナリオ A — 一般的な会話**

- **入力：**  
  `Hello, how are you today?`

- **動作：**  
  LLM はツールを呼び出さず、内部知識から直接応答します。


**シナリオ B — 技術的な質問**

- **入力：**  
  `How do I configure a ContentRetriever?`

- **動作：**  
  LLM は技術的な意図を識別し、`search()` を呼び出し、取得したドキュメントに基づいて応答を生成します。

このアプローチにより、検索はすべてのクエリの必須ステップではなく、ツールと同様の**オンデマンドな能力**として機能します。

RAG の詳細は[こちら](/tutorials/rag)をご覧ください。

その他の RAG の例は[こちら](https://github.com/langchain4j/langchain4j-examples/tree/main/rag-examples/src/main/java)で確認できます。


## 自動モデレーション

AIサービスは、コンテンツモデレーションを自動的に実行できます。不適切なコンテンツが検出されると、元の `Moderation` オブジェクトを含む `ModerationException` がスローされます。
このオブジェクトには、フラグが立てられた特定のテキストなど、フラグ付きコンテンツに関する情報が含まれます。

自動モデレーションは、AIサービスを構築する際に設定できます：

```java
Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .moderationModel(moderationModel)  // Configures moderation  model
    .build();
```


[例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithAutoModerationExample.java)

## 複数の AIサービスのチェーン
LLM 駆動アプリケーションのロジックが複雑になるほど、
ソフトウェア開発で一般的な慣行と同様に、それを小さな部分に分解することが重要になります。

たとえば、すべての可能なシナリオに対応するためにシステムプロンプトに大量の指示を詰め込むのは、
エラーを起こしやすく非効率です。指示が多すぎると、LLM は一部を見落とす可能性があります。
さらに、指示が提示される順序も重要であり、プロセスはさらに困難になります。

この原則は、ツール、RAG、および `temperature`、`maxTokens` などのモデルパラメータにも適用されます。

チャットボットは、常にすべてのツールを認識している必要はないでしょう。
たとえば、ユーザーが単にチャットボットに挨拶したり別れを告げたりするとき、
LLM に数十から数百のツールへのアクセスを与えるのはコストがかかり、時には危険です
（LLM 呼び出しに含まれる各ツールは大量のトークンを消費します）、
予期しない結果につながる可能性もあります（LLM はハルシネートしたり、意図しない入力でツールを呼び出すよう操作されたりする可能性があります）。

RAG について：同様に、LLM にいくつかのコンテキストを提供する必要がある場合もありますが、
常にそうとは限りません。追加コストが発生し（より多くのコンテキスト = より多くのトークン）、
応答時間が増加する（より多くのコンテキスト = より高いレイテンシ）ためです。

モデルパラメータについて：特定の状況では LLM に高い決定論性が必要な場合があり、
低い `temperature` を設定します。他の場合には、より高い `temperature` を選択する場合などがあります。

要点は、より小さくより具体的なコンポーネントの方が、開発・テスト・保守・理解が容易で安価だということです。

考慮すべきもう一つの側面は、2 つの極端なケースです：
- アプリケーションを高度に決定論的にし、
アプリケーションがフローを制御し、LLM はコンポーネントの 1 つにすぎないことを望みますか？
- それとも、LLM に完全な自律性を与え、アプリケーションを駆動させたいですか？

あるいは、状況に応じて両方の混合でしょうか？
アプリケーションをより小さく管理しやすい部分に分解すれば、これらすべてのオプションが可能です。

AIサービスは、通常の（決定論的な）ソフトウェアコンポーネントとして、またそれらと組み合わせて使用できます：
- ある AIサービスの後に別の AIサービスを呼び出すことができます（いわゆるチェーン）。
- 決定論的および LLM 駆動の `if`/`else` 文を使用できます（AIサービスは `boolean` を返せます）。
- 決定論的および LLM 駆動の `switch` 文を使用できます（AIサービスは `enum` を返せます）。
- 決定論的および LLM 駆動の `for`/`while` ループを使用できます（AIサービスは `int` およびその他の数値型を返せます）。
- ユニットテストで AIサービスをモックできます（インターフェースであるため）。
- 各 AIサービスを個別に統合テストできます。
- 各 AIサービスごとに最適なパラメータを個別に評価・発見できます。
- など

簡単な例を考えてみましょう。
私は自分の会社用のチャットボットを構築したいです。
ユーザーがチャットボットに挨拶した場合、
LLM に挨拶文を生成させるのではなく、事前定義された挨拶で応答させたいです。
ユーザーが質問した場合、会社の内部ナレッジベース（いわゆる RAG）を使って LLM に応答を生成させたいです。

このタスクを 2 つの独立した AIサービスに分解する方法は次のとおりです：
```java
interface GreetingExpert {

    @UserMessage("Is the following text a greeting? Text: {{it}}")
    boolean isGreeting(String text);
}

interface ChatBot {

    @SystemMessage("You are a polite chatbot of a company called Miles of Smiles.")
    String reply(String userMessage);
}

class MilesOfSmiles {

    private final GreetingExpert greetingExpert;
    private final ChatBot chatBot;
    
    ...
    
    public String handle(String userMessage) {
        if (greetingExpert.isGreeting(userMessage)) {
            return "Greetings from Miles of Smiles! How can I make your day better?";
        } else {
            return chatBot.reply(userMessage);
        }
    }
}

GreetingExpert greetingExpert = AiServices.create(GreetingExpert.class, llama2);

ChatBot chatBot = AiServices.builder(ChatBot.class)
    .chatModel(gpt4)
    .contentRetriever(milesOfSmilesContentRetriever)
    .build();

MilesOfSmiles milesOfSmiles = new MilesOfSmiles(greetingExpert, chatBot);

String greeting = milesOfSmiles.handle("Hello");
System.out.println(greeting); // Greetings from Miles of Smiles! How can I make your day better?

String answer = milesOfSmiles.handle("Which services do you provide?");
System.out.println(answer); // At Miles of Smiles, we provide a wide range of services ...
```

テキストが挨拶かどうかという単純なタスクにはより安価な Llama2 を使い、
より複雑なタスクにはコンテンツリトリーバー（RAG）付きのより高価な GPT-4 を使ったことに注目してください。

これは非常にシンプルでやや素朴な例ですが、アイデアを示せていることを願います。

これで、`GreetingExpert` と `ChatBot` の両方をモックし、`MilesOfSmiles` を単独でテストできます。
また、`GreetingExpert` と `ChatBot` を個別に統合テストできます。
それぞれを個別に評価し、各サブタスクに最適なパラメータを見つけたり、
長期的には各特定のサブタスク向けに小さな専門モデルをファインチューンしたりすることもできます。


## テスト

- [カスタマーサポートエージェントの統合テストの例](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/test/java/dev/langchain4j/example/CustomerSupportAgentIT.java)


## 関連チュートリアル
- [LangChain4j AiServices Tutorial](https://www.sivalabs.in/langchain4j-ai-services-tutorial/) by [Siva](https://www.sivalabs.in/)
