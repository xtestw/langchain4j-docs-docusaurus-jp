---
sidebar_position: 27
---

# Spring Boot 統合

LangChain4jは以下のための[Spring Bootスターター](https://github.com/langchain4j/langchain4j-spring)を提供しています：
- 一般的な統合
- 宣言的な[AIサービス](/tutorials/ai-services)

## Spring Bootスターター

Spring Bootスターターは、プロパティを通じて
[言語モデル](/category/language-models)、
[埋め込みモデル](/category/embedding-models)、
[埋め込みストア](/category/embedding-stores)、
およびその他のLangChain4jコアコンポーネントの作成と設定を支援します。

[Spring Bootスターター](https://github.com/langchain4j/langchain4j-spring)のいずれかを使用するには、
対応する依存関係をインポートします。

Spring Bootスターター依存関係の命名規則は：`langchain4j-{integration-name}-spring-boot-starter`です。

例えば、OpenAI（`langchain4j-open-ai`）の場合、依存関係名は`langchain4j-open-ai-spring-boot-starter`になります：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

その後、`application.properties`ファイルでモデルパラメータを以下のように設定できます：
```
langchain4j.open-ai.chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.chat-model.model-name=gpt-4o
langchain4j.open-ai.chat-model.log-requests=true
langchain4j.open-ai.chat-model.log-responses=true
...
```

この場合、`OpenAiChatModel`（`ChatModel`の実装）のインスタンスが自動的に作成され、
必要な場所でオートワイヤリングできます：
```java
@RestController
public class ChatController {

    ChatModel chatModel;

    public ChatController(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/chat")
    public String model(@RequestParam(value = "message", defaultValue = "Hello") String message) {
        return chatModel.chat(message);
    }
}
```

`StreamingChatModel`のインスタンスが必要な場合は、
`chat-model`プロパティの代わりに`streaming-chat-model`プロパティを使用します：
```
langchain4j.open-ai.streaming-chat-model.api-key=${OPENAI_API_KEY}
...
```

## 宣言的AIサービスのためのSpring Bootスターター

LangChain4jは[AIサービス](/tutorials/ai-services)、[RAG](/tutorials/rag)、[ツール](/tutorials/tools)などを
自動設定するためのSpring Bootスターターを提供しています。

すでに統合スターターのいずれかをインポートしていることを前提として（上記参照）、
`langchain4j-spring-boot-starter`をインポートします：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-spring-boot-starter</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

これで、AIサービスインターフェースを定義し、`@AiService`でアノテーションを付けることができます：
```java
@AiService
interface Assistant {

    @SystemMessage("あなたは丁寧なアシスタントです")
    String chat(String userMessage);
}
```

これは標準的なSpring Boot `@Service`と考えることができますが、AI機能を備えています。

アプリケーションが起動すると、LangChain4jスターターはクラスパスをスキャンし、
`@AiService`でアノテーションが付けられたすべてのインターフェースを見つけます。
見つかった各AIサービスに対して、アプリケーションコンテキストで利用可能なすべてのLangChain4jコンポーネントを
使用してこのインターフェースの実装を作成し、Beanとして登録します。
これにより、必要な場所でオートワイヤリングできます：
```java
@RestController
class AssistantController {

    @Autowired
    Assistant assistant;

    @GetMapping("/chat")
    public String chat(String message) {
        return assistant.chat(message);
    }
}
```

### 自動コンポーネントワイヤリング
以下のコンポーネントがアプリケーションコンテキストで利用可能な場合、AIサービスに自動的にワイヤリングされます：
- `ChatModel`
- `StreamingChatModel`
- `ChatMemory`
- `ChatMemoryProvider`
- `ContentRetriever`
- `RetrievalAugmentor`
- `@Tool`でアノテーションが付けられた任意の`@Component`または`@Service`クラスのすべてのメソッド
例：
```java
@Component
public class BookingTools {

    private final BookingService bookingService;

    public BookingTools(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Tool
    public Booking getBookingDetails(String bookingNumber, String customerName, String customerSurname) {
        return bookingService.getBookingDetails(bookingNumber, customerName, customerSurname);
    }

    @Tool
    public void cancelBooking(String bookingNumber, String customerName, String customerSurname) {
        bookingService.cancelBooking(bookingNumber, customerName, customerSurname);
    }
}
```

:::note
アプリケーションコンテキストに同じ型の複数のコンポーネントが存在する場合、アプリケーションは起動に失敗します。
この場合、明示的なワイヤリングモード（以下で説明）を使用してください。
:::

### 明示的コンポーネントワイヤリング

複数のAIサービスがあり、それぞれに異なるLangChain4jコンポーネントをワイヤリングしたい場合、
明示的ワイヤリングモード（`@AiService(wiringMode = EXPLICIT)`）を使用して、
どのコンポーネントを使用するかを指定できます。

2つの`ChatModel`が設定されているとします：
```properties
# OpenAI
langchain4j.open-ai.chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.chat-model.model-name=gpt-4o-mini

# Ollama
langchain4j.ollama.chat-model.base-url=http://localhost:11434
langchain4j.ollama.chat-model.model-name=llama3.1
```

```java
@AiService(wiringMode = EXPLICIT, chatModel = "openAiChatModel")
interface OpenAiAssistant {

    @SystemMessage("あなたは丁寧なアシスタントです")
    String chat(String userMessage);
}

@AiService(wiringMode = EXPLICIT, chatModel = "ollamaChatModel")
interface OllamaAssistant {

    @SystemMessage("あなたは丁寧なアシスタントです")
    String chat(String userMessage);
}
```

:::note
この場合、**すべての**コンポーネントを明示的に指定する必要があります。
:::

詳細は[こちら](https://github.com/langchain4j/langchain4j-spring/blob/main/langchain4j-spring-boot-starter/src/main/java/dev/langchain4j/service/spring/AiService.java)で確認できます。

### AIサービス登録イベントのリスニング

宣言的な方法でAIサービスの開発を完了した後、`ApplicationListener<AiServiceRegisteredEvent>`インターフェースを
実装することで`AiServiceRegisteredEvent`をリッスンできます。
このイベントはAIサービスがSpringコンテキストに登録されたときにトリガーされ、
実行時に登録されたすべてのAIサービスとそのツールに関する情報を取得できます。
例：
```java
@Component
class AiServiceRegisteredEventListener implements ApplicationListener<AiServiceRegisteredEvent> {


    @Override
    public void onApplicationEvent(AiServiceRegisteredEvent event) {
        Class<?> aiServiceClass = event.aiServiceClass();
        List<ToolSpecification> toolSpecifications = event.toolSpecifications();
        for (int i = 0; i < toolSpecifications.size(); i++) {
            System.out.printf("[%s]: [Tool-%s]: %s%n", aiServiceClass.getSimpleName(), i + 1, toolSpecifications.get(i));
        }
    }
}
```

## Flux

ストリーミング時には、AIサービスの戻り値の型として`Flux<String>`を使用できます：
```java
@AiService
interface Assistant {

    @SystemMessage("あなたは丁寧なアシスタントです")
    Flux<String> chat(String userMessage);
}
```
これには、`langchain4j-reactor`モジュールをインポートしてください。
詳細は[こちら](/tutorials/ai-services#flux)をご覧ください。

## 可観測性

`ChatModel`または`StreamingChatModel`ビーンの可観測性を有効にするには、
1つ以上の`ChatModelListener`ビーンを宣言する必要があります：

```java
@Configuration
class MyConfiguration {
    
    @Bean
    ChatModelListener chatModelListener() {
        return new ChatModelListener() {

            private static final Logger log = LoggerFactory.getLogger(ChatModelListener.class);

            @Override
            public void onRequest(ChatModelRequestContext requestContext) {
                log.info("onRequest(): {}", requestContext.chatRequest());
            }

            @Override
            public void onResponse(ChatModelResponseContext responseContext) {
                log.info("onResponse(): {}", responseContext.chatResponse());
            }

            @Override
            public void onError(ChatModelErrorContext errorContext) {
                log.info("onError(): {}", errorContext.error().getMessage());
            }
        };
    }
}
```

アプリケーションコンテキスト内のすべての`ChatModelListener`ビーンは、
Spring Bootスターターの1つによって作成されたすべての`ChatModel`および`StreamingChatModel`ビーンに
自動的に注入されます。

## テスト

- [カスタマーサポートエージェントの統合テストの例](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/test/java/dev/langchain4j/example/CustomerSupportAgentIT.java)

## サポートされているバージョン

LangChain4j Spring Boot統合にはJava 17とSpring Boot 3.2が必要です。

## 例
- [ChatModel API](/tutorials/chat-and-language-models)を使用した[低レベルSpring Boot例](https://github.com/langchain4j/langchain4j-examples/blob/main/spring-boot-example/src/main/java/dev/langchain4j/example/lowlevel/ChatModelController.java)
- [AIサービス](/tutorials/ai-services)を使用した[高レベルSpring Boot例](https://github.com/langchain4j/langchain4j-examples/blob/main/spring-boot-example/src/main/java/dev/langchain4j/example/aiservice/AssistantController.java)
- [Spring Bootを使用したカスタマーサポートエージェントの例](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/main/java/dev/langchain4j/example/CustomerSupportAgentApplication.java)
