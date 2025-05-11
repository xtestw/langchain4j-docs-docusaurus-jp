---
sidebar_position: 11
---

# 構造化出力

:::note
「構造化出力」という用語は多義的で、次の2つを指すことがあります：
- LLMが構造化フォーマットで出力を生成する一般的な能力（このページで説明するもの）
- OpenAIの[構造化出力](https://platform.openai.com/docs/guides/structured-outputs)機能。
  これはレスポンスフォーマットとツール（関数呼び出し）の両方に適用されます。
:::

多くのLLMとLLMプロバイダーは、通常JSONなどの構造化フォーマットでの出力生成をサポートしています。
これらの出力は簡単にJavaオブジェクトにマッピングでき、アプリケーションの他の部分で使用できます。

例えば、`Person`クラスがあるとします：
```java
record Person(String name, int age, double height, boolean married) {
}
```
次のような非構造化テキストから`Person`オブジェクトを抽出することを目指します：
```
Johnは42歳で、独立した生活を送っています。
彼は身長1.75メートルで、自信を持って振る舞います。
現在未婚で、個人的な目標や興味に集中する自由を楽しんでいます。
```

現在、LLMとLLMプロバイダーによって、これを実現する方法は3つあります
（最も信頼性の高いものから順に）：
- [JSONスキーマ](/tutorials/structured-outputs#json-schema)
- [プロンプト + JSONモード](/tutorials/structured-outputs#prompting--json-mode)
- [プロンプト](/tutorials/structured-outputs#prompting)


## JSONスキーマ
一部のLLMプロバイダー（現在はAzure OpenAI、Google AI Gemini、Mistral、OllamaおよびOpenAI）は、
希望する出力のための[JSONスキーマ](https://json-schema.org/overview/what-is-jsonschema)の指定を許可しています。
サポートされているすべてのLLMプロバイダーは「JSONスキーマ」列の[こちら](/integrations/language-models)で確認できます。

JSONスキーマがリクエストで指定されると、LLMはこのスキーマに準拠した出力を生成することが期待されます。

:::note
JSONスキーマはLLMプロバイダーのAPIへのリクエストの専用属性で指定され、
プロンプト（システムメッセージやユーザーメッセージなど）に自由形式の指示を含める必要がないことに注意してください。
:::

LangChain4jは低レベルの`ChatModel` APIと高レベルのAIサービスAPIの両方でJSONスキーマ機能をサポートしています。

### `ChatModel`でのJSONスキーマの使用

低レベルの`ChatModel` APIでは、`ChatRequest`を作成する際にLLMプロバイダーに依存しない
`ResponseFormat`と`JsonSchema`を使用してJSONスキーマを指定できます：
```java
ResponseFormat responseFormat = ResponseFormat.builder()
        .type(JSON) // タイプはTEXT（デフォルト）またはJSONのいずれか
        .jsonSchema(JsonSchema.builder()
                .name("Person") // OpenAIはスキーマの名前を指定する必要があります
                .rootElement(JsonObjectSchema.builder() // 以下の[1]を参照
                        .addStringProperty("name")
                        .addIntegerProperty("age")
                        .addNumberProperty("height")
                        .addBooleanProperty("married")
                        .required("name", "age", "height", "married") // 以下の[2]を参照
                        .build())
                .build())
        .build();

UserMessage userMessage = UserMessage.from("""
        Johnは42歳で、独立した生活を送っています。
        彼は身長1.75メートルで、自信を持って振る舞います。
        現在未婚で、個人的な目標や興味に集中する自由を楽しんでいます。
        """);

ChatRequest chatRequest = ChatRequest.builder()
        .responseFormat(responseFormat)
        .messages(userMessage)
        .build();

ChatModel chatModel = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .logRequests(true)
        .logResponses(true)
        .build();
// または
ChatModel chatModel = AzureOpenAiChatModel.builder()
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_API_KEY"))
        .deploymentName("gpt-4o-mini")
        .logRequestsAndResponses(true)
        .build();
// または
ChatModel chatModel = GoogleAiGeminiChatModel.builder()
        .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
        .modelName("gemini-1.5-flash")
        .logRequestsAndResponses(true)
        .build();
// または
ChatModel chatModel = OllamaChatModel.builder()
        .baseUrl("http://localhost:11434")
        .modelName("llama3.1")
        .logRequests(true)
        .logResponses(true)
        .build();
// または
ChatModel chatModel = MistralAiChatModel.builder()
        .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
        .modelName("mistral-small-latest")
        .logRequests(true)
        .logResponses(true)
        .build();

ChatResponse chatResponse = chatModel.chat(chatRequest);

String output = chatResponse.aiMessage().text();
System.out.println(output); // {"name":"John","age":42,"height":1.75,"married":false}

Person person = new ObjectMapper().readValue(output, Person.class);
System.out.println(person); // Person[name=John, age=42, height=1.75, married=false]
```
注意：
- [1] - ほとんどの場合、ルート要素は`JsonObjectSchema`型である必要がありますが、
Geminiは`JsonEnumSchema`と`JsonArraySchema`も許可しています。
- [2] - 必須プロパティは明示的に指定する必要があります。そうでない場合、オプションと見なされます。

JSONスキーマの構造は`JsonSchemaElement`インターフェースを使用して定義され、
以下のサブタイプがあります：
- `JsonObjectSchema` - オブジェクト型用。
- `JsonStringSchema` - `String`、`char`/`Character`型用。
- `JsonIntegerSchema` - `int`/`Integer`、`long`/`Long`、`BigInteger`型用。
- `JsonNumberSchema` - `float`/`Float`、`double`/`Double`、`BigDecimal`型用。
- `JsonBooleanSchema` - `boolean`/`Boolean`型用。
- `JsonEnumSchema` - `enum`型用。
- `JsonArraySchema` - 配列とコレクション（例：`List`、`Set`）用。
- `JsonReferenceSchema` - 再帰をサポートするため（例：`Person`が`Set<Person> children`フィールドを持つ場合）。
- `JsonAnyOfSchema` - ポリモーフィズムをサポートするため（例：`Shape`が`Circle`または`Rectangle`のいずれかになる場合）。
- `JsonNullSchema` - null許容型をサポートするため。

#### `JsonObjectSchema`

`JsonObjectSchema`はネストされたプロパティを持つオブジェクトを表します。
通常、これは`JsonSchema`のルート要素です。

`JsonObjectSchema`にプロパティを追加するには、いくつかの方法があります：
1. `properties(Map<String, JsonSchemaElement> properties)`メソッドを使用して、すべてのプロパティを一度に追加できます：
```java
JsonSchemaElement citySchema = JsonStringSchema.builder()
        .description("天気予報を返す都市")
        .build();

JsonSchemaElement temperatureUnitSchema = JsonEnumSchema.builder()
        .enumValues("CELSIUS", "FAHRENHEIT")
        .build();

Map<String, JsonSchemaElement> properties = Map.of(
        "city", citySchema,
        "temperatureUnit", temperatureUnitSchema
);

JsonSchemaElement rootElement = JsonObjectSchema.builder()
        .addProperties(properties)
        .required("city") // 必須プロパティは明示的に指定する必要があります
        .build();
```

2. `addProperty(String name, JsonSchemaElement jsonSchemaElement)`メソッドを使用して、プロパティを個別に追加できます：
```java
JsonSchemaElement rootElement = JsonObjectSchema.builder()
        .addProperty("city", citySchema)
        .addProperty("temperatureUnit", temperatureUnitSchema)
        .required("city")
        .build();
```

3. `add{Type}Property(String name)`または`add{Type}Property(String name, String description)`メソッドのいずれかを使用して、プロパティを個別に追加できます：
```java
JsonSchemaElement rootElement = JsonObjectSchema.builder()
        .addStringProperty("city", "天気予報を返す都市")
        .addEnumProperty("temperatureUnit", List.of("CELSIUS", "FAHRENHEIT"))
        .required("city")
        .build();
```

詳細については、
[JsonObjectSchema](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/model/chat/request/json/JsonObjectSchema.java)
のJavadocを参照してください。

#### `JsonStringSchema`

`JsonStringSchema`を作成する例：
```java
JsonSchemaElement stringSchema = JsonStringSchema.builder()
        .description("人物の名前")
        .build();
```

#### `JsonIntegerSchema`

`JsonIntegerSchema`を作成する例：
```java
JsonSchemaElement integerSchema = JsonIntegerSchema.builder()
        .description("人物の年齢")
        .build();
```

#### `JsonNumberSchema`

`JsonNumberSchema`を作成する例：
```java
JsonSchemaElement numberSchema = JsonNumberSchema.builder()
        .description("人物の身長")
        .build();
```

#### `JsonBooleanSchema`

`JsonBooleanSchema`を作成する例：
```java
JsonSchemaElement booleanSchema = JsonBooleanSchema.builder()
        .description("人物は結婚していますか？")
        .build();
```

#### `JsonEnumSchema`

`JsonEnumSchema`を作成する例：
```java
JsonSchemaElement enumSchema = JsonEnumSchema.builder()
        .description("人物の婚姻状況")
        .enumValues(List.of("SINGLE", "MARRIED", "DIVORCED"))
        .build();
```

#### `JsonArraySchema`

文字列の配列を定義する`JsonArraySchema`を作成する例：
```java
JsonSchemaElement itemSchema = JsonStringSchema.builder()
        .description("人物の名前")
        .build();

JsonSchemaElement arraySchema = JsonArraySchema.builder()
        .description("テキストで見つかったすべての人物の名前")
        .items(itemSchema)
        .build();
```

#### `JsonReferenceSchema`

`JsonReferenceSchema`は再帰をサポートするために使用できます：
```java
String reference = "person"; // 参照はスキーマ内で一意である必要があります

JsonObjectSchema jsonObjectSchema = JsonObjectSchema.builder()
        .addStringProperty("name")
        .addProperty("children", JsonArraySchema.builder()
                .items(JsonReferenceSchema.builder()
                        .reference(reference)
                        .build())
                .build())
        .required("name", "children")
        .definitions(Map.of(reference, JsonObjectSchema.builder()
                .addStringProperty("name")
                .addProperty("children", JsonArraySchema.builder()
                        .items(JsonReferenceSchema.builder()
                                .reference(reference)
                                .build())
                        .build())
                .required("name", "children")
                .build()))
        .build();
```

:::note
`JsonReferenceSchema`は現在、Azure OpenAI、MistralおよびOpenAIでのみサポートされています。
:::

#### `JsonAnyOfSchema`

`JsonAnyOfSchema`はポリモーフィズムをサポートするために使用できます：
```java
JsonSchemaElement circleSchema = JsonObjectSchema.builder()
        .addNumberProperty("radius")
        .build();

JsonSchemaElement rectangleSchema = JsonObjectSchema.builder()
        .addNumberProperty("width")
        .addNumberProperty("height")
        .build();

JsonSchemaElement shapeSchema = JsonAnyOfSchema.builder()
        .anyOf(circleSchema, rectangleSchema)
        .build();

JsonSchema jsonSchema = JsonSchema.builder()
        .name("Shapes")
        .rootElement(JsonObjectSchema.builder()
                .addProperty("shapes", JsonArraySchema.builder()
                        .items(shapeSchema)
                        .build())
                .required(List.of("shapes"))
                .build())
        .build();

ResponseFormat responseFormat = ResponseFormat.builder()
        .type(ResponseFormatType.JSON)
        .jsonSchema(jsonSchema)
        .build();

UserMessage userMessage = UserMessage.from("""
        次のテキストから情報を抽出してください：
        1. 半径5の円
        2. 幅10、高さ20の長方形
        """);

ChatRequest chatRequest = ChatRequest.builder()
        .messages(userMessage)
        .responseFormat(responseFormat)
        .build();

ChatResponse chatResponse = model.chat(chatRequest);

System.out.println(chatResponse.aiMessage().text()); // {"shapes":[{"radius":5},{"width":10,"height":20}]}
```

:::note
`JsonAnyOfSchema`は現在、OpenAIとAzure OpenAIでのみサポートされています。
:::

#### 説明の追加

`JsonReferenceSchema`を除くすべての`JsonSchemaElement`サブタイプには`description`プロパティがあります。
LLMが希望する出力を提供しない場合、LLMにより多くの指示と正しい出力の例を提供するために説明を追加できます：
```java
JsonSchemaElement stringSchema = JsonStringSchema.builder()
        .description("人物の名前、例：山田太郎")
        .build();
```

#### 制限事項

`ChatModel`でJSONスキーマを使用する場合、いくつかの制限があります：
- サポートされているAzure OpenAI、Google AI Gemini、Mistral、OllamaおよびOpenAIモデルでのみ動作します。
- OpenAIでは[ストリーミングモード](/tutorials/ai-services#streaming)ではまだ動作しません。
Google AI Gemini、MistralおよびOllamaの場合、JSONスキーマはモデルの作成/ビルド時に`responseSchema(...)`を介して指定できます。
- `JsonReferenceSchema`と`JsonAnyOfSchema`は現在、Azure OpenAI、MistralおよびOpenAIでのみサポートされています。


### AIサービスでのJSONスキーマの使用

[AIサービス](/tutorials/ai-services)を使用する場合、同じことをより簡単に、より少ないコードで実現できます：
```java
interface PersonExtractor {
    
    Person extractPersonFrom(String text);
}

ChatModel chatModel = OpenAiChatModel.builder() // 以下の[1]を参照
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA)) // 以下の[2]を参照
        .strictJsonSchema(true) // 以下の[2]を参照
        .logRequests(true)
        .logResponses(true)
        .build();
// または
ChatModel chatModel = AzureOpenAiChatModel.builder() // 以下の[1]を参照
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_API_KEY"))
        .deploymentName("gpt-4o-mini")
        .strictJsonSchema(true)
        .supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA)) // 以下の[3]を参照
        .logRequestsAndResponses(true)
        .build();
// または
ChatModel chatModel = GoogleAiGeminiChatModel.builder() // 以下の[1]を参照
        .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
        .modelName("gemini-1.5-flash")
        .responseFormat(ResponseFormat.JSON) // 以下の[4]を参照
        .logRequestsAndResponses(true)
        .build();
// または
ChatModel chatModel = OllamaChatModel.builder() // 以下の[1]を参照
        .baseUrl("http://localhost:11434")
        .modelName("llama3.1")
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // 以下の[5]を参照
        .logRequests(true)
        .logResponses(true)
        .build();
// または
ChatModel chatModel = MistralAiChatModel.builder()
         .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
         .modelName("mistral-small-latest")
         .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // 以下の[6]を参照
         .logRequests(true)
         .logResponses(true)
         .build();

PersonExtractor personExtractor = AiServices.create(PersonExtractor.class, chatModel); // 以下の[1]を参照

String text = """
        Johnは42歳で、独立した生活を送っています。
        彼は身長1.75メートルで、自信を持って振る舞います。
        現在未婚で、個人的な目標や興味に集中する自由を楽しんでいます。
        """;

Person person = personExtractor.extractPersonFrom(text);

System.out.println(person); // Person[name=John, age=42, height=1.75, married=false]
```
注意：
- [1] - QuarkusまたはSpring Bootアプリケーションでは、`ChatModel`とAIサービスを明示的に作成する必要はありません。
これらのBeanは自動的に作成されます。詳細情報：
[Quarkus向け](https://docs.quarkiverse.io/quarkus-langchain4j/dev/ai-services.html)、
[Spring Boot向け](https://docs.langchain4j.dev/tutorials/spring-boot-integration#spring-boot-starter-for-declarative-ai-services)。
- [2] - これはOpenAIのJSONスキーマ機能を有効にするために必要です。詳細は[こちら](/integrations/language-models/open-ai#structured-outputs-for-response-format)をご覧ください。
- [3] - これは[Azure OpenAI](/integrations/language-models/azure-open-ai)のJSONスキーマ機能を有効にするために必要です。
- [4] - これは[Google AI Gemini](/integrations/language-models/google-ai-gemini)のJSONスキーマ機能を有効にするために必要です。
- [5] - これは[Ollama](/integrations/language-models/ollama)のJSONスキーマ機能を有効にするために必要です。
- [6] - これは[Mistral](/integrations/language-models/mistral-ai)のJSONスキーマ機能を有効にするために必要です。

以下の条件がすべて満たされる場合：
- AIサービスメソッドがPOJOを返す
- 使用される`ChatModel`がJSONスキーマ機能を[サポート](https://docs.langchain4j.dev/integrations/language-models/)している
- 使用される`ChatModel`でJSONスキーマ機能が有効になっている

その場合、指定された戻り値の型に基づいて`ResponseFormat`と`JsonSchema`が自動的に生成されます。

:::note
JSONスキーマ機能はデフォルトで無効になっているため、
`ChatModel`を設定する際に明示的に有効にしてください。
:::

生成された`JsonSchema`の`name`は戻り値の型のシンプルな名前（`getClass().getSimpleName()`）です。
この場合は「Person」です。

LLMが応答すると、出力はオブジェクトに解析され、AIサービスメソッドから返されます。

サポートされているユースケースの多くの例は
[こちら](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/test/java/dev/langchain4j/service/AiServicesWithJsonSchemaIT.java)
と[こちら](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/test/java/dev/langchain4j/service/AiServicesWithJsonSchemaWithDescriptionsIT.java)で確認できます。

#### 必須とオプション

デフォルトでは、生成された`JsonSchema`のすべてのフィールドとサブフィールドは**_オプション_**と見なされます。
これは、LLMが十分な情報を持っていない場合に幻覚を起こし、合成データでフィールドを埋める傾向があるためです
（例：名前が欠けている場合に「山田太郎」を使用するなど）。

:::note
プリミティブ型（例：`int`、`boolean`など）のオプションフィールドは、
LLMがそれらの値を提供しない場合、デフォルト値（例：`int`の場合は`0`、`boolean`の場合は`false`など）で
初期化されることに注意してください。
:::

:::note
厳格モード（`strictJsonSchema(true)`）がオンの場合でも、
オプションの`enum`フィールドは幻覚的な値で埋められる可能性があることに注意してください。
:::

フィールドを必須にするには、`@JsonProperty(required = true)`でアノテーションを付けることができます：
```java
record Person(@JsonProperty(required = true) String name, String surname) {
}

interface PersonExtractor {
    
    Person extractPersonFrom(String text);
}
```

:::note
[ツール](/tutorials/tools)で使用する場合、すべてのフィールドとサブフィールドはデフォルトで**_必須_**と見なされることに注意してください。
:::

#### 説明の追加

LLMが希望する出力を提供しない場合、クラスとフィールドに`@Description`アノテーションを付けて、
LLMにより多くの指示と正しい出力の例を提供できます：
```java
@Description("人物")
record Person(@Description("人物の姓名、例：山田太郎") String name,
              @Description("人物の年齢、例：42") int age,
              @Description("人物の身長（メートル）、例：1.78") double height,
              @Description("人物が結婚しているかどうか、例：false") boolean married) {
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

#### 制限事項

AIサービスでJSONスキーマを使用する場合、いくつかの制限があります：
- サポートされているAzure OpenAI、Google AI Gemini、Mistral、OllamaおよびOpenAIモデルでのみ動作します。
- JSONスキーマのサポートは、`ChatModel`を設定する際に明示的に有効にする必要があります。
- [ストリーミングモード](/tutorials/ai-services#streaming)では動作しません。
- すべての型がサポートされているわけではありません。サポートされている型のリストは[こちら](/tutorials/structured-outputs#supported-types)をご覧ください。
- POJOには以下を含めることができます：
  - スカラー/シンプルな型（例：`String`、`int`/`Integer`、`double`/`Double`、`boolean`/`Boolean`など）
  - `enum`
  - ネストされたPOJO
  - `List<T>`、`Set<T>`、`T[]`（`T`はスカラー、`enum`またはPOJO）
- 再帰は現在、Azure OpenAI、MistralおよびOpenAIでのみサポートされています。
- ポリモーフィズムはまだサポートされていません。返されるPOJOとそのネストされたPOJOは具体的なクラスである必要があります。
インターフェースや抽象クラスはサポートされていません。
- LLMがJSONスキーマ機能をサポートしていない場合、または有効になっていない場合、または型がサポートされていない場合、
  AIサービスは[プロンプト](/tutorials/structured-outputs#prompting)にフォールバックします。


## プロンプト + JSONモード

詳細情報は近日公開予定です。
それまでの間、[このセクション](/tutorials/ai-services#json-mode)と
[この記事](https://glaforge.dev/posts/2024/11/18/data-extraction-the-many-ways-to-get-llms-to-spit-json-content/)をお読みください。


## プロンプト

プロンプトを使用する場合（JSONスキーマのサポートが有効になっていない限り、これがデフォルトの選択肢です）、
AIサービスは自動的にフォーマット指示を生成し、LLMが応答すべきフォーマットを示す`UserMessage`の末尾に追加します。
メソッドが戻る前に、AIサービスはLLMの出力を希望する型に解析します。

[ロギングを有効にする](/tutorials/logging)ことで、追加された指示を確認できます。

:::note
このアプローチはかなり信頼性が低いです。
LLMとLLMプロバイダーが上記の方法をサポートしている場合は、それらを使用する方が良いでしょう。
:::

## サポートされる型

| 型                            | JSONスキーマ | プロンプト |
|-------------------------------|-------------|-----------|
| `POJO`                        | ✅           | ✅         |
| `List<POJO>`, `Set<POJO>`     | ✅           | ❌         |
| `Enum`                        | ✅           | ✅         |
| `List<Enum>`, `Set<Enum>`     | ✅           | ✅         |
| `List<String>`, `Set<String>` | ✅           | ✅         |
| `boolean`, `Boolean`          | ✅           | ✅         |
| `int`, `Integer`              | ✅           | ✅         |
| `long`, `Long`                | ✅           | ✅         |
| `float`, `Float`              | ✅           | ✅         |
| `double`, `Double`            | ✅           | ✅         |
| `byte`, `Byte`                | ❌           | ✅         |
| `short`, `Short`              | ❌           | ✅         |
| `BigInteger`                  | ❌           | ✅         |
| `BigDecimal`                  | ❌           | ✅         |
| `Date`                        | ❌           | ✅         |
| `LocalDate`                   | ❌           | ✅         |
| `LocalTime`                   | ❌           | ✅         |
| `LocalDateTime`               | ❌           | ✅         |
| `Map<?, ?>`                   | ❌           | ✅         |

いくつかの例：
```java
record Person(String firstName, String lastName) {}

enum Sentiment {
    POSITIVE, NEGATIVE, NEUTRAL
}

interface Assistant {

    Person extractPersonFrom(String text);

    Set<Person> extractPeopleFrom(String text);

    Sentiment extractSentimentFrom(String text);

    List<Sentiment> extractSentimentsFrom(String text);

    List<String> generateOutline(String topic);

    boolean isSentimentPositive(String text);

    Integer extractNumberOfPeopleMentionedIn(String text);
}
```

## 関連チュートリアル
- [データ抽出：LLMにJSONコンテンツを出力させる多くの方法](https://glaforge.dev/posts/2024/11/18/data-extraction-the-many-ways-to-get-llms-to-spit-json-content/) by [Guillaume Laforge](https://glaforge.dev/about/)
