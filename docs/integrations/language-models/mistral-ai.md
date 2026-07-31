---
sidebar_position: 13
---

# MistralAI
[MistralAIドキュメント](https://docs.mistral.ai/)

## プロジェクトのセットアップ

プロジェクトにlangchain4jをインストールするには、次の依存関係を追加します：

Mavenプロジェクトの`pom.xml`の場合

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.18.1</version>
</dependency>

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-mistral-ai</artifactId>
    <version>1.18.1</version>
</dependency>
```

Gradleプロジェクトの`build.gradle`の場合

```groovy
implementation 'dev.langchain4j:langchain4j:1.18.1'
implementation 'dev.langchain4j:langchain4j-mistral-ai:1.18.1'
```
### APIキーの設定
プロジェクトにMistralAI APIキーを追加します。次のコードで```ApiKeys.java```クラスを作成できます

```java
public class ApiKeys {
    public static final String MISTRALAI_API_KEY = System.getenv("MISTRAL_AI_API_KEY");
}
```
APIキーを環境変数として設定することを忘れないでください。
```shell
export MISTRAL_AI_API_KEY=your-api-key #For Unix OS based
SET MISTRAL_AI_API_KEY=your-api-key #For Windows OS
```
MistralAI APIキーの取得方法の詳細は[こちら](https://docs.mistral.ai/#api-access)をご覧ください

### モデルの選択
`MistralAiChatModelName`および`MistralAiFimModelName`のJava列挙型を使用して、ユースケースに適したモデル名を見つけられます。
MistralAIは、パフォーマンスとコストのトレードオフに応じてモデルの選択と分類を更新しました。

| モデル名                | デプロイまたは利用可能な場所                                                                                                                  | 説明                                                                                                                                                                                                                                                                                                                     |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| open-mistral-7b       | - Mistral AI La Plateforme.<br/>- Cloud platforms (Azure, AWS, GCP).<br/>- Hugging Face.<br/>- Self-hosted (On-premise, IaaS, docker, local). | **OpenSource**<br/>Mistral AIがリリースした最初の密なモデルで、<br/> 実験、<br/> カスタマイズ、迅速な反復に最適です。 <br/><br/>最大トークン32K<br/><br/>Java Enum<br/>`MistralAiChatModelName.OPEN_MISTRAL_7B`                                                                                   |
| open-mixtral-8x7b     | - Mistral AI La Plateforme.<br/>- Cloud platforms (Azure, AWS, GCP).<br/>- Hugging Face.<br/>- Self-hosted (On-premise, IaaS, docker, local). | **OpenSource**<br/>多言語操作、<br/> コード生成とファインチューニングに最適。<br/> 優れたコスト/性能のトレードオフ。 <br/><br/>最大トークン32K<br/><br/>Java Enum<br/>`MistralAiChatModelName.OPEN_MIXTRAL_8x7B`                                                                               |
| open-mixtral-8x22b    | - Mistral AI La Plateforme.<br/>- Cloud platforms (Azure, AWS, GCP).<br/>- Hugging Face.<br/>- Self-hosted (On-premise, IaaS, docker, local). | **OpenSource**<br/>Mixtral-8x7Bの全機能に加え、強力な数学<br/> とコーディング、ネイティブな関数呼び出し対応 <br/><br/>最大トークン64K。<br/><br/>Java Enum<br/>`MistralAiChatModelName.OPEN_MIXTRAL_8X22B`                                                                                             |
| open-mistral-nemo     | - Mistral AI La Plateforme.<br/>- Cloud platforms (Azure, AWS, GCP).<br/>- Hugging Face.<br/>- Self-hosted (On-premise, IaaS, docker, local). | **OpenSource**<br/>NVIDIAと共同で構築された12Bモデル。<br/>推論、世界知識、コーディング精度は同サイズカテゴリで最先端です。<br/><br/>最大トークン128K。<br/><br/>Java Enum<br/>`MistralAiChatModelName.OPEN_MISTRAL_NEMO`                                                       |
| open-codestral-mamba  | - Mistral AI La Plateforme.<br/>- Cloud platforms (Azure, AWS, GCP).<br/>- Hugging Face.<br/>- Self-hosted (On-premise, IaaS, docker, local). | **OpenSource**<br/>コード生成に特化したMamba2言語モデル。<br/>高度なコードと推論能力で訓練され、transformerベースのSOTAモデルと同等の性能を発揮します。<br/><br/>最大トークン256K。<br/><br/>Java Enum<br/>`MistralAiFimModelName.OPEN_CODESTRAL_MAMBA`           |
| mistral-small-latest  | - Mistral AI La Plateforme.<br/>- Cloud platforms (Azure, AWS, GCP).                                                                          | **Commercial**<br/>一括で行える単純なタスクに適しています<br/>（分類、カスタマーサポート、またはテキスト生成）。<br/><br/>最大トークン32K<br/><br/>Java Enum<br/>`MistralAiChatModelName.MISTRAL_SMALL_LATEST`                                                                                           |
| mistral-medium-latest | - Mistral AI La Plateforme.<br/>- Cloud platforms (Azure, AWS, GCP).                                                                          | **Commercial**<br/>中程度の推論を必要とする中間タスクに最適<br/>（データ抽出、要約、<br/>メール作成、説明文作成）。<br/><br/>最大トークン32K<br/><br/>Java Enum<br/>`MistralAiChatModelName.MISTRAL_MEDIUM_LATEST`                                                            |
| mistral-large-latest  | - Mistral AI La Plateforme.<br/>- Cloud platforms (Azure, AWS, GCP).                                                                          | **Commercial**<br/>大きな推論能力を必要とする、または高度に専門化された複雑なタスクに最適<br/>（テキスト生成、コード生成、RAG、またはAgents）。<br/><br/>最大トークン128K<br/><br/>Java Enum<br/>`MistralAiChatModelName.MISTRAL_LARGE_LATEST`                                              |
| mistral-embed         | - Mistral AI La Plateforme.<br/>- Cloud platforms (Azure, AWS, GCP).                                                                          | **Commercial**<br/>テキストを1024次元の<br/> 埋め込み数値ベクトルに変換します。<br/>埋め込みモデルは検索とRAGアプリケーションを可能にします。<br/><br/>最大トークン8K<br/><br/>Java Enum<br/>`MistralAiEmbeddingModelName.MISTRAL_EMBED`                                                                   |
| codestral-latest      | - Mistral AI La Plateforme.<br/>- Cloud platforms (Azure, AWS, GCP).<br/>- Hugging Face.<br/>- Self-hosted (On-premise, IaaS, docker, local). | **OpenSource（非本番ライセンス）およびCommercial**<br/>fill-in-the-middleやコード補完を含むコード生成タスク向けに特別に設計・最適化された最先端の生成モデル。 <br/><br/>最大トークン32K<br/><br/>Java Enum<br/>`MistralAiFimModelName.CODESTRAL_LATEST` |

`@Deprecated`モデル：
- mistral-tiny (`@Deprecated`)
- mistral-small (`@Deprecated`)
- mistral-medium (`@Deprecated`)

各Mistralモデルの詳細とユースケースの種類は[こちら](https://docs.mistral.ai/#model-selection)をご覧ください

## チャット補完
チャットモデルを使用すると、会話データでファインチューニングされたモデルで人間らしい応答を生成できます。

### 同期処理
クラスを作成し、次のコードを追加します。

```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.mistralai.MistralAiChatModel;

public class HelloWorld {
    public static void main(String[] args) {
        ChatModel model = MistralAiChatModel.builder()
                .apiKey(ApiKeys.MISTRALAI_API_KEY)
                .modelName(MistralAiChatModelName.MISTRAL_SMALL_LATEST)
                .build();

        String response = model.chat("Say 'Hello World'");
        System.out.println(response);
    }
}
```
プログラムを実行すると、次のような出力のバリエーションが生成されます

```plaintext
Hello World! How can I assist you today?
```

### ストリーミング
クラスを作成し、次のコードを追加します。

```java
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.mistralai.MistralAiStreamingChatModel;
import dev.langchain4j.model.output.Response;

import java.util.concurrent.CompletableFuture;

public class HelloWorld {
    public static void main(String[] args) {
        MistralAiStreamingChatModel model = MistralAiStreamingChatModel.builder()
                .apiKey(ApiKeys.MISTRALAI_API_KEY)
                .modelName(MistralAiChatModelName.MISTRAL_SMALL_LATEST)
                .build();

        CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();         
        model.chat("Tell me a joke about Java", new StreamingChatResponseHandler() {
            
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
    }
}
```
LLMが生成するテキストチャンク（トークン）は、`onPartialResponse`メソッドで受け取れます。

以下の出力がリアルタイムでストリームされることがわかります。

```plaintext
"Why do Java developers wear glasses? Because they can't C#"
```

もちろん、MistralAIのチャット補完を[モデルパラメータの設定](/tutorials/model-parameters)や[チャットメモリ](/tutorials/chat-memory)などの他の機能と組み合わせて、より正確な応答を得ることもできます。

[チャットメモリ](/tutorials/chat-memory)では、チャット履歴を渡してLLMが以前の会話を把握する方法を学べます。この単純な例のようにチャット履歴を渡さない場合、LLMは以前の内容を知らないため、2つ目の質問（'What did I just ask?'）に正しく答えられません。

タイムアウト、モデルタイプ、モデルパラメータなど、多くのパラメータは裏側で設定されています。
[モデルパラメータの設定](/tutorials/model-parameters)では、これらのパラメータを明示的に設定する方法を学べます。

### 関数呼び出し
関数呼び出しにより、Mistralチャットモデル（[同期](#synchronous)および[ストリーミング](#streaming)）を外部ツールに接続できます。例えば、Mistral AIの関数呼び出し[チュートリアル](https://docs.mistral.ai/guides/function-calling/)に示されているように、`Tool`を呼び出して支払いトランザクションのステータスを取得できます。

<details>
<summary>サポートされているmistralモデルは？</summary>

:::note
現在、関数呼び出しは次のモデルで利用できます：

- Mistral Small `MistralAiChatModelName.MISTRAL_SMALL_LATEST`
- Mistral Large `MistralAiChatModelName.MISTRAL_LARGE_LATEST`
- Mixtral 8x22B `MistralAiChatModelName.OPEN_MIXTRAL_8X22B`
- Mistral Nemo `MistralAiChatModelName.OPEN_MISTRAL_NEMO`
:::
</details>

#### 1. `Tool`クラスと支払いデータの取得方法を定義する

次のような支払いトランザクションのデータセットがあると仮定します。実際のアプリケーションでは、データベースソースやREST APIクライアントを注入してデータを取得する必要があります。
```java
import java.util.*;

public class PaymentTransactionTool {

   private final Map<String, List<String>> paymentData = Map.of(
            "transaction_id", List.of("T1001", "T1002", "T1003", "T1004", "T1005"),
            "customer_id", List.of("C001", "C002", "C003", "C002", "C001"),
            "payment_amount", List.of("125.50", "89.99", "120.00", "54.30", "210.20"),
            "payment_date", List.of("2021.18.15", "2021.18.16", "2021.18.17", "2021.18.15", "2021.18.18"),
            "payment_status", List.of("Paid", "Unpaid", "Paid", "Paid", "Pending"));
   
    ...
}
```
次に、`Tool`クラスから支払いステータスと支払い日を取得する2つのメソッド`retrievePaymentStatus`と`retrievePaymentDate`を定義します。

```java
// Tool to be executed to get payment status
@Tool("Get payment status of a transaction") // function description
String retrievePaymentStatus(@P("Transaction id to search payment data") String transactionId) {
    return getPaymentData(transactionId, "payment_status");
}

// Tool to be executed to get payment date
@Tool("Get payment date of a transaction") // function description
String retrievePaymentDate(@P("Transaction id to search payment data") String transactionId) {
   return getPaymentData(transactionId, "payment_date");
}

private String getPaymentData(String transactionId, String data) {
    List<String> transactionIds = paymentData.get("transaction_id");
    List<String> paymentData = paymentData.get(data);

    int index = transactionIds.indexOf(transactionId);
    if (index != -1) {
        return paymentData.get(index);
    } else {
        return "Transaction ID not found";
    }
}
```
`dev.langchain4j.agent.tool.*`パッケージの`@Tool`アノテーションで関数の説明を、`@P`アノテーションでパラメータの説明を定義します。詳細は[こちら](/tutorials/tools#high-level-tool-api)

#### 2. チャットメッセージを送信する`agent`としてインターフェースを定義する

`PaymentTransactionAgent`インターフェースを作成します。

```java
import dev.langchain4j.service.SystemMessage;

interface PaymentTransactionAgent {
    @SystemMessage({
            "You are a payment transaction support agent.",
            "You MUST use the payment transaction tool to search the payment transaction data.",
            "If there a date convert it in a human readable format."
    })
    String chat(String userMessage);
}
```
#### 3. MistralAIチャットモデルと会話する`main`アプリケーションクラスを定義する

```java
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.mistralai.MistralAiChatModel;
import dev.langchain4j.model.mistralai.MistralAiChatModelName;
import dev.langchain4j.service.AiServices;

public class PaymentDataAssistantApp {

    ChatModel mistralAiModel = MistralAiChatModel.builder()
            .apiKey(System.getenv("MISTRAL_AI_API_KEY")) // Please use your own Mistral AI API key
            .modelName(MistralAiChatModelName.MISTRAL_LARGE_LATEST) // Also you can use MistralAiChatModelName.OPEN_MIXTRAL_8X22B as open source model
            .logRequests(true)
            .logResponses(true)
            .build();
    
    public static void main(String[] args) {
        // STEP 1: User specify tools and query
        PaymentTransactionTool paymentTool = new PaymentTransactionTool();
        String userMessage = "What is the status and the payment date of transaction T1005?";

        // STEP 2: User asks the agent and AiServices call to the functions
        PaymentTransactionAgent agent = AiServices.builder(PaymentTransactionAgent.class)
                .chatModel(mistralAiModel)
                .tools(paymentTool)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();
        
        // STEP 3: User gets the final response from the agent
        String answer = agent.chat(userMessage);
        System.out.println(answer);
    }
}
```

次のような回答が期待できます：

```shell
The status of transaction T1005 is Pending. The payment date is October 8, 2021.
```
### JSONモード
JSONモードを使用してJSON形式でレスポンスを取得することもできます。そのためには、`MistralAiChatModel`ビルダーまたは`MistralAiStreamingChatModel`ビルダーで`responseFormat`パラメータを`ResponseFormat.JSON`に設定する必要があります。

同期の例：

```java
ChatModel model = MistralAiChatModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY")) // Please use your own Mistral AI API key
                .responseFormat(ResponseFormat.JSON)
                .build();

String userMessage = "Return JSON with two fields: transactionId and status with the values T123 and paid.";
String json = model.chat(userMessage);

System.out.println(json); // {"transactionId":"T123","status":"paid"}
```

ストリーミングの例：

```java
StreamingChatModel streamingModel = MistralAiStreamingChatModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY")) // Please use your own Mistral AI API key
                .responseFormat(MistralAiResponseFormatType.JSON_OBJECT)
                .build();

String userMessage = "Return JSON with two fields: transactionId and status with the values T123 and paid.";

CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();

streamingModel.chat(userMessage, new StreamingChatResponseHandler() {

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

String json = futureResponse.get().content().text();

System.out.println(json); // {"transactionId":"T123","status":"paid"}
```                

### 構造化出力

構造化出力は、モデルのレスポンスがJSONスキーマに準拠することを保証します。

:::note
LangChain4jで構造化出力を使用するためのドキュメントは[こちら](/tutorials/structured-outputs)にあり、以下のセクションではMistralAI固有の情報を説明します。
:::

必要に応じて、リクエストでスキーマが提供されない場合のフォールバックとして使用されるデフォルトのJSONスキーマをモデルに設定できます。

```java
ChatModel model = MistralAiChatModel.builder()
        .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
        .modelName(MISTRAL_SMALL_LATEST)
        .supportedCapabilities(Set.of(Capability.RESPONSE_FORMAT_JSON_SCHEMA)) // Enable structured outputs
        .responseFormat(ResponseFormat.builder() // Set the fallback JSON Schema (optional)
                .type(ResponseFormatType.JSON)
                .jsonSchema(JsonSchema.builder().rootElement(JsonObjectSchema.builder()
                                .addProperty("name", JsonStringSchema.builder().build())
                                .addProperty("capital", JsonStringSchema.builder().build())
                                .addProperty(
                                        "languages",
                                        JsonArraySchema.builder()
                                                .items(JsonStringSchema.builder().build())
                                                .build())
                                .required("name", "capital", "languages")
                                .build())
                        .build())
                .build())
        .strictJsonSchema(true)
        .build();
```

### ガードレール
ガードレールは、有害または望ましくないコンテンツの生成を防ぐためにモデルの動作を制限する方法です。`MistralAiChatModel`ビルダーまたは`MistralAiStreamingChatModel`ビルダーで、オプションの`safePrompt`パラメータを設定できます。

同期の例：

```java
ChatModel model = MistralAiChatModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
                .safePrompt(true)
                .build();

String userMessage = "What is the best French cheese?";
String response = model.chat(userMessage);
```

ストリーミングの例：

```java
StreamingChatModel streamingModel = MistralAiStreamingChatModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
                .safePrompt(true)
                .build();

String userMessage = "What is the best French cheese?";

CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();

streamingModel.chat(userMessage, new StreamingChatResponseHandler() {
    
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
セーフプロンプトを有効にすると、メッセージの前に次の`@SystemMessage`が追加されます：

```plaintext
Always assist with care, respect, and truth. Respond with utmost utility yet securely. Avoid harmful, unethical, prejudiced, or negative content. Ensure replies promote fairness and positivity.
```

### リクエストごとのパラメータ

Mistral固有のオプション（`safePrompt`、`randomSeed`、`sendThinking`、`returnThinking`）は、
`MistralAiChatRequestParameters`を介してリクエストごとに設定でき、モデルビルダーで構成した値を上書きします。
これにより、共有のモデルインスタンス1つで呼び出しごとにこれらのオプションを変えられます。例えば、
あるリクエストでは`safePrompt`を有効にし別のリクエストでは無効にする、再現可能な補完のために`randomSeed`を設定する、
といったことが、2つ目のモデルを構築せずに可能です：

```java
ChatModel model = MistralAiChatModel.builder()
        .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
        .modelName("mistral-small-latest")
        .build();

MistralAiChatRequestParameters parameters = MistralAiChatRequestParameters.builder()
        .safePrompt(true)
        .randomSeed(42)
        .build();

ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("What is the best French cheese?"))
        .parameters(parameters)
        .build();

ChatResponse chatResponse = model.chat(chatRequest);
```

## 思考 / 推論

`MistralAiChatModel`と`MistralAiStreamingChatModel`の両方が、
[Magistral推論モデル](https://docs.mistral.ai/capabilities/reasoning/)による推論をサポートします。

次のパラメータで構成します：
- `returnThinking`：有効にすると、モデルが生成した推論テキストがAPIレスポンスから解析され、
  `AiMessage.thinking()`に格納されます。ストリーミングでは、`StreamingChatResponseHandler.onPartialThinking()`
  および`TokenStream.onPartialThinking()`コールバックも呼び出されます。
  デフォルトは無効です。
- `sendThinking`：有効にすると、以前のレスポンスの推論テキスト（`AiMessage.thinking()`に格納）が
  後続のLLMリクエストに含まれます。
  デフォルトは無効です。

推論を構成する例は次のとおりです：
```java
ChatModel model = MistralAiChatModel.builder()
        .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
        .modelName(MistralAiChatModelName.MAGISTRAL_MEDIUM_LATEST)
        .returnThinking(true)
        .sendThinking(true)
        .build();
```

## モデレーション

テキスト内の有害コンテンツを検出するために使用できる分類モデルです。

モデレーションの例：

```java
ModerationModel model = new MistralAiModerationModel.Builder()
    .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
    .modelName(MistralAiModerationModelName.MISTRAL_MODERATION_LATEST)
    .logRequests(true)
    .logResponses(false)
    .build();
// I want to check if the text contains harmful content
Moderation moderation = model.moderate("I want to kill them.").content();
```

## コード補完
Fill-in-the-Middle（FIM）モデルを使用するとコード補完を生成できます。ユーザーは`prompt`でコードの開始点を、オプションの`suffix`とオプションの`stop`で終了点を定義できます。

### FIM同期
チャット補完と同様に、FIMエンドポイントも動作します。次のコードを追加してテストできます。

```java
import dev.langchain4j.model.mistralai.MistralAiFimModel;
import dev.langchain4j.model.output.Response;

public class HelloWorld {
    public static void main(String[] args) {
        MistralAiFimModel codestral = MistralAiFimModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
                .modelName(MistralAiFimModelName.CODESTRAL_LATEST)
                .stop(List.of("}")) // must stop at the first occurrence of "}"
                .build();
        
        // I want to generate a code completion for a simple hello world program using MistralAI of LangChain4j framework.
        String codePrompt = """
                  public static void main(String[] args) {
                      // Create a function to multiply two numbers
                """;
        String suffix = """
                    System.out.println(result);
                  }
                """;

        // Asking to Codestral model to complete the code with given prompt and suffix
        Response<String> response = codestral.generate(prompt, suffix);
        
        System.out.println(
                String.format(
                        "%s%s%s",
                        prompt, // print code prompt (prefix)
                        response.content(), // print code filled-in-the-middle
                        suffix)); // print code suffix
    }
}
```
プログラムを実行すると、次の出力が印刷されます

```console
public static void main(String[] args) {
      // Create a function to multiply two numbers
      int result = multiply(5, 3);
      System.out.println(result);
  }
```

### FIMストリーミング

クラスを作成し、次のコードを追加します。

```java
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.language.StreamingLanguageModel;
import dev.langchain4j.model.mistralai.MistralAiStreamingFimModel;
import dev.langchain4j.model.output.Response;

import java.util.concurrent.CompletableFuture;

public class HelloWorld {
    public static void main(String[] args) {
        StreamingLanguageModel codestralStream = MistralAiStreamingFimModel.builder()
                .apiKey(ApiKeys.MISTRALAI_API_KEY)
                .modelName(MistralAiFimModelName.CODESTRAL_LATEST)
                .build();

        // I want to generate a code completion for a simple hello world program.
        String prompt = "public static void main(String[] args) {";

        CompletableFuture<Response<String>> futureResponse = new CompletableFuture<>();
        codestral.generate(prompt, new StreamingResponseHandler() {
            @Override
            public void onNext(String token) {
                System.out.print(token);
            }

            @Override
            public void onComplete(Response<String> response) {
                futureResponse.complete(response);
            }

            @Override
            public void onError(Throwable error) {
                futureResponse.completeExceptionally(error);
            }
        });

        futureResponse.join();
    }
}
```
LLMが生成する各テキストチャンク（トークン）は、onNextメソッドで受け取れます。

以下の出力がリアルタイムでストリームされることがわかります。

```console
public static void main(String[] args) {

        int[] arr = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        int sum = 0;

        for (int i = 0; i < arr.length; i++) {
            sum += arr[i];
        }

        System.out.println("Sum of all elements in the array: " + sum);
    }
}
``` 

## 生のHTTPレスポンスとServer-Sent Events（SSE）へのアクセス

`MistralAiChatModel`を使用する場合、生のHTTPレスポンスにアクセスできます：
```java
SuccessfulHttpResponse rawHttpResponse = ((MistralAiChatResponseMetadata) chatResponse.metadata()).rawHttpResponse();
System.out.println(rawHttpResponse.body());
System.out.println(rawHttpResponse.headers());
System.out.println(rawHttpResponse.statusCode());
```

`MistralAiStreamingChatModel`を使用する場合、生のHTTPレスポンス（上記参照）と生のServer-Sent Eventsにアクセスできます：
```java
List<ServerSentEvent> rawServerSentEvents = ((MistralAiChatResponseMetadata) chatResponse.metadata()).rawServerSentEvents();
System.out.println(rawServerSentEvents.get(0).data());
System.out.println(rawServerSentEvents.get(0).event());
```

## バッチ処理

`MistralAiBatchChatModel`はコアの`BatchChatModel`インターフェースを実装し、[Mistral Batch API](https://docs.mistral.ai/capabilities/batch/)経由で
多数のチャットリクエストを非同期処理します。価格は標準のトークン単価の50%です。バッチ内のすべてのリクエストは、
バッチモデルに構成された単一モデルに対して実行されます。

バッチを送信し、終端状態に達するまでポーリングしてから、リクエストごとの結果（送信順序を保持）を読み取ります：
```java
MistralAiBatchChatModel batchModel = MistralAiBatchChatModel.builder()
        .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
        .modelName("mistral-small-latest")
        .build();

BatchResponse<ChatResponse> submitted = batchModel.submit(new BatchRequest<>(List.of(
        ChatRequest.builder().messages(UserMessage.from("What is the capital of France?")).build(),
        ChatRequest.builder().messages(UserMessage.from("What is the capital of Germany?")).build())));

String batchId = submitted.batchId();

// Poll until the batch reaches a terminal state (SUCCEEDED, FAILED, CANCELLED, EXPIRED).
BatchResponse<ChatResponse> batch = batchModel.retrieve(batchId);
while (!batch.state().isTerminal()) {
    Thread.sleep(Duration.ofSeconds(30).toMillis());
    batch = batchModel.retrieve(batchId);
}

for (BatchItemResult<ChatResponse> result : batch.results()) {
    if (result.isSuccess()) {
        System.out.println(result.response().aiMessage().text());
    } else {
        System.out.println("Failed: " + result.error().message());
    }
}
```

実行中のバッチはキャンセルでき、既存のバッチはページネーション付きで一覧表示できます：
```java
batchModel.cancel(batchId);

BatchPage<ChatResponse> page = batchModel.list(new BatchPagination(20, null));
```

## 例
- [Mistral AIの例](https://github.com/langchain4j/langchain4j-examples/tree/main/mistral-ai-examples/src/main/java)


