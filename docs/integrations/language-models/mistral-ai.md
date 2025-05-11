---
sidebar_position: 13
---

# MistralAI
[MistralAI ドキュメント](https://docs.mistral.ai/)

## プロジェクトのセットアップ

langchain4jをプロジェクトにインストールするには、以下の依存関係を追加してください：

Mavenプロジェクトの`pom.xml`

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.0.0-rc1</version>
</dependency>

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-mistral-ai</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

Gradleプロジェクトの`build.gradle`

```groovy
implementation 'dev.langchain4j:langchain4j:1.0.0-beta4'
implementation 'dev.langchain4j:langchain4j-mistral-ai:1.0.0-beta4'
```
### APIキーの設定
MistralAI APIキーをプロジェクトに追加するには、以下のコードで```ApiKeys.java```クラスを作成できます

```java
public class ApiKeys {
    public static final String MISTRALAI_API_KEY = System.getenv("MISTRAL_AI_API_KEY");
}
```
APIキーを環境変数として設定することを忘れないでください。
```shell
export MISTRAL_AI_API_KEY=your-api-key #Unix系OSの場合
SET MISTRAL_AI_API_KEY=your-api-key #Windows OSの場合
```
MistralAI APIキーの取得方法の詳細は[こちら](https://docs.mistral.ai/#api-access)で確認できます

### モデルの選択
`MistralAiChatModelName.class`列挙型クラスを使用して、ユースケースに適切なモデル名を見つけることができます。
MistralAIはパフォーマンスとコストのトレードオフに応じて、モデルの新しい選択と分類を更新しました。

| モデル名                    | デプロイメントまたは利用可能な場所                                                                                                                  | 説明                                                                                                                                                                                                                                        |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| open-mistral-7b              | - Mistral AI La Plateforme.<br/>- クラウドプラットフォーム (Azure, AWS, GCP).<br/>- Hugging Face.<br/>- セルフホスト (オンプレミス, IaaS, docker, ローカル). | **オープンソース**<br/>Mistral AIによってリリースされた最初の高密度モデルで、<br/>実験、カスタマイズ、迅速な反復に最適です。<br/><br/>最大トークン数 32K<br/><br/>Java Enum<br/>`MistralAiChatModelName.OPEN_MISTRAL_7B`                  |
| open-mixtral-8x7b            | - Mistral AI La Plateforme.<br/>- クラウドプラットフォーム (Azure, AWS, GCP).<br/>- Hugging Face.<br/>- セルフホスト (オンプレミス, IaaS, docker, ローカル). | **オープンソース**<br/>多言語操作、コード生成、微調整に理想的です。<br/>優れたコスト/パフォーマンスのトレードオフを提供します。<br/><br/>最大トークン数 32K<br/><br/>Java Enum<br/>`MistralAiChatModelName.OPEN_MIXTRAL_8x7B`                   |
| open-mixtral-8x22b           | - Mistral AI La Plateforme.<br/>- クラウドプラットフォーム (Azure, AWS, GCP).<br/>- Hugging Face.<br/>- セルフホスト (オンプレミス, IaaS, docker, ローカル). | **オープンソース**<br/>Mixtral-8x7Bのすべての機能に加えて、強力な数学能力と<br/>関数呼び出しが可能なコーディング能力を備えています<br/><br/>最大トークン数 64K.<br/><br/>Java Enum<br/>`MistralAiChatModelName.OPEN_MIXTRAL_8X22B`                                 |
| mistral-small-latest         | - Mistral AI La Plateforme.<br/>- クラウドプラットフォーム (Azure, AWS, GCP).                                                                          | **商用**<br/>一括処理可能な単純なタスク（分類、カスタマーサポート、<br/>テキスト生成）に適しています。<br/><br/>最大トークン数 32K<br/><br/>Java Enum<br/>`MistralAiChatModelName.MISTRAL_SMALL_LATEST`                               |
| mistral-medium-latest        | - Mistral AI La Plateforme.<br/>- クラウドプラットフォーム (Azure, AWS, GCP).                                                                          | **商用**<br/>中程度の推論を必要とする中間的なタスク（データ抽出、<br/>要約、メール作成、説明文の作成）に最適です。<br/><br/>最大トークン数 32K<br/><br/>Java Enum<br/>`MistralAiChatModelName.MISTRAL_MEDIUM_LATEST`              |
| mistral-large-latest         | - Mistral AI La Plateforme.<br/>- クラウドプラットフォーム (Azure, AWS, GCP).                                                                          | **商用**<br/>大きな推論能力を必要とする複雑なタスクや<br/>高度に専門化されたタスク（テキスト生成、コード生成、<br/>RAG、エージェント）に最適です。<br/><br/>最大トークン数 32K<br/><br/>Java Enum<br/>`MistralAiChatModelName.MISTRAL_LARGE_LATEST` |
| mistral-embed                | - Mistral AI La Plateforme.<br/>- クラウドプラットフォーム (Azure, AWS, GCP).                                                                          | **商用**<br/>テキストを1024次元の数値ベクトル（埋め込み）に<br/>変換します。埋め込みモデルは検索とRAGアプリケーションを<br/>可能にします。<br/><br/>最大トークン数 8K<br/><br/>Java Enum<br/>`MistralAiEmbeddingModelName.MISTRAL_EMBED`                     |

`@Deprecated`モデル：
- mistral-tiny (`@Deprecated`)
- mistral-small (`@Deprecated`)
- mistral-medium (`@Deprecated`)

各Mistralモデルのユースケースの詳細と種類は[こちら](https://docs.mistral.ai/#model-selection)で確認できます

## チャット補完
チャットモデルを使用すると、会話データで微調整されたモデルで人間のような応答を生成できます。

### 同期処理
クラスを作成し、以下のコードを追加します。

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
プログラムを実行すると、以下のような出力が生成されます

```plaintext
Hello World! How can I assist you today?
```

### ストリーミング
クラスを作成し、以下のコードを追加します。

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
LLMによって生成されるテキストの各チャンク（トークン）を`onPartialResponse`メソッドでリアルタイムに受け取ることができます。

以下の出力がリアルタイムでストリーミングされるのがわかります。

```plaintext
"Why do Java developers wear glasses? Because they can't C#"
```

もちろん、MistralAIチャット補完と[モデルパラメータの設定](/tutorials/model-parameters)や[チャットメモリ](/tutorials/chat-memory)などの他の機能を組み合わせて、より正確な応答を得ることができます。

[チャットメモリ](/tutorials/chat-memory)では、チャット履歴を渡す方法を学び、LLMが以前に何が言われたかを知ることができます。この単純な例のようにチャット履歴を渡さない場合、LLMは以前に何が言われたかを知らないため、2番目の質問（「私が今何を尋ねましたか？」）に正しく答えることができません。

タイムアウト、モデルタイプ、モデルパラメータなど、多くのパラメータが背後で設定されています。
[モデルパラメータの設定](/tutorials/model-parameters)では、これらのパラメータを明示的に設定する方法を学びます。

### 関数呼び出し
関数呼び出しを使用すると、Mistralチャットモデル（[同期](#同期処理)と[ストリーミング](#ストリーミング)）が外部ツールに接続できます。例えば、Mistral AI関数呼び出しの[チュートリアル](https://docs.mistral.ai/guides/function-calling/)に示されているように、支払い取引状況を取得するための`Tool`を呼び出すことができます。

<details>
<summary>サポートされているMistralモデルは何ですか？</summary>

:::note
現在、関数呼び出しは以下のモデルで利用可能です：

- Mistral Small `MistralAiChatModelName.MISTRAL_SMALL_LATEST`
- Mistral Large `MistralAiChatModelName.MISTRAL_LARGE_LATEST`
- Mixtral 8x22B `MistralAiChatModelName.OPEN_MIXTRAL_8X22B`
:::
</details>

#### 1. `Tool`クラスを定義し、支払いデータを取得する方法

このような支払い取引のデータセットがあるとします。実際のアプリケーションでは、データベースソースまたはREST APIクライアントを注入してデータを取得する必要があります。
```java
import java.util.*;

public class PaymentTransactionTool {

   private final Map<String, List<String>> paymentData = Map.of(
            "transaction_id", List.of("T1001", "T1002", "T1003", "T1004", "T1005"),
            "customer_id", List.of("C001", "C002", "C003", "C002", "C001"),
            "payment_amount", List.of("125.50", "89.99", "120.00", "54.30", "210.20"),
            "payment_date", List.of("2021-10-05", "2021-10-06", "2021-10-07", "2021-10-05", "2021-10-08"),
            "payment_status", List.of("Paid", "Unpaid", "Paid", "Paid", "Pending"));
   
    ...
}
```
次に、`Tool`クラスから支払い状況と支払い日を取得するための`retrievePaymentStatus`と`retrievePaymentDate`の2つのメソッドを定義しましょう。

```java
// 支払い状況を取得するために実行されるツール
@Tool("Get payment status of a transaction") // 関数の説明
String retrievePaymentStatus(@P("Transaction id to search payment data") String transactionId) {
    return getPaymentData(transactionId, "payment_status");
}

// 支払い日を取得するために実行されるツール
@Tool("Get payment date of a transaction") // 関数の説明
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
パッケージ`dev.langchain4j.agent.tool.*`の`@Tool`アノテーションを使用して関数の説明を定義し、`@P`アノテーションを使用してパラメータの説明を定義します。詳細は[こちら](/tutorials/tools#high-level-tool-api)を参照してください。

#### 2. チャットメッセージを送信するための`agent`としてインターフェースを定義する

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
#### 3. MistralAIチャットモデルとチャットするための`main`アプリケーションクラスを定義する

```java
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.mistralai.MistralAiChatModel;
import dev.langchain4j.model.mistralai.MistralAiChatModelName;
import dev.langchain4j.service.AiServices;

public class PaymentDataAssistantApp {

    ChatModel mistralAiModel = MistralAiChatModel.builder()
            .apiKey(System.getenv("MISTRAL_AI_API_KEY")) // 自分のMistral AI APIキーを使用してください
            .modelName(MistralAiChatModelName.MISTRAL_LARGE_LATEST) // オープンソースモデルとしてMistralAiChatModelName.OPEN_MIXTRAL_8X22Bも使用できます
            .logRequests(true)
            .logResponses(true)
            .build();
    
    public static void main(String[] args) {
        // ステップ1：ユーザーがツールとクエリを指定
        PaymentTransactionTool paymentTool = new PaymentTransactionTool();
        String userMessage = "What is the status and the payment date of transaction T1005?";

        // ステップ2：ユーザーがエージェントに質問し、AiServicesが関数を呼び出す
        PaymentTransactionAgent agent = AiServices.builder(PaymentTransactionAgent.class)
                .chatModel(mistralAiModel)
                .tools(paymentTool)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();
        
        // ステップ3：ユーザーがエージェントから最終的な回答を取得
        String answer = agent.chat(userMessage);
        System.out.println(answer);
    }
}
```

このような回答が期待できます：

```shell
The status of transaction T1005 is Pending. The payment date is October 8, 2021.
```
### JSONモード
JSONモードを使用して、応答をJSON形式で取得することもできます。これを行うには、`MistralAiChatModel`ビルダーまたは`MistralAiStreamingChatModel`ビルダーで`responseFormat`パラメータを`ResponseFormat.JSON`に設定する必要があります。

同期処理の例：

```java
ChatModel model = MistralAiChatModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY")) // 自分のMistral AI APIキーを使用してください
                .responseFormat(ResponseFormat.JSON)
                .build();

String userMessage = "Return JSON with two fields: transactionId and status with the values T123 and paid.";
String json = model.chat(userMessage);

System.out.println(json); // {"transactionId":"T123","status":"paid"}
```

ストリーミングの例：

```java
StreamingChatModel streamingModel = MistralAiStreamingChatModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY")) // 自分のMistral AI APIキーを使用してください
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

構造化出力は、モデルの応答がJSONスキーマに準拠することを保証します。

:::note
LangChain4jでの構造化出力の使用に関するドキュメントは[こちら](/tutorials/structured-outputs)で入手でき、以下のセクションではMistralAI固有の情報を見つけることができます。
:::

必要に応じて、リクエストにスキーマが提供されていない場合にフォールバックとして使用されるデフォルトのJSONスキーマでモデルを構成することができます。

```java
ChatModel model = MistralAiChatModel.builder()
        .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
        .modelName(MISTRAL_SMALL_LATEST)
        .supportedCapabilities(Set.of(Capability.RESPONSE_FORMAT_JSON_SCHEMA)) // 構造化出力を有効にする
        .responseFormat(ResponseFormat.builder() // フォールバックJSONスキーマを設定（オプション）
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
        .build();
```

### ガードレール
ガードレールは、モデルが有害または望ましくないコンテンツを生成することを防ぐために、モデルの動作を制限する方法です。`MistralAiChatModel`ビルダーまたは`MistralAiStreamingChatModel`ビルダーで`safePrompt`パラメータをオプションで設定できます。

同期処理の例：

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
セーフプロンプトを切り替えると、メッセージの前に次の`@SystemMessage`が追加されます：

```plaintext
Always assist with care, respect, and truth. Respond with utmost utility yet securely. Avoid harmful, unethical, prejudiced, or negative content. Ensure replies promote fairness and positivity.
```

## `MistralAiModerationModel`の作成

### 通常のJava
```java
ModerationModel model = new MistralAiModerationModel.Builder()
    .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
    .modelName("mistral-moderation-latest")
    .logRequests(true)
    .logResponses(false)
    .build();
```

```java
Moderation moderation = model.moderate("I want to kill them.").content();
```

## 例
- [Mistral AI の例](https://github.com/langchain4j/langchain4j-examples/tree/main/mistral-ai-examples/src/main/java)
