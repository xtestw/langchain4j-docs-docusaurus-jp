---
sidebar_position: 6
---

# AIサービス

これまで、`ChatModel`、`ChatMessage`、`ChatMemory`などの低レベルコンポーネントについて説明してきました。
このレベルで作業することは非常に柔軟で完全な自由を与えてくれますが、多くのボイラープレートコードを書く必要もあります。
LLM駆動のアプリケーションは通常、単一のコンポーネントだけでなく、複数のコンポーネントが連携して動作する必要があります
（例：プロンプトテンプレート、チャットメモリ、LLM、出力パーサー、RAGコンポーネント：埋め込みモデルとストア）。
また、多くの場合、複数の対話が含まれるため、それらすべてを調整することはさらに面倒になります。

私たちは、低レベルの実装の詳細ではなく、ビジネスロジックに集中してほしいと考えています。
そのため、現在LangChain4jには、それを支援する2つの高レベルな概念があります：AIサービスとチェーン。

## チェーン（レガシー）

チェーンの概念は、Python版LangChain（LCELの導入前）に由来します。
アイデアは、チャットボット、RAGなどの一般的なユースケースごとに`Chain`を持つことです。
チェーンは複数の低レベルコンポーネントを組み合わせ、それらの間の対話を調整します。
主な問題は、何かをカスタマイズする必要がある場合に柔軟性が低すぎることです。
LangChain4jには2つのチェーン（`ConversationalChain`と`ConversationalRetrievalChain`）しか実装されておらず、
現時点ではこれ以上追加する予定はありません。

## AIサービス

私たちはJava向けに調整された「AIサービス」と呼ばれる別のソリューションを提案します。
アイデアは、LLMや他のコンポーネントとの対話の複雑さを単純なAPIの背後に隠すことです。

このアプローチはSpring Data JPAやRetrofitに非常に似ています：望ましいAPIを持つインターフェースを宣言的に定義し、
LangChain4jがこのインターフェースを実装するオブジェクト（プロキシ）を提供します。
AIサービスをアプリケーションのサービス層のコンポーネントと考えることができます。
それは_AI_サービスを提供します。そのため、この名前が付けられています。

AIサービスは最も一般的な操作を処理します：
- LLMへの入力のフォーマット
- LLMからの出力の解析

また、より高度な機能もサポートしています：
- チャットメモリ
- ツール
- RAG

AIサービスは、双方向の対話を促進するステートフルなチャットボットの構築や、
LLMへの各呼び出しが分離されているプロセスの自動化に使用できます。

最もシンプルなAIサービスを見てみましょう。その後、より複雑な例を探ります。

## 最もシンプルなAIサービス

まず、入力として`String`を受け取り、`String`を返す単一のメソッド`chat`を持つインターフェースを定義します。
```java
interface Assistant {

    String chat(String userMessage);
}
```

次に、低レベルコンポーネントを作成します。これらのコンポーネントはAIサービスの内部で使用されます。
この場合、必要なのは`ChatModel`だけです：
```java
ChatModel model = OpenAiChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();
```

最後に、`AiServices`クラスを使用してAIサービスのインスタンスを作成できます：
```java
Assistant assistant = AiServices.create(Assistant.class, model);
```
:::note
[Quarkus](https://docs.quarkiverse.io/quarkus-langchain4j/dev/ai-services.html)
および[Spring Boot](/tutorials/spring-boot-integration#spring-boot-starter-for-declarative-ai-services)アプリケーションでは、
自動設定が`Assistant`ビーンの作成を処理します。
つまり、`AiServices.create(...)`を呼び出す必要はなく、必要な場所で`Assistant`を注入/オートワイヤするだけです。
:::

これで`Assistant`を使用できます：
```java
String answer = assistant.chat("Hello");
System.out.println(answer); // Hello, how can I help you?
```

## どのように機能するのか？

インターフェースの`Class`と低レベルコンポーネントを`AiServices`に提供すると、
`AiServices`はこのインターフェースを実装するプロキシオブジェクトを作成します。
現在は反射を使用していますが、代替案も検討中です。
このプロキシオブジェクトは、入力と出力のすべての変換を処理します。
この場合、入力は単一の`String`ですが、`ChatMessage`を入力として受け取る`ChatModel`を使用しています。
したがって、`AiService`は自動的にそれを`UserMessage`に変換し、`ChatModel`を呼び出します。
`chat`メソッドの出力タイプが`String`であるため、`ChatModel`が`AiMessage`を返した後、
`chat`メソッドから返される前に`String`に変換されます。

## QuarkusアプリケーションでのAIサービス
[LangChain4j Quarkus拡張機能](https://docs.quarkiverse.io/quarkus-langchain4j/dev/index.html)
はQuarkusアプリケーションでのAIサービスの使用を大幅に簡素化します。

詳細は[こちら](https://docs.quarkiverse.io/quarkus-langchain4j/dev/ai-services.html)で確認できます。

## Spring BootアプリケーションでのAIサービス
[LangChain4j Spring Bootスターター](/tutorials/spring-boot-integration/#spring-boot-starter-for-declarative-ai-services)
はSpring BootアプリケーションでのAIサービスの使用を大幅に簡素化します。

## @SystemMessage

では、より複雑な例を見てみましょう。
LLMにスラングを使って返答させてみましょう😉

これは通常、`SystemMessage`で指示を提供することで実現されます。

```java
interface Friend {

    @SystemMessage("You are a good friend of mine. Answer using slang.")
    String chat(String userMessage);
}

Friend friend = AiServices.create(Friend.class, model);

String answer = friend.chat("Hello"); // Hey! What's up?
```

この例では、使用したいシステムプロンプトテンプレートを含む`@SystemMessage`アノテーションを追加しました。
これは舞台裏で`SystemMessage`に変換され、`UserMessage`と一緒にLLMに送信されます。

`@SystemMessage`はリソースからプロンプトテンプレートを読み込むこともできます：
`@SystemMessage(fromResource = "my-prompt-template.txt")`

### システムメッセージプロバイダー
システムメッセージは、システムメッセージプロバイダーを使用して動的に定義することもできます：
```java
Friend friend = AiServices.builder(Friend.class)
    .chatModel(model)
    .systemMessageProvider(chatMemoryId -> "You are a good friend of mine. Answer using slang.")
    .build();
```
ご覧のように、チャットメモリID（ユーザーまたは会話）に基づいて異なるシステムメッセージを提供できます。

## @UserMessage

`@UserMessage`アノテーションを使用すると、LLMに送信されるユーザーメッセージをカスタマイズできます。
これは、メソッドパラメータを参照するプレースホルダーを含むテンプレートを指定することで行います。

```java
interface Translator {

    @UserMessage("Translate this text from {{from}} to {{to}}: {{text}}")
    String translate(String from, String to, String text);
}

Translator translator = AiServices.create(Translator.class, model);

String translation = translator.translate("English", "German", "Hello, world!");
System.out.println(translation); // Hallo, Welt!
```

この例では、`@UserMessage`アノテーションを使用して、3つのパラメータ（`from`、`to`、`text`）を参照するテンプレートを指定しています。
メソッドが呼び出されると、これらのパラメータの値がテンプレートに挿入され、結果のテキストが`UserMessage`として使用されます。

`@UserMessage`はリソースからプロンプトテンプレートを読み込むこともできます：
`@UserMessage(fromResource = "my-prompt-template.txt")`

### 単一パラメータの場合の省略形

メソッドが単一のパラメータを持つ場合、`{{it}}`プレースホルダーを使用して参照できます：

```java
interface Summarizer {

    @UserMessage("Summarize this text: {{it}}")
    String summarize(String text);
}
```

### パラメータの型

パラメータは任意の型にすることができます。LangChain4jは`toString()`メソッドを使用してそれらを文字列に変換します。
ただし、複雑なオブジェクトの場合、`toString()`メソッドをオーバーライドして、LLMに送信される文字列を制御することをお勧めします。

```java
interface CustomerSupportAgent {

    @SystemMessage("You are a customer support agent.")
    @UserMessage("Customer: {{customer}}\nIssue: {{issue}}")
    String handleIssue(Customer customer, Issue issue);
}

class Customer {
    private final String name;
    private final String email;
    private final String tier; // free, premium, enterprise

    @Override
    public String toString() {
        return String.format("Name: %s\nEmail: %s\nTier: %s", name, email, tier);
    }
}

class Issue {
    private final String description;
    private final String category;
    private final int priority; // 1-5

    @Override
    public String toString() {
        return String.format("Description: %s\nCategory: %s\nPriority: %d", description, category, priority);
    }
}
```

## 戻り値の型

AIサービスのメソッドは、さまざまな戻り値の型を持つことができます。
LangChain4jは、LLMからの応答を指定された型に変換します。

### String

最も単純なケースでは、メソッドは`String`を返します。
この場合、LLMからの応答テキストがそのまま返されます。

```java
interface Assistant {

    String chat(String userMessage);
}
```

### プリミティブ型

メソッドはプリミティブ型（`boolean`、`int`、`long`、`float`、`double`）を返すこともできます。
この場合、LLMからの応答テキストが対応するプリミティブ型に変換されます。

```java
interface Classifier {

    @UserMessage("Is the following text positive? {{it}}")
    boolean isPositive(String text);

    @UserMessage("Rate the sentiment of the following text from 1 to 5: {{it}}")
    int rateSentiment(String text);
}
```

### 列挙型

メソッドは列挙型を返すこともできます。
この場合、LLMからの応答テキストが列挙型の値に変換されます。

```java
enum Sentiment {
    POSITIVE, NEUTRAL, NEGATIVE
}

interface SentimentAnalyzer {

    @UserMessage("Analyze the sentiment of the following text: {{it}}")
    Sentiment analyzeSentiment(String text);
}
```

### POJO

メソッドはPOJO（Plain Old Java Object）を返すこともできます。
この場合、LLMからの応答テキストがJSONとして解析され、指定されたPOJOに変換されます。

```java
class MovieReview {
    private String title;
    private String director;
    private int year;
    private double rating;
    private List<String> strengths;
    private List<String> weaknesses;

    // getters and setters
}

interface MovieCritic {

    @SystemMessage("You are a movie critic. Provide your review in JSON format.")
    MovieReview reviewMovie(String movieTitle);
}
```

### コレクション

メソッドはコレクション（`List`、`Set`など）を返すこともできます。
この場合、LLMからの応答テキストがJSONとして解析され、指定されたコレクション型に変換されます。

```java
interface Recommender {

    @UserMessage("Recommend 5 movies similar to {{it}}")
    List<String> recommendMoviesSimilarTo(String movieTitle);

    @UserMessage("Recommend 5 books in the {{it}} genre")
    Set<String> recommendBooksInGenre(String genre);
}
```

### 複雑なオブジェクトのコレクション

メソッドは複雑なオブジェクトのコレクションを返すこともできます。

```java
interface MovieRecommender {

    @SystemMessage("You are a movie recommendation system. Provide your recommendations in JSON format.")
    List<MovieRecommendation> recommendMovies(String genre, int numberOfRecommendations);
}

class MovieRecommendation {
    private String title;
    private String director;
    private int year;
    private List<String> genres;
    private double rating;

    // getters and setters
}
```

### 出力パーサー

デフォルトでは、LangChain4jは戻り値の型に基づいて適切な出力パーサーを選択します。
ただし、カスタム出力パーサーを指定することもできます。

```java
interface Assistant {

    @SystemMessage("You are a helpful assistant.")
    @ResponseParser(MyCustomOutputParser.class)
    MyCustomType chat(String userMessage);
}

class MyCustomOutputParser implements OutputParser<MyCustomType> {

    @Override
    public MyCustomType parse(String text) {
        // カスタム解析ロジック
        return new MyCustomType(...);
    }
}
```

## チャットメモリ

AIサービスは、会話の状態を維持するためのチャットメモリをサポートしています。
これにより、ユーザーとAIの間の複数ターンの会話が可能になります。

```java
interface Assistant {

    String chat(String userMessage);
}

ChatMemory chatMemory = MessageWindowChatMemory.withMaxMessages(10);

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .chatMemory(chatMemory)
    .build();

String answer1 = assistant.chat("Hello, my name is Klaus"); // Hi Klaus, how can I help you?
String answer2 = assistant.chat("What is my name?"); // Your name is Klaus.
```

この例では、`MessageWindowChatMemory`を使用して、最大10個のメッセージを保持するチャットメモリを作成しています。
`assistant.chat("Hello, my name is Klaus")`の呼び出し後、チャットメモリには2つのメッセージが含まれます：
ユーザーからの「Hello, my name is Klaus」というメッセージと、AIからの「Hi Klaus, how can I help you?」という応答です。
`assistant.chat("What is my name?")`を呼び出すと、これらの2つのメッセージと新しいユーザーメッセージ「What is my name?」がLLMに送信されます。
これにより、LLMはユーザーの名前を「覚えて」いることができます。

### 複数ユーザーのためのチャットメモリ

複数のユーザーがいる場合、各ユーザーに個別のチャットメモリを提供する必要があります。
これは、`ChatMemoryProvider`を使用して実現できます。

```java
interface Assistant {

    String chat(String userMessage);
}

Map<Object, ChatMemory> chatMemories = new ConcurrentHashMap<>();

ChatMemoryProvider chatMemoryProvider = memoryId -> chatMemories.computeIfAbsent(
    memoryId, 
    id -> MessageWindowChatMemory.builder()
        .id(id)
        .maxMessages(10)
        .build()
);

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .chatMemoryProvider(chatMemoryProvider)
    .build();

// ユーザー1との会話
String user1Answer1 = assistant.chat("user1", "Hello, my name is Klaus"); // Hi Klaus, how can I help you?
String user1Answer2 = assistant.chat("user1", "What is my name?"); // Your name is Klaus.

// ユーザー2との会話
String user2Answer1 = assistant.chat("user2", "Hello, my name is John"); // Hi John, how can I help you?
String user2Answer2 = assistant.chat("user2", "What is my name?"); // Your name is John.
```

この例では、`chat`メソッドの最初のパラメータとして`memoryId`を追加しました。
これは、どのチャットメモリを使用するかを識別するために使用されます。
`chatMemoryProvider`は、指定された`memoryId`に対応するチャットメモリを提供します。
存在しない場合は新しいものを作成します。

### 永続的なチャットメモリ

チャットメモリをデータベースなどの永続ストアに保存したい場合は、`ChatMemoryStore`を実装できます。

```java
class DatabaseChatMemoryStore implements ChatMemoryStore {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        String json = jdbcTemplate.queryForObject(
            "SELECT messages FROM chat_memories WHERE id = ?",
            String.class,
            memoryId
        );
        return ChatMessageDeserializer.messagesFromJson(json);
    }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        String json = ChatMessageSerializer.messagesToJson(messages);
        int updated = jdbcTemplate.update(
            "UPDATE chat_memories SET messages = ? WHERE id = ?",
            json,
            memoryId
        );
        if (updated == 0) {
            jdbcTemplate.update(
                "INSERT INTO chat_memories (id, messages) VALUES (?, ?)",
                memoryId,
                json
            );
        }
    }

    @Override
    public void deleteMessages(Object memoryId) {
        jdbcTemplate.update(
            "DELETE FROM chat_memories WHERE id = ?",
            memoryId
        );
    }
}

ChatMemoryStore chatMemoryStore = new DatabaseChatMemoryStore(jdbcTemplate);

ChatMemoryProvider chatMemoryProvider = memoryId -> MessageWindowChatMemory.builder()
    .id(memoryId)
    .maxMessages(10)
    .chatMemoryStore(chatMemoryStore)
    .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .chatMemoryProvider(chatMemoryProvider)
    .build();
```

この例では、`DatabaseChatMemoryStore`を実装して、チャットメッセージをデータベースに保存しています。
`ChatMessageSerializer`と`ChatMessageDeserializer`は、チャットメッセージをJSONに変換したり、JSONからチャットメッセージに変換したりするためのユーティリティクラスです。

## ツール

AIサービスは、LLMがアクセスできるツールをサポートしています。
ツールは、LLMが外部システムと対話するための方法を提供します。

```java
interface WeatherService {

    @Tool("Get the current weather in a given location")
    String getCurrentWeather(String location);
}

class WeatherServiceImpl implements WeatherService {

    @Override
    public String getCurrentWeather(String location) {
        // 実際の実装では、外部のAPIを呼び出すかもしれません
        return "It's sunny and 25°C in " + location;
    }
}

interface Assistant {

    String chat(String userMessage);
}

WeatherService weatherService = new WeatherServiceImpl();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .tools(weatherService)
    .build();

String answer = assistant.chat("What's the weather like in Tokyo?");
// To answer your question, I'll need to check the current weather in Tokyo.
// It's sunny and 25°C in Tokyo.
```

この例では、`WeatherService`インターフェースを定義し、`@Tool`アノテーションを使用してLLMがアクセスできるメソッドをマークしています。
次に、`WeatherServiceImpl`クラスでこのインターフェースを実装します。
最後に、`AiServices.builder(...).tools(weatherService)`を使用して、AIサービスにツールを提供します。

ユーザーが「What's the weather like in Tokyo?」と尋ねると、LLMは`getCurrentWeather`ツールを呼び出して、東京の現在の天気を取得します。

### 複数のツール

AIサービスは複数のツールをサポートしています。

```java
interface WeatherService {

    @Tool("Get the current weather in a given location")
    String getCurrentWeather(String location);
}

interface CalendarService {

    @Tool("Get the user's calendar events for a specific date")
    List<CalendarEvent> getEvents(String date);

    @Tool("Add an event to the user's calendar")
    void addEvent(String date, String time, String description);
}

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .tools(weatherService, calendarService)
    .build();
```

### ツールパラメータの型

ツールのパラメータは任意の型にすることができます。
LLMは通常、文字列を生成しますが、LangChain4jはそれらを適切な型に変換します。

```java
interface CalendarService {

    @Tool("Get the user's calendar events for a specific date")
    List<CalendarEvent> getEvents(LocalDate date);

    @Tool("Add an event to the user's calendar")
    void addEvent(LocalDate date, LocalTime time, String description);
}
```

この例では、`getEvents`メソッドは`LocalDate`パラメータを受け取り、`addEvent`メソッドは`LocalDate`と`LocalTime`パラメータを受け取ります。
LLMが「2023-01-01」や「14:30」などの文字列を生成すると、LangChain4jはそれらを適切な型に変換します。

### ツールの戻り値の型

ツールはさまざまな戻り値の型を持つことができます。
LangChain4jは、ツールの戻り値をLLMが理解できる文字列に変換します。

```java
interface CalendarService {

    @Tool("Get the user's calendar events for a specific date")
    List<CalendarEvent> getEvents(LocalDate date);
}

class CalendarEvent {
    private final String title;
    private final LocalTime startTime;
    private final LocalTime endTime;
    private final String location;

    @Override
    public String toString() {
        return String.format("%s - %s: %s at %s", startTime, endTime, title, location);
    }
}
```

この例では、`getEvents`メソッドは`CalendarEvent`オブジェクトのリストを返します。
LangChain4jは、各`CalendarEvent`オブジェクトの`toString()`メソッドを使用して、それらをLLMが理解できる文字列に変換します。

## RAG（検索拡張生成）

AIサービスは、RAG（検索拡張生成）をサポートしています。
RAGは、LLMの応答を生成する前に、関連する情報を検索して提供するテクニックです。

```java
interface Assistant {

    String chat(String userMessage);
}

EmbeddingModel embeddingModel = OpenAiEmbeddingModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName("text-embedding-3-small")
    .build();

EmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();

DocumentLoader loader = DocumentLoaders.fromPath(Paths.get("path/to/document.pdf"));
Document document = loader.load();

DocumentSplitter splitter = DocumentSplitters.recursive(500, 0);
List<TextSegment> segments = splitter.split(document);

Embedder embedder = new Embedder(embeddingModel);
embedder.embedAll(segments, embeddingStore);

ContentRetriever contentRetriever = DefaultContentRetriever.builder()
    .embeddingModel(embeddingModel)
    .embeddingStore(embeddingStore)
    .maxResults(3)
    .minScore(0.7)
    .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .contentRetriever(contentRetriever)
    .build();

String answer = assistant.chat("What does the document say about X?");
```

この例では、PDFドキュメントを読み込み、それをテキストセグメントに分割し、各セグメントの埋め込みを計算して埋め込みストアに保存しています。
次に、`ContentRetriever`を作成し、それをAIサービスに提供しています。

ユーザーが質問すると、LangChain4jは自動的に：
1. 質問の埋め込みを計算します
2. 埋め込みストアから最も関連性の高いテキストセグメントを検索します
3. これらのセグメントをLLMに提供し、質問に答えるよう指示します

`RetrievalAugmentor`を設定すると、さらに柔軟性が高まり、
クエリ変換、再ランキングなどの[高度なRAG](/tutorials/rag#advanced-rag)機能が可能になります：
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

RAGの詳細については[こちら](/tutorials/rag)をご覧ください。

RAGの例は[こちら](https://github.com/langchain4j/langchain4j-examples/tree/main/rag-examples/src/main/java)で確認できます。


## 自動モデレーション
[例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithAutoModerationExample.java)


## 複数のAIサービスの連鎖
LLM駆動アプリケーションのロジックが複雑になればなるほど、
ソフトウェア開発の一般的な慣行と同様に、それをより小さな部分に分解することが重要になります。

例えば、すべての可能なシナリオに対応するために多くの指示をシステムプロンプトに詰め込むと、
エラーや非効率が発生しやすくなります。指示が多すぎると、LLMは一部を見落とす可能性があります。
さらに、指示が提示される順序も重要であり、プロセスをさらに困難にします。

この原則は、ツール、RAG、`temperature`や`maxTokens`などのモデルパラメータにも適用されます。

チャットボットは常にすべてのツールを認識している必要はないでしょう。
例えば、ユーザーが単にチャットボットに挨拶したり別れを告げたりする場合、
LLMに数十または数百のツールへのアクセスを与えることはコストがかかり、時には危険でもあります
（LLM呼び出しに含まれる各ツールは相当数のトークンを消費します）。
また、意図しない結果につながる可能性もあります（LLMは幻覚を見たり、意図しない入力でツールを呼び出すよう操作されたりする可能性があります）。

RAGに関しても同様に、LLMにコンテキストを提供する必要がある場合もありますが、
常にそうとは限りません。追加コストがかかり（コンテキストが多い＝トークンが多い）、
応答時間が長くなるためです（コンテキストが多い＝レイテンシーが高い）。

モデルパラメータに関しては、特定の状況ではLLMを高度に決定論的にする必要があるため、
低い`temperature`を設定することがあります。他のケースでは、より高い`temperature`を選択するかもしれません。

要点は、より小さく特化したコンポーネントの方が、開発、テスト、保守、理解が容易で安価だということです。

考慮すべきもう一つの側面は、次の2つの極端なケースです：
- アプリケーションがフローを制御し、LLMが単なるコンポーネントの一つにすぎない、高度に決定論的なアプリケーションを好みますか？
- それとも、LLMに完全な自律性を持たせ、アプリケーションを駆動させたいですか？

あるいは、状況に応じて両方を組み合わせますか？
アプリケーションをより小さく管理しやすい部分に分解すれば、これらすべてのオプションが可能になります。

AIサービスは通常の（決定論的な）ソフトウェアコンポーネントとして使用したり、組み合わせたりできます：
- 一つのAIサービスを別のAIサービスの後に呼び出すことができます（連鎖と呼ばれます）。
- 決定論的なものとLLM駆動の`if`/`else`文を使用できます（AIサービスは`boolean`を返すことができます）。
- 決定論的なものとLLM駆動の`switch`文を使用できます（AIサービスは`enum`を返すことができます）。
- 決定論的なものとLLM駆動の`for`/`while`ループを使用できます（AIサービスは`int`やその他の数値型を返すことができます）。
- ユニットテストでAIサービス（インターフェースであるため）をモック化できます。
- 各AIサービスを分離して統合テストできます。
- 各AIサービスの最適なパラメータを個別に評価して見つけることができます。
- など

Let's consider a simple example.
I want to build a chatbot for my company.
If a user greets the chatbot,
I want it to respond with the pre-defined greeting without relying on an LLM to generate the greeting.
If a user asks a question, I want the LLM to generate the response using internal knowledge base of the company (aka RAG).

Here is how this task can be decomposed into 2 separate AI Services:
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

Notice how we used the cheaper Llama2 for the simple task of identifying whether the text is a greeting or not,
and the more expensive GPT-4 with a content retriever (RAG) for a more complex task.

This is a very simple and somewhat naive example, but hopefully, it demonstrates the idea.

Now, I can mock both `GreetingExpert` and `ChatBot` and test `MilesOfSmiles` in isolation
Also, I can integration test `GreetingExpert` and `ChatBot` separately.
I can evaluate both of them separately and find the most optimal parameters for each subtask,
or, in the long run, even fine-tune a small specialized model for each specific subtask.


## Testing

- [An example of integration testing for a Customer Support Agent](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/test/java/dev/langchain4j/example/CustomerSupportAgentIT.java)


## Related Tutorials
- [LangChain4j AiServices Tutorial](https://www.sivalabs.in/langchain4j-ai-services-tutorial/) by [Siva](https://www.sivalabs.in/)
