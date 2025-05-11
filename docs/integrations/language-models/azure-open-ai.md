---
sidebar_position: 3
---

# Azure OpenAI

:::note

これは、Microsoft Azure SDKを使用する`Azure OpenAI`統合のドキュメントで、Microsoft Javaスタック（高度なAzure認証メカニズムを含む）を使用している場合に最適です。

LangChain4jはチャットモデルを使用するためのOpenAIとの4つの異なる統合を提供しており、これは#3です：

- [OpenAI](/integrations/language-models/open-ai)は、OpenAI REST APIのカスタムJava実装を使用し、Quarkus（Quarkus RESTクライアントを使用）とSpring（SpringのRestClientを使用）で最適に動作します。
- [OpenAI公式SDK](/integrations/language-models/open-ai-official)は、OpenAIの公式Java SDKを使用します。
- [Azure OpenAI](/integrations/language-models/azure-open-ai)は、Microsoft Azure SDKを使用し、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最適です。
- [GitHubモデル](/integrations/language-models/github-models)は、GitHub ModelsにアクセスするためにAzure AI推論APIを使用します。

:::

Azure OpenAIは、[Azure OpenAI Java SDK](https://learn.microsoft.com/en-us/java/api/overview/azure/ai-openai-readme)を使用して、Azure上でホストされているOpenAIの言語モデル（`gpt-4`、`gpt-4o`など）を提供します。

## Azure OpenAIドキュメント

- [Azure OpenAIドキュメント](https://learn.microsoft.com/en-us/azure/ai-services/openai/)

## Maven依存関係

### 通常のJava

`langchain4j-azure-open-ai`ライブラリはMaven Centralで利用可能です。

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-open-ai</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

### Spring Boot

Spring Bootスターターを使用すると、`langchain4j-azure-open-ai`ライブラリをより簡単に設定できます。

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-open-ai-spring-boot-starter</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

:::note
Azure OpenAIモデルを使用する前に、それらを[デプロイ](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource?pivots=web-portal)する必要があります。
:::

## APIキーを使用した`AzureOpenAiChatModel`の作成

### 通常のJava

```java
ChatModel model = AzureOpenAiChatModel.builder()
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .deploymentName("gpt-4o")
        ...
        .build();
```

これにより、デフォルトのモデルパラメータ（例：温度`0.7`など）と`AZURE_OPENAI_KEY`環境変数に格納されたAPIキーを持つ`AzureOpenAiChatModel`のインスタンスが作成されます。
デフォルトのモデルパラメータは、ビルダーで値を提供することでカスタマイズできます。

### Spring Boot

`application.properties`に追加：
```properties
langchain4j.azure-open-ai.chat-model.endpoint=${AZURE_OPENAI_URL}
langchain4j.azure-open-ai.chat-model.service-version=...
langchain4j.azure-open-ai.chat-model.api-key=${AZURE_OPENAI_KEY}
langchain4j.azure-open-ai.chat-model.non-azure-api-key=${OPENAI_API_KEY}
langchain4j.azure-open-ai.chat-model.deployment-name=gpt-4o
langchain4j.azure-open-ai.chat-model.max-tokens=...
langchain4j.azure-open-ai.chat-model.temperature=...
langchain4j.azure-open-ai.chat-model.top-p=
langchain4j.azure-open-ai.chat-model.logit-bias=...
langchain4j.azure-open-ai.chat-model.user=
langchain4j.azure-open-ai.chat-model.stop=...
langchain4j.azure-open-ai.chat-model.presence-penalty=...
langchain4j.azure-open-ai.chat-model.frequency-penalty=...
langchain4j.azure-open-ai.chat-model.seed=...
langchain4j.azure-open-ai.chat-model.strict-json-schema=...
langchain4j.azure-open-ai.chat-model.timeout=...
langchain4j.azure-open-ai.chat-model.max-retries=...
langchain4j.azure-open-ai.chat-model.log-requests-and-responses=...
langchain4j.azure-open-ai.chat-model.user-agent-suffix=
langchain4j.azure-open-ai.chat-model.custom-headers=...
```
上記のパラメータの一部の説明は[こちら](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#completions)で確認できます。

この設定により、`AzureOpenAiChatModel`ビーン（デフォルトのモデルパラメータを持つ）が作成され、
[AIサービス](/tutorials/spring-boot-integration/#langchain4j-spring-boot-starter)で使用するか、
必要な場所でオートワイヤすることができます。例えば：

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

## Azure認証情報を使用した`AzureOpenAiChatModel`の作成

APIキーにはいくつかのセキュリティ問題（コミットされる可能性、共有される可能性など）があります。
セキュリティを向上させたい場合は、代わりにAzure認証情報を使用することをお勧めします。
そのためには、プロジェクトに`azure-identity`依存関係を追加する必要があります。

```xml
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-identity</artifactId>
    <scope>compile</scope>
</dependency>
```

その後、[DefaultAzureCredentialBuilder](https://learn.microsoft.com/en-us/java/api/com.azure.identity.defaultazurecredentialbuilder?view=azure-java-stable) APIを使用して`AzureOpenAiChatModel`を作成できます：

```java
ChatModel model = AzureOpenAiChatModel.builder()
        .deploymentName("gpt-4o")
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .tokenCredential(new DefaultAzureCredentialBuilder().build())
        .build();
```

:::note
マネージドIDを使用してモデルをデプロイする必要があることに注意してください。詳細については、[Azure CLIデプロイメントスクリプト](https://github.com/langchain4j/langchain4j-examples/blob/main/azure-open-ai-examples/src/main/script/deploy-azure-openai-security.sh)を確認してください。
:::

## ツール

ツール（「関数呼び出し」とも呼ばれる）はサポートされており、モデルがJavaコード内のメソッドを呼び出すことを可能にします。並列ツール呼び出しも含まれます。
「関数呼び出し」はOpenAIのドキュメントで[こちら](https://platform.openai.com/docs/guides/function-calling)に説明されています。

:::note
LangChain4jでの「関数呼び出し」の使用方法に関する完全なチュートリアルは[こちら](/tutorials/tools/)にあります。
:::

関数は`ToolSpecification`クラスを使用して指定できますが、次の例のように`@Tool`アノテーションを使用するとより簡単です：

```java
class StockPriceService {

    private Logger log = Logger.getLogger(StockPriceService.class.getName());

    @Tool("Get the stock price of a company by its ticker")
    public double getStockPrice(@P("Company ticker") String ticker) {
        log.info("Getting stock price for " + ticker);
        if (Objects.equals(ticker, "MSFT")) {
            return 400.0;
        } else {
            return 0.0;
        }
    }
}
```

Then, you can use the `StockPriceService` in an AI `Assistant` like this:

```java

interface Assistant {
    String chat(String userMessage);
}

public class Demo {
    String functionCalling(Model model) {
        String question = "Is the current Microsoft stock higher than $450?";
        StockPriceService stockPriceService = new StockPriceService();

        Assistant assistant = AiServices.builder(Assistant.class)
                .chatModel(model)
                .tools(stockPriceService)
                .build();

        String answer = assistant.chat(question);

        model.addAttribute("answer", answer);
        return "demo";
    }
}
```

## Structured Outputs

Structured Outputs ensure that a model's responses adhere to a JSON schema.

:::note
The documentation for using Structured Outputs in LangChain4j is available [here](/tutorials/structured-outputs), and in the section below you will find Azure OpenAI-specific information.
:::

The model needs to be configured with the `strictJsonSchema` parameter set to `true` in order to force the adherence to a JSON Schema:

```java
ChatModel model = AzureOpenAiChatModel.builder()
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .deploymentName("gpt-4o")
        .strictJsonSchema(true)
        .supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA))
        .build();
```

:::note
If `strictJsonSchema` is set to `false` and you provide a JSON Schema, the model will still try to generate a response that adheres to the schema, but it will not fail if the response does not adhere to the schema. One reason to do this is for better performance.
:::

You can then use this model either with the high level `Assistant` API or the low level `ChatModel` API, as detailed below.
When using it with the high level `Assistant` API, configure `supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA))` to enable structured outputs with a JSON schema.

### Using the high level `Assistant` API

Like for Tools in the previous section, Structured Output can be automatically used with an AI `Assistant`:

```java

interface PersonAssistant {
    Person extractPerson(String message);
}

class Person {
    private final String name;
    private final List<String> favouriteColors;

    public Person(String name, List<String> favouriteColors) {
        this.name = name;
        this.favouriteColors = favouriteColors;
    }

    public String getName() {
        return name;
    }

    public List<String> getFavouriteColors() {
        return favouriteColors;
    }
}
```

This `Assistant` will make sure that the response adheres to a JSON schema corresponding in the `Person` class, like in the following example:

```java
String question = "Julien likes the colors blue, white and red";

PersonAssistant assistant = AiServices.builder(PersonAssistant.class)
                .chatModel(chatModel)
                .build();

Person person = assistant.extractPerson(question);
```

### Using the low level `ChatModel` API

This is a similar process to the high level API, but this time the JSON schema needs to be configured manually, as well as mapping the JSON response to a Java object.

Once the model is configured, the JSON Schema has to be specified in the `ChatRequest` object for each request.
The model will then generate a response that adheres to the schema, like in this example:

```java
ChatRequest chatRequest = ChatRequest.builder()
    .messages(UserMessage.from("Julien likes the colors blue, white and red"))
    .responseFormat(ResponseFormat.builder()
        .type(JSON)
        .jsonSchema(JsonSchema.builder()
            .name("Person")
            .rootElement(JsonObjectSchema.builder()
                .addStringProperty("name")
                .addProperty("favouriteColors", JsonArraySchema.builder()
                    .items(new JsonStringSchema())
                    .build())
                .required("name", "favouriteColors")
                .build())
            .build())
        .build())
    .build();

String answer = chatModel.chat(chatRequest).aiMessage().text();
```

In this example, the `answer` will be:
```json
{
  "name": "Julien",
  "favouriteColors": ["blue", "white", "red"]
}
```

This JSON response will then typically be deserialized into a Java object, using a library like Jackson.

## Creating `AzureOpenAiStreamingChatModel` to stream results

This implementation is similar to the `AzureOpenAiChatModel` above, but it streams the response token by token.

### Plain Java
```java
StreamingChatModel model = AzureOpenAiStreamingChatModel.builder()
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .deploymentName("gpt-4o")
        ...
        .build();
```

### Spring Boot
Add to the `application.properties`:
```properties
langchain4j.azure-open-ai.streaming-chat-model.endpoint=${AZURE_OPENAI_URL}
langchain4j.azure-open-ai.streaming-chat-model.service-version=...
langchain4j.azure-open-ai.streaming-chat-model.api-key=${AZURE_OPENAI_KEY}
langchain4j.azure-open-ai.streaming-chat-model.deployment-name=gpt-4o
langchain4j.azure-open-ai.streaming-chat-model.max-tokens=...
langchain4j.azure-open-ai.streaming-chat-model.temperature=...
langchain4j.azure-open-ai.streaming-chat-model.top-p=...
langchain4j.azure-open-ai.streaming-chat-model.logit-bias=...
langchain4j.azure-open-ai.streaming-chat-model.user=...
langchain4j.azure-open-ai.streaming-chat-model.stop=...
langchain4j.azure-open-ai.streaming-chat-model.presence-penalty=...
langchain4j.azure-open-ai.streaming-chat-model.frequency-penalty=...
langchain4j.azure-open-ai.streaming-chat-model.seed=...
langchain4j.azure-open-ai.streaming-chat-model.timeout=...
langchain4j.azure-open-ai.streaming-chat-model.max-retries=...
langchain4j.azure-open-ai.streaming-chat-model.log-requests-and-responses=...
langchain4j.azure-open-ai.streaming-chat-model.user-agent-suffix=...
langchain4j.azure-open-ai.streaming-chat-model.customHeaders=...
```

## Examples

- [Azure OpenAI Examples](https://github.com/langchain4j/langchain4j-examples/tree/main/azure-open-ai-examples/src/main/java)
- [AzureOpenAiSecurityExamples](https://github.com/langchain4j/langchain4j-examples/blob/main/azure-open-ai-examples/src/main/java/AzureOpenAiSecurityExamples.java) with its [Azure CLI deployment script](https://github.com/langchain4j/langchain4j-examples/blob/main/azure-open-ai-examples/src/main/script/deploy-azure-openai-security.sh)
