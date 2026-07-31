---
sidebar_position: 27
---

# Spring Boot 統合

LangChain4j は以下のために [Spring Boot starters](https://github.com/langchain4j/langchain4j-spring) を提供します：
- 主要な統合
- 宣言的な [AI サービス](/tutorials/ai-services)


## Spring Boot Starters

Spring Boot starters はプロパティを通じて
[言語モデル](/category/language-models)、
[埋め込みモデル](/category/embedding-models)、
[埋め込みストア](/category/embedding-stores)、
およびその他のコア LangChain4j コンポーネントの作成と設定を支援します。

いずれかの [Spring Boot starter](https://github.com/langchain4j/langchain4j-spring) を使用するには、
対応する依存関係をインポートしてください。

Spring Boot starter 依存関係の命名規則は次のとおりです：
- **Spring Boot 3** 向け：`langchain4j-{integration-name}-spring-boot-starter`
- **Spring Boot 4** 向け：`langchain4j-{integration-name}-spring-boot4-starter`

例えば、OpenAI（`langchain4j-open-ai`）の場合：

**Spring Boot 3：**
 ```xml
 <dependency>
     <groupId>dev.langchain4j</groupId>
     <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
     <version>1.18.1-beta28</version>
 </dependency>
```

**Spring Boot 4：**
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot4-starter</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

次に、`application.properties` ファイルでモデルパラメータを次のように設定できます：
```
langchain4j.open-ai.chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.chat-model.model-name=gpt-4o
langchain4j.open-ai.chat-model.log-requests=true
langchain4j.open-ai.chat-model.log-responses=true
...
```

この場合、`OpenAiChatModel`（`ChatModel` の実装）のインスタンスが自動的に作成され、
必要な場所でオートワイヤできます：
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

`StreamingChatModel` のインスタンスが必要な場合は、
`chat-model` プロパティの代わりに `streaming-chat-model` を使用してください：
```
langchain4j.open-ai.streaming-chat-model.api-key=${OPENAI_API_KEY}
...
```


## 宣言的 AI サービスの Spring Boot starter

LangChain4j は
[AI サービス](/tutorials/ai-services)、[RAG](/tutorials/rag)、[ツール](/tutorials/tools) などを自動構成するための Spring Boot starter を提供します。

すでにいずれかの統合 starter をインポート済みである場合（上記参照）、
`langchain4j-spring-boot-starter`（Spring Boot 3）または `langchain4j-spring-boot4-starter`（Spring Boot 4）をインポートしてください：

**Spring Boot 3：**
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-spring-boot-starter</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

**Spring Boot 4：**
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-spring-boot4-starter</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

これで AI サービスインターフェースを定義し、`@AiService` で注釈できます：
```java
@AiService
interface Assistant {

    @SystemMessage("You are a polite assistant")
    String chat(String userMessage);
}
```

標準の Spring Boot `@Service` だが AI 機能を持つものと考えてください。

アプリケーション起動時、LangChain4j starter はクラスパスをスキャンし、
`@AiService` で注釈されたすべてのインターフェースを見つけます。
見つかった各 AI サービスについて、アプリケーションコンテキストで利用可能なすべての LangChain4j コンポーネントを使って
このインターフェースの実装を作成し、bean として登録します。
そのため、必要な場所でオートワイヤできます：
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

### 自動コンポーネント配線
アプリケーションコンテキストで利用可能な場合、次のコンポーネントが AI サービスに自動配線されます：
- `ChatModel`
- `StreamingChatModel`
- `ChatMemory`
- `ChatMemoryProvider`
- `ContentRetriever`
- `RetrievalAugmentor`
- `ToolProvider`
- `@Component` または `@Service` クラス内の `@Tool` で注釈されたすべてのメソッド
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
アプリケーションコンテキストに同じ型のコンポーネントが複数存在する場合、アプリケーションは起動に失敗します。
その場合は、明示的な配線モード（下記）を使用してください。
:::

### 明示的なコンポーネント配線

複数の AI サービスがあり、それぞれに異なる LangChain4j コンポーネントを配線したい場合、
明示的な配線モード（`@AiService(wiringMode = EXPLICIT)`）で使用するコンポーネントを指定できます。

2 つの `ChatModel` が設定されているとします：
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

    @SystemMessage("You are a polite assistant")
    String chat(String userMessage);
}

@AiService(wiringMode = EXPLICIT, chatModel = "ollamaChatModel")
interface OllamaAssistant {

    @SystemMessage("You are a polite assistant")
    String chat(String userMessage);
}
```

:::note
この場合、**すべての**コンポーネントを明示的に指定する必要があります。
:::

詳細は [こちら](https://github.com/langchain4j/langchain4j-spring/blob/main/langchain4j-spring-boot-starter/src/main/java/dev/langchain4j/service/spring/AiService.java)
（Spring Boot 4 バリアントも同じ API）を参照してください。

### AI サービス登録イベントのリスニング

宣言的な方法で AI サービスの開発を完了したら、
`ApplicationListener<AiServiceRegisteredEvent>` インターフェースを実装して
`AiServiceRegisteredEvent` をリッスンできます。
このイベントは AI サービスが Spring コンテキストに登録されたときに発火され、
実行時に登録済みのすべての AI サービスとそのツールに関する情報を取得できます。
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

ストリーミング時、AI サービスの戻り値型として `Flux<String>` を使用できます：
```java
@AiService
interface Assistant {

    @SystemMessage("You are a polite assistant")
    Flux<String> chat(String userMessage);
}
```
このためには、`langchain4j-reactor` モジュールをインポートしてください。
詳細は [こちら](/tutorials/ai-services#flux) を参照してください。


## オブザーバビリティ

`ChatModel` または `StreamingChatModel`
bean のオブザーバビリティを有効にするには、1 つ以上の `ChatModelListener` bean を宣言する必要があります：

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

アプリケーションコンテキスト内のすべての `ChatModelListener` bean は、
いずれかの Spring Boot starter によって作成された
すべての `ChatModel` および `StreamingChatModel` bean に自動的に注入されます。

### Micrometer メトリクス
プロジェクトに `langchain4j-micrometer-metrics` 依存関係を追加します：

Maven の場合：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-micrometer-metrics</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```
Gradle の場合：
```gradle
implementation 'dev.langchain4j:langchain4j-micrometer-metrics:1.18.1-beta28'
```

#### Micrometer（Actuator）の設定
プロジェクトに必要な Actuator 依存関係も追加する必要があります。
例えば Spring Boot を使用している場合、`pom.xml` に次の依存関係を追加できます：

Maven の場合：
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```
Gradle の場合：
```gradle
implementation 'org.springframework.boot:spring-boot-starter-actuator'
```

プロパティで `/metrics` Actuator エンドポイントを有効にします。

application.properties：
```properties
management.endpoints.web.exposure.include=metrics
```
application.yaml：
```yaml
management:
  endpoints:
    web:
      exposure:
        include: metrics
```

#### `MicrometerMetricsChatModelListener` bean の設定

Spring Boot アプリケーションでは、リスナーを bean として定義し、`MeterRegistry` を注入できます：

```java
import dev.langchain4j.micrometer.metrics.listeners.MicrometerMetricsChatModelListener;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {

    @Bean
    public MicrometerMetricsChatModelListener listener(MeterRegistry meterRegistry) {
        return new MicrometerMetricsChatModelListener(meterRegistry);
    }
}
```

#### メトリクスの表示

アプリケーションの `/actuator/metrics` エンドポイントにアクセスしてメトリクスを表示できます。

例えば、アプリケーションが `localhost:8080` で動作している場合、
http://localhost:8080/actuator/metrics にアクセスしてメトリクスを表示できます。

##### トークン使用量メトリクス

次の URL でトークン使用量メトリクスを表示します：
```
http://localhost:8080/actuator/metrics/gen_ai.client.token.usage
```

##### トークンタイプによるフィルタリング

`gen_ai.token.type` タグは、トークンが入力用か出力用かを示します：

| トークンタイプ | エンドポイント |
|------------|----------|
| 入力トークン | `/actuator/metrics/gen_ai.client.token.usage?tag=gen_ai.token.type:input` |
| 出力トークン | `/actuator/metrics/gen_ai.client.token.usage?tag=gen_ai.token.type:output` |

> **注**：`gen_ai.client.token.usage` メトリクスはヒストグラム（DistributionSummary）です。タグなしのエンドポイントは、すべてのトークンタイプ、モデル、プロバイダーにわたる集計統計（count、total、max）を表示します。

### Micrometer Observation API

これは [Micrometer Observation API](https://docs.micrometer.io/micrometer/reference/observation.html) を使用して `ChatModelListener` を実装し、次の依存関係を追加することでメトリクスとトレースを透過的に生成できます：

Maven の場合：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-observation</artifactId>
</dependency>
```
Gradle の場合：
```gradle
implementation 'dev.langchain4j:langchain4j-observation'
```

Observation リスナーを次のようにインスタンス化する必要があります……

#### ObservationChatModelListener bean の設定

```java
@Configuration
public class ObservationConfig {

    @Bean
    public ObservationChatModelListener listener(ObservationRegistry observationRegistry, MeterRegistry meterRegistry) {
        return new ObservationChatModelListener(observationRegistry, meterRegistry);
    }
}
```

この依存関係には、上記で説明した [SpringBoot Actuator](spring-boot-integration.md#micrometer-actuator-configuration) の設定が必要です。

SpringBoot アプリケーションにおける追加のオブザーバビリティ要件については、次を参照してください：
[Building Your First Observed Application](https://spring.io/blog/2022/10/12/observability-with-spring-boot-3#building-your-first-observed-application)

`langchain4j-observation` ライブラリの詳細については、[オブザーバビリティドキュメント](observability.md#micrometer-observation-api) を確認してください。


## テスト

- [カスタマーサポートエージェントの統合テスト例](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/test/java/dev/langchain4j/example/CustomerSupportAgentIT.java)

## サポートされているバージョン

LangChain4j の Spring Boot 統合には Java 17 が必要で、次の両方をサポートします：
- **Spring Boot 3**（3.5+）— [Spring Boot OSS サポートポリシー](https://spring.io/projects/spring-boot#support) に沿って `-spring-boot-starter` 接尾辞の starter を使用
- **Spring Boot 4**（4.0+）— `-spring-boot4-starter` 接尾辞の starter を使用

両系列は一緒にリリースされ、同じバージョン番号を共有します。プロジェクトの Spring Boot バージョンに一致する starter セットを選択してください。

## 例
- [ChatModel API](/tutorials/chat-and-language-models) を使用した [低レベル Spring Boot の例](https://github.com/langchain4j/langchain4j-examples/blob/main/spring-boot-example/src/main/java/dev/langchain4j/example/lowlevel/ChatModelController.java)
- [AI サービス](/tutorials/ai-services) を使用した [高レベル Spring Boot の例](https://github.com/langchain4j/langchain4j-examples/blob/main/spring-boot-example/src/main/java/dev/langchain4j/example/aiservice/AssistantController.java)
- [Spring Boot を使用したカスタマーサポートエージェントの例](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/main/java/dev/langchain4j/example/CustomerSupportAgentApplication.java)
