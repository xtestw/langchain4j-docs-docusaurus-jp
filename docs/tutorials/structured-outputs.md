---
sidebar_position: 11
---

# 構造化出力（Structured Outputs）

:::note
「Structured Outputs」という用語は多義的で、次の 2 つを指すことがあります。
- LLM が構造化フォーマットで出力を生成する一般的な能力（本ページで扱う内容）
- OpenAI の [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) 機能。
これはレスポンス形式とツール（関数呼び出し）の両方に適用されます。
:::

多くの LLM および LLM プロバイダーは、構造化フォーマット（通常は JSON）での出力生成をサポートしています。
これらの出力は Java オブジェクトに容易にマッピングでき、アプリケーションの他の部分で利用できます。

たとえば、次のような `Person` クラスがあるとします。
```java
record Person(String name, int age, double height, boolean married) {
}
```
架空のキャラクターを記述した非構造化テキストから `Person` オブジェクトを抽出することを目指します。
```
Eldwin Brightblade is 412 years old and serves as court wizard in the kingdom of Aelyria.
He stands 1.65 meters tall and is known for his flowing white beard.
Currently unmarried, he devotes his time to studying ancient runes.
```

現在、LLM と LLM プロバイダーに応じて、これを実現する方法は次の 3 通りあります
（信頼性の高い順）：
- [JSON Schema](/tutorials/structured-outputs#json-schema)
- [プロンプティング + JSON Mode](/tutorials/structured-outputs#prompting--json-mode)
- [プロンプティング](/tutorials/structured-outputs#prompting)


## JSON Schema
一部の LLM プロバイダー（現在は Amazon Bedrock、Azure OpenAI、Google AI Gemini、Mistral、Ollama、OpenAI）では、
望ましい出力に対して [JSON schema](https://json-schema.org/overview/what-is-jsonschema) を指定できます。
サポートされているすべての LLM プロバイダーは、[こちら](/integrations/language-models) の 「JSON Schema」列で確認できます。

リクエストで JSON schema が指定されると、LLM はその schema に沿った出力を生成することが期待されます。

:::note
JSON schema は LLM プロバイダー API へのリクエスト内の専用属性で指定される点に注意してください。
プロンプト（システムメッセージやユーザーメッセージなど）に自由形式の指示を含める必要はありません。
:::

LangChain4j は、低レベル `ChatModel` API
と高レベル AI Service API の両方で JSON Schema 機能をサポートしています。

### `ChatModel` で JSON Schema を使う

低レベル `ChatModel` API では、`ChatRequest` を作成する際に
LLM プロバイダー非依存の `ResponseFormat` と `JsonSchema` を使って JSON schema を指定できます。
```java
ResponseFormat responseFormat = ResponseFormat.builder()
        .type(JSON) // type can be either TEXT (default) or JSON
        .jsonSchema(JsonSchema.builder()
                .name("Person") // OpenAI requires specifying the name for the schema
                .rootElement(JsonObjectSchema.builder() // see [1] below
                        .addStringProperty("name")
                        .addIntegerProperty("age")
                        .addNumberProperty("height")
                        .addBooleanProperty("married")
                        .required("name", "age", "height", "married") // see [2] below
                        .build())
                .build())
        .build();

UserMessage userMessage = UserMessage.from("""
        Eldwin Brightblade is 412 years old and serves as court wizard in the kingdom of Aelyria.
        He stands 1.65 meters tall and is known for his flowing white beard.
        Currently unmarried, he devotes his time to studying ancient runes.
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
// OR
ChatModel chatModel = AzureOpenAiChatModel.builder()
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_API_KEY"))
        .deploymentName("gpt-4o-mini")
        .logRequestsAndResponses(true)
        .build();
// OR
ChatModel chatModel = GoogleAiGeminiChatModel.builder()
        .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
        .modelName("gemini-1.5-flash")
        .logRequestsAndResponses(true)
        .build();
// OR
ChatModel chatModel = OllamaChatModel.builder()
        .baseUrl("http://localhost:11434")
        .modelName("llama3.1")
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = MistralAiChatModel.builder()
        .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
        .modelName("mistral-small-latest")
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = WatsonxChatModel.builder()
        .baseUrl(System.getenv("WATSONX_URL"))
        .projectId(System.getenv("WATSONX_PROJECT_ID"))
        .apiKey(System.getenv("WATSONX_API_KEY"))
        .modelName("ibm/granite-4-h-small")
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = BedrockChatModel.builder()
        .modelId("us.anthropic.claude-haiku-4-5-20251001-v1:0")
        .logRequests(true)
        .logResponses(true)
        .build();

ChatResponse chatResponse = chatModel.chat(chatRequest);

String output = chatResponse.aiMessage().text();
System.out.println(output); // {"name":"Eldwin Brightblade","age":412,"height":1.65,"married":false}

Person person = new ObjectMapper().readValue(output, Person.class);
System.out.println(person); // Person[name=Eldwin Brightblade, age=412, height=1.65, married=false]
```
注意点:
- [1] - ほとんどの場合、ルート要素は `JsonObjectSchema` 型である必要があります。
ただし:
  - Amazon Bedrock、Azure OpenAI、Mistral、Ollama、OpenAI、OpenAI Official はルート要素として `JsonRawSchema` も許可します
  - Gemini はルート要素として `JsonEnumSchema` と `JsonArraySchema` も許可します
- [2] - 必須プロパティは明示的に指定する必要があります。そうでない場合はオプションと見なされます。

JSON schema の構造は `JsonSchemaElement` インターフェースで定義され、
次のサブタイプがあります。
- `JsonObjectSchema` - オブジェクト型用。
- `JsonStringSchema` - `String`、`char`/`Character` 型用。
- `JsonIntegerSchema` - `int`/`Integer`、`long`/`Long`、`BigInteger` 型用。
- `JsonNumberSchema` - `float`/`Float`、`double`/`Double`、`BigDecimal` 型用。
- `JsonBooleanSchema` - `boolean`/`Boolean` 型用。
- `JsonEnumSchema` - `enum` 型用。
- `JsonArraySchema` - 配列とコレクション（例: `List`、`Set`）用。
- `JsonReferenceSchema` - 再帰のサポート用（例: `Person` が `Set<Person> children` フィールドを持つ場合）。
- `JsonAnyOfSchema` - ポリモーフィズムのサポート用（例: `Shape` が `Circle` または `Rectangle`）。
- `JsonNullSchema` - nullable 型のサポート用。
- `JsonRawSchema` - 独自に完全定義した JSON schema を使う場合。

#### `JsonObjectSchema`

`JsonObjectSchema` はネストされたプロパティを持つオブジェクトを表します。
通常は `JsonSchema` のルート要素です。

`JsonObjectSchema` にプロパティを追加する方法はいくつかあります。
1. `properties(Map<String, JsonSchemaElement> properties)` メソッドで一度にすべてのプロパティを追加できます。
```java
JsonSchemaElement citySchema = JsonStringSchema.builder()
        .description("The city for which the weather forecast should be returned")
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
        .required("city") // required properties should be specified explicitly
        .build();
```

2. `addProperty(String name, JsonSchemaElement jsonSchemaElement)` メソッドで個別にプロパティを追加できます。
```java
JsonSchemaElement rootElement = JsonObjectSchema.builder()
        .addProperty("city", citySchema)
        .addProperty("temperatureUnit", temperatureUnitSchema)
        .required("city")
        .build();
```

3. `add{Type}Property(String name)` または `add{Type}Property(String name, String description)` メソッドのいずれかで個別にプロパティを追加できます。
```java
JsonSchemaElement rootElement = JsonObjectSchema.builder()
        .addStringProperty("city", "The city for which the weather forecast should be returned")
        .addEnumProperty("temperatureUnit", List.of("CELSIUS", "FAHRENHEIT"))
        .required("city")
        .build();
```

詳細は 
[JsonObjectSchema](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/model/chat/request/json/JsonObjectSchema.java)
の Javadoc を参照してください。

#### `JsonStringSchema`

`JsonStringSchema` を作成する例:
```java
JsonSchemaElement stringSchema = JsonStringSchema.builder()
        .description("The name of the person")
        .build();
```

#### `JsonIntegerSchema`

`JsonIntegerSchema` を作成する例:
```java
JsonSchemaElement integerSchema = JsonIntegerSchema.builder()
        .description("The age of the person")
        .build();
```

#### `JsonNumberSchema`

`JsonNumberSchema` を作成する例:
```java
JsonSchemaElement numberSchema = JsonNumberSchema.builder()
        .description("The height of the person")
        .build();
```

#### `JsonBooleanSchema`

`JsonBooleanSchema` を作成する例:
```java
JsonSchemaElement booleanSchema = JsonBooleanSchema.builder()
        .description("Is the person married?")
        .build();
```

#### `JsonEnumSchema`

`JsonEnumSchema` を作成する例:
```java
JsonSchemaElement enumSchema = JsonEnumSchema.builder()
        .description("Marital status of the person")
        .enumValues(List.of("SINGLE", "MARRIED", "DIVORCED"))
        .build();
```

#### `JsonArraySchema`

文字列の配列を定義する `JsonArraySchema` の作成例:
```java
JsonSchemaElement itemSchema = JsonStringSchema.builder()
        .description("The name of the person")
        .build();

JsonSchemaElement arraySchema = JsonArraySchema.builder()
        .description("All names of the people found in the text")
        .items(itemSchema)
        .build();
```

#### `JsonReferenceSchema`

`JsonReferenceSchema` は再帰のサポートに使えます。
```java
String reference = "person"; // reference should be unique withing the schema

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
`JsonReferenceSchema` は現在、Azure OpenAI、Mistral、OpenAI のみがサポートしています。
:::

#### `JsonAnyOfSchema`

`JsonAnyOfSchema` はポリモーフィズムのサポートに使えます。
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
        Extract information from the following text:
        1. A circle with a radius of 5
        2. A rectangle with a width of 10 and a height of 20
        """);

ChatRequest chatRequest = ChatRequest.builder()
        .messages(userMessage)
        .responseFormat(responseFormat)
        .build();

ChatResponse chatResponse = model.chat(chatRequest);

System.out.println(chatResponse.aiMessage().text()); // {"shapes":[{"radius":5},{"width":10,"height":20}]}
```

:::note
`JsonAnyOfSchema` は現在、OpenAI、Azure OpenAI、Google AI Gemini のみがサポートしています。
:::

#### `JsonRawSchema`

既存の schema 文字列から `JsonRawSchema` を作成する例:

```java
var rawSchema = """
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "city": {
            "type": "string"
        }
    },
    "required": ["city"],
    "additionalProperties": false
}
""";

JsonRawSchema schema = JsonRawSchema.from(rawSchema);
```

:::note
`JsonRawSchema` は現在、Amazon Bedrock、Azure OpenAI、Mistral、Ollama、OpenAI、OpenAI Official、Google AI Gemini のみがサポートしています。
Google AI Gemini については、特に [Response JSON Schema](/integrations/language-models/google-ai-gemini/#response-json-schema) の例を参照してください。
:::


#### 説明の追加

`JsonReferenceSchema` を除くすべての `JsonSchemaElement` サブタイプには `description` プロパティがあります。
LLM が望ましい出力を返さない場合は、説明を付けて
より詳しい指示や正しい出力の例を LLM に与えることができます。例:
```java
JsonSchemaElement stringSchema = JsonStringSchema.builder()
        .description("The name of the person, for example: John Doe")
        .build();
```

#### 制限事項

`ChatModel` で JSON Schema を使う場合、いくつかの制限があります。
- サポートされている Amazon Bedrock、Azure OpenAI、Google AI Gemini、Mistral、Ollama、OpenAI モデルでのみ動作します。
- OpenAI については、まだ[ストリーミングモード](/tutorials/ai-services#streaming)では動作しません。
Google AI Gemini、Mistral、Ollama では、モデルの作成/ビルド時に `responseSchema(...)` で JSON Schema を指定できます。
- `JsonReferenceSchema` と `JsonAnyOfSchema` は現在、Azure OpenAI、Mistral、OpenAI のみがサポートしています。


### AI Services で JSON Schema を使う

[AI Services](/tutorials/ai-services) を使うと、より簡単に、より少ないコードで同じことを実現できます。
```java
interface PersonExtractor {
    
    Person extractPersonFrom(String text);
}

ChatModel chatModel = OpenAiChatModel.builder() // see [1] below
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // see [2] below
        .strictJsonSchema(true) // see [2] below
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = AzureOpenAiChatModel.builder() // see [1] below
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_API_KEY"))
        .deploymentName("gpt-4o-mini")
        .strictJsonSchema(true)
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // see [3] below
        .logRequestsAndResponses(true)
        .build();
// OR
ChatModel chatModel = GoogleAiGeminiChatModel.builder() // see [1] below
        .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
        .modelName("gemini-1.5-flash")
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // see [4] below
        .logRequestsAndResponses(true)
        .build();
// OR
ChatModel chatModel = OllamaChatModel.builder() // see [1] below
        .baseUrl("http://localhost:11434")
        .modelName("llama3.1")
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // see [5] below
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = MistralAiChatModel.builder()
         .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
         .modelName("mistral-small-latest")
         .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // see [6] below
         .strictJsonSchema(true) // see [6] below
         .logRequests(true)
         .logResponses(true)
         .build();
// OR
ChatModel chatModel = WatsonxChatModel.builder()
        .baseUrl(System.getenv("WATSONX_URL"))
        .projectId(System.getenv("WATSONX_PROJECT_ID"))
        .apiKey(System.getenv("WATSONX_API_KEY"))
        .modelName("ibm/granite-4-h-small")
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // see [7] below
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = BedrockChatModel.builder()
        .modelId("us.anthropic.claude-haiku-4-5-20251001-v1:0")
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // see [8] below
        .logRequests(true)
        .logResponses(true)
        .build();

PersonExtractor personExtractor = AiServices.create(PersonExtractor.class, chatModel); // see [1] below

String text = """
        Eldwin Brightblade is 412 years old and serves as court wizard in the kingdom of Aelyria.
        He stands 1.65 meters tall and is known for his flowing white beard.
        Currently unmarried, he devotes his time to studying ancient runes.
        """;

Person person = personExtractor.extractPersonFrom(text);

System.out.println(person); // Person[name=Eldwin Brightblade, age=412, height=1.65, married=false]
```
注意点:
- [1] - Quarkus または Spring Boot アプリケーションでは、`ChatModel` と AI Service を明示的に作成する必要はありません。
これらの bean は自動的に作成されます。詳細:
[Quarkus](https://docs.quarkiverse.io/quarkus-langchain4j/dev/ai-services.html)、
[Spring Boot](https://docs.langchain4j.dev/tutorials/spring-boot-integration#spring-boot-starter-for-declarative-ai-services)。
- [2] - OpenAI で JSON Schema 機能を有効にするために必要です。詳細は[こちら](/integrations/language-models/open-ai#structured-outputs-for-response-format)。
- [3] - [Azure OpenAI](/integrations/language-models/azure-open-ai) で JSON Schema 機能を有効にするために必要です。
- [4] - [Google AI Gemini](/integrations/language-models/google-ai-gemini) で JSON Schema 機能を有効にするために必要です。
- [5] - [Ollama](/integrations/language-models/ollama) で JSON Schema 機能を有効にするために必要です。
- [6] - [Mistral](/integrations/language-models/mistral-ai) で JSON Schema 機能を有効にするために必要です。
- [7] - [watsonx.ai](/integrations/language-models/watsonx) で JSON Schema 機能を有効にするために必要です。
- [8] - [Amazon Bedrock](/integrations/language-models/amazon-bedrock) で JSON Schema 機能を有効にするために必要です。

次の条件がすべて満たされる場合:
- AI Service メソッドが POJO を返す
- 使用する `ChatModel` が JSON Schema 機能を[サポート](https://docs.langchain4j.dev/integrations/language-models/)している
- 使用する `ChatModel` で JSON Schema 機能が有効になっている

指定された戻り値の型に基づいて、`JsonSchema` 付きの `ResponseFormat` が自動生成されます。

:::note
`ChatModel` を設定する際は、JSON Schema 機能を明示的に有効にしてください。
デフォルトでは無効です。
:::

生成される `JsonSchema` の `name` は戻り値型の単純名（`getClass().getSimpleName()`）です。
この例では "Person" です。

LLM が応答すると、出力はオブジェクトに解析され、AI Service メソッドから返されます。

サポートされているユースケースの多くの例は
[こちら](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/test/java/dev/langchain4j/service/AiServicesWithJsonSchemaIT.java)
および [こちら](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/test/java/dev/langchain4j/service/AiServicesWithJsonSchemaWithDescriptionsIT.java)
にあります。

#### 必須とオプション

デフォルトでは、生成される `JsonSchema` 内のすべてのフィールドとサブフィールドは**_オプション_**と見なされます。
これは、十分な情報がない場合に LLM が幻覚を起こし、合成データでフィールドを埋めがちだからです
（例: 名前が欠けているときに "John Doe" を使う）。

:::note
プリミティブ型（例: `int`、`boolean` など）のオプションフィールドについて、
LLM が値を提供しない場合はデフォルト値で初期化される点に注意してください
（例: `int` は `0`、`boolean` は `false` など）。
:::

:::note
厳密モード（`strictJsonSchema(true)`）がオンでも、
オプションの `enum` フィールドは依然として幻覚値で埋められる可能性がある点に注意してください。
:::

フィールドを必須にするには、`@JsonProperty(required = true)` でアノテーションを付けます。
```java
record Person(@JsonProperty(required = true) String name, String surname) {
}

interface PersonExtractor {
    
    Person extractPersonFrom(String text);
}
```

:::note
[ツール](/tutorials/tools) と併用する場合、
デフォルトですべてのフィールドとサブフィールドは**_必須_**と見なされる点に注意してください。
:::

#### 説明の追加

LLM が望ましい出力を返さない場合、クラスとフィールドに `@Description` を付けて
より詳しい指示や正しい出力の例を LLM に与えることができます。例:
```java
@Description("a person")
record Person(@Description("person's first and last name, for example: John Doe") String name,
              @Description("person's age, for example: 42") int age,
              @Description("person's height in meters, for example: 1.78") double height,
              @Description("is person married or not, for example: false") boolean married) {
}
```

:::note
`enum` 値に付けた `@Description` は**_効果がなく_**、生成される JSON schema に
**_含まれない_**点に注意してください。
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

#### ポリモーフィック型

AI Service メソッドはポリモーフィック型を返せます。つまり、実行時に LLM が具象サブタイプを
決定する基底型です。次の 2 つの形式がサポートされています。

- **sealed インターフェースと sealed クラス** — アノテーション不要。サブタイプは
  `Class.getPermittedSubclasses()` で検出されます。
- **通常の抽象クラスとインターフェース** — Jackson の `@JsonSubTypes` で
  サブタイプを明示的に宣言する必要があります。

ポリモーフィックな戻り値型は、型そのもの、コレクション（`List<T>`、`Set<T>`）、
他の POJO にネストされたフィールド、およびサブタイプが基底型をフィールドとして含む再帰的階層
（例: `BinaryOp(left: ExpressionNode, right: ExpressionNode)`、
ここで `ExpressionNode` は sealed な基底）で動作します。

各サブタイプには識別子プロパティ（デフォルトは `"type"`）が追加され、LLM が
どの具象型を生成したかを伝えられるようになります。パーサーはその後、
正しいサブタイプへ自動的にディスパッチします。

**sealed インターフェースとクラス — アノテーション不要:**

```java
sealed interface Animal permits Dog, Cat {}

record Dog(String name, String breed) implements Animal {}

record Cat(String name, boolean indoor) implements Animal {}

interface AnimalExtractor {

    Animal extractAnimalFrom(String text);
}
```

LLM には `Dog` と `Cat` に対する `anyOf` 付き schema が示され、各オプションは
`type` プロパティに単純クラス名を出力するよう制約されます。次の入力がある場合:

```
Rex is a Labrador.
```

LLM は `{"value":{"type":"Dog","name":"Rex","breed":"Labrador"}}` を出力し、これが解析されて
`Dog` インスタンスに戻ります。

:::note
多くの LLM プロバイダーはルートに `anyOf` を持つ JSON schema をサポートしないため、
schema はポリモーフィックな選択を `value` プロパティ（コレクションの場合は `values`）の下にラップします。
このラッパーは実装詳細です。AI Service メソッドは引き続きラップされていないサブタイプを返します。
:::

**ポリモーフィック型のコレクション:**

```java
interface AnimalsExtractor {

    List<Animal> extractAnimalsFrom(String text);
}
```

**別の POJO 内のポリモーフィックフィールド:**

```java
record Owner(String name, Animal pet) {}

interface OwnerExtractor {

    Owner extractOwnerFrom(String text);
}
```

**Jackson `@JsonSubTypes` / `@JsonTypeInfo`** もサポートされており、ワイヤ名を
Java クラス名から切り離せます。

```java
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "kind")
@JsonSubTypes({
    @JsonSubTypes.Type(value = Square.class, name = "square"),
    @JsonSubTypes.Type(value = Circle.class, name = "circle")
})
interface Shape {}

class Square implements Shape { double side; }

class Circle implements Shape { double radius; }
```

識別子値の解決順序:
1. 基底型上の `@JsonSubTypes.Type(name = "...")`
2. サブタイプ上の `@JsonTypeName`
3. `Class.getSimpleName()`（デフォルト）

したがって、基底型上で宣言したくない場合、`@JsonTypeName` はワイヤ名を設定する便利な方法です。

```java
sealed interface Bird permits Eagle, Sparrow {}

@JsonTypeName("bird_eagle")
record Eagle(double wingspanMeters) implements Bird {}

@JsonTypeName("bird_sparrow")
record Sparrow(boolean migratory) implements Bird {}
```

LLM は単純クラス名（`"Eagle"`/`"Sparrow"`）ではなく、識別子値として
`"bird_eagle"` / `"bird_sparrow"` を見ます。

**サポートされる `@JsonTypeInfo` 設定:**

| 属性 | サポートされる値 |
|---|---|
| `use` | `Id.NAME`、`Id.SIMPLE_NAME` |
| `include` | `As.PROPERTY`（デフォルト）、`As.EXISTING_PROPERTY` |
| `property` | 任意の明示値。空白の場合はデフォルトで `"@type"` |
| `defaultImpl` | 任意の具象サブクラス — LLM の識別子が欠落または不明なときに使用 |
| `visible` | `true` の場合、デシリアライズ後の bean に識別子フィールドを残す（フィールド衝突チェックも迂回） |

それ以外（例: `Id.CLASS`、`As.WRAPPER_OBJECT`）は schema 生成時に
`UnsupportedFeatureException` で拒否されます。

**幻覚耐性のための `defaultImpl`:**

```java
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, defaultImpl = UnknownTool.class)
@JsonSubTypes({
    @JsonSubTypes.Type(value = Hammer.class, name = "hammer"),
    @JsonSubTypes.Type(value = Wrench.class, name = "wrench")
})
interface Tool {}
```

LLM が未知の識別子（例: `"saw"`）を出力するか完全に省略した場合、パーサーは
失敗せずに `UnknownTool` を返すため、コード側で幻覚を検出して処理できます。

**説明の追加:**

基底型および/またはサブタイプに `@Description` を付けて LLM を誘導できます。
基底型の説明は `anyOf` 要素に付き、各サブタイプの説明は個別のオプションに付きます。

```java
@Description("A pet that lives in your home")
sealed interface Pet permits Hamster, Parrot {}

@Description("A small caged rodent kept as a pet")
record Hamster(String name, double weightGrams) implements Pet {}

@Description("A talking bird that can mimic human speech")
record Parrot(String name, int vocabulary) implements Pet {}
```

`@Description` を省略すると、説明は単純クラス名
（例: `"Hamster"`）にフォールバックし、LLM は各オプションのラベルを得られます。

**再帰的ポリモーフィック型:**

サブタイプがそのフィールドとして基底型を含むポリモーフィック基底も動作します。

```java
sealed interface ExpressionNode permits Literal, BinaryOp {}

record Literal(int value) implements ExpressionNode {}

record BinaryOp(String operator, ExpressionNode left, ExpressionNode right) implements ExpressionNode {}
```

再帰的ポリモーフィック schema には `$ref` / `$defs` をサポートするモデルが必要です
（現在は Azure OpenAI、Mistral、OpenAI）。

**識別子フィールドの衝突:**

サブタイプが識別子と同じ名前のフィールドを宣言している場合（例: sealed のみの基底上の `type` フィールド）、
schema 生成は明確なメッセージ付きで失敗します。修正オプション:

- フィールドをリネームする、または
- `@JsonTypeInfo(property = "...")` で別の識別子名を選ぶ、または
- フィールドが意図的にサブタイプの一部である場合は `@JsonTypeInfo(visible = true)` を設定する、または
- サブタイプ上のフィールドが識別子の情報源である場合は `@JsonTypeInfo(include = As.EXISTING_PROPERTY)` を使う。

#### 制限事項

AI Services で JSON Schema を使う場合、いくつかの制限があります。
- サポートされている Amazon Bedrock、Azure OpenAI、Google AI Gemini、Mistral、Ollama、OpenAI モデルでのみ動作します。
- `ChatModel` を設定する際、JSON Schema のサポートを明示的に有効にする必要があります。
- [ストリーミングモード](/tutorials/ai-services#streaming)では動作しません。
- すべての型がサポートされるわけではありません。サポート型の一覧は[こちら](/tutorials/structured-outputs#supported-types)。
- POJO には次を含められます。
  - スカラー/単純型（例: `String`、`int`/`Integer`、`double`/`Double`、`boolean`/`Boolean` など）
  - `enum`
  - ネストされた POJO
  - `List<T>`、`Set<T>`、`T[]`（`T` はスカラー、`enum`、または POJO）
  - ポリモーフィック型（sealed インターフェース/クラス、または Jackson `@JsonSubTypes` 付きの型）
- 再帰は現在、Azure OpenAI、Mistral、OpenAI のみがサポートしています。
- ポリモーフィック型には、JSON schema の `anyOf` をサポートする LLM が必要です。
- LLM が JSON Schema 機能をサポートしていない、または無効、または型がサポートされていない場合、
  AI Service は[プロンプティング](/tutorials/structured-outputs#prompting)にフォールバックします。


## プロンプティング + JSON Mode

詳細情報は近日公開予定です。
当面は[このセクション](/tutorials/ai-services#json-mode)
および[この記事](https://glaforge.dev/posts/2024/11/18/data-extraction-the-many-ways-to-get-llms-to-spit-json-content/)を参照してください。


## プロンプティング

プロンプティングを使う場合（JSON schema サポートが有効でない限りこれがデフォルトの選択です）、
AI Service はフォーマット指示を自動生成し、`UserMessage` の末尾に追加して
LLM が応答すべき形式を示します。
メソッドが返す前に、AI Service は LLM の出力を望ましい型に解析します。

追加された指示は[ログを有効にする](/tutorials/logging)ことで確認できます。

:::note
このアプローチはかなり信頼性が低いです。
LLM と LLM プロバイダーが上記の方法をサポートしている場合は、そちらを使う方が良いです。
:::


## サポートされる型

| 型                                                       | JSON Schema | プロンプティング |
|------------------------------------------------------------|-------------|-----------|
| `POJO`                                                     | ✅           | ✅         |
| `List<POJO>`、`Set<POJO>`                                  | ✅           | ❌         |
| `Enum`                                                     | ✅           | ✅         |
| `List<Enum>`、`Set<Enum>`                                  | ✅           | ✅         |
| `List<String>`、`Set<String>`                              | ✅           | ✅         |
| ポリモーフィック（sealed / `@JsonSubTypes`）、`List`/`Set` 含む | ✅           | ❌         |
| `boolean`、`Boolean`                                       | ✅           | ✅         |
| `int`、`Integer`                                           | ✅           | ✅         |
| `long`、`Long`                                             | ✅           | ✅         |
| `float`、`Float`                                           | ✅           | ✅         |
| `double`、`Double`                                         | ✅           | ✅         |
| `byte`、`Byte`                                             | ✅           | ✅         |
| `short`、`Short`                                           | ✅           | ✅         |
| `BigInteger`                                               | ✅           | ✅         |
| `BigDecimal`                                               | ✅           | ✅         |
| `Date`                                                     | ❌           | ✅         |
| `LocalDate`                                                | ❌           | ✅         |
| `LocalTime`                                                | ❌           | ✅         |
| `LocalDateTime`                                            | ❌           | ✅         |
| `Map<?, ?>`                                                | ❌           | ✅         |

いくつかの例:
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
- [Data extraction: The many ways to get LLMs to spit JSON content](https://glaforge.dev/posts/2024/11/18/data-extraction-the-many-ways-to-get-llms-to-spit-json-content/) by [Guillaume Laforge](https://glaforge.dev/about/)
