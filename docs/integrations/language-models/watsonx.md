---
sidebar_position: 22
---

# watsonx.ai

- [watsonx.ai API リファレンス](https://cloud.ibm.com/apidocs/watsonx-ai#chat-completions)
- [watsonx.ai Java SDK](https://github.com/IBM/watsonx-ai-java-sdk)

## Maven 依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-watsonx</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## 認証

Watsonx.ai は `Authenticator` インターフェースによる認証をサポートしています。

これにより、デプロイメントに応じて異なる認証メカニズムを使用できます。

- **IBMCloudAuthenticator** – API キーを使用して **IBM Cloud** で認証します。これが最もシンプルな方法で、`apiKey(...)` ビルダーメソッドを提供した場合に使用されます。
- **CP4DAuthenticator** – **Cloud Pak for Data** デプロイメントで認証します。
- **カスタム認証器** – `Authenticator` インターフェースの任意の実装を使用できます。

`WatsonxChatModel`、`WatsonxStreamingChatModel`、およびその他のサービスビルダーは、`.apiKey(...)` によるショートカット、または `.authenticator(...)` による完全な `Authenticator` インスタンスのいずれかを受け付けます。

### 例
```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.watsonx.WatsonxChatModel;
import com.ibm.watsonx.ai.core.auth.cp4d.CP4DAuthenticator;
import com.ibm.watsonx.ai.core.auth.cp4d.AuthMode;
import com.ibm.watsonx.ai.CloudRegion;

WatsonxChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key") // Simple IBM Cloud authentication
    .projectId("your-project-id")
    .modelName("ibm/granite-4-h-small")
    .build();

WatsonxChatModel.builder()
    .baseUrl("https://my-instance-url")
    .authenticator( // For Cloud Pak for Data deployments
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .authMode(AuthMode.LEGACY)
            .build()
    )
    .projectId("my-project-id")
    .modelName("ibm/granite-4-h-small")
    .build();
```

### カスタム HttpClient と SSL 設定

#### カスタム HttpClient の使用

すべてのサービスと認証器は、ビルダーパターンを通じてカスタム `HttpClient` インスタンスをサポートします。これは、カスタム TLS/SSL 設定、プロキシ設定、またはその他の HTTP クライアントプロパティを構成する必要がある Cloud Pak for Data 環境で特に有用です。

```java
HttpClient httpClient = HttpClient.newBuilder()
    .sslContext(createCustomSSLContext())
    .executor(ExecutorProvider.ioExecutor())
    .build();

EmbeddingModel embeddingModel = WatsonxEmbeddingModel.builder()
    .baseUrl("https://my-instance-url")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .projectId("project-id")
    .httpClient(httpClient) // Custom HttpClient
    .authenticator(
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .httpClient(httpClient) // Custom HttpClient
            .build()
    )
    .build();
```

> **注意:** Cloud Pak for Data でカスタム `HttpClient` を使用する場合、すべてのリクエストで一貫した HTTP 動作を確保するため、サービスビルダーと認証器ビルダーの両方に設定してください。

#### SSL 検証の無効化

SSL 証明書検証のみを無効にする必要がある場合は、カスタム `HttpClient` を提供する代わりに `verifySsl(false)` オプションを使用できます。

```java
EmbeddingModel embeddingModel = WatsonxEmbeddingModel.builder()
    .baseUrl("https://my-instance-url")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .projectId("project-id")
    .verifySsl(false) // Disable SSL verification
    .authenticator(
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .verifySsl(false) // Disable SSL verification
            .build()
    )
    .build();
```

### IBM Cloud API キーの作成方法

[https://cloud.ibm.com/iam/apikeys](https://cloud.ibm.com/iam/apikeys) で **Create +** をクリックして API キーを作成できます。

### Project ID の確認方法

1. [https://dataplatform.cloud.ibm.com/projects/?context=wx](https://dataplatform.cloud.ibm.com/projects/?context=wx) にアクセスする  
2. プロジェクトを開く  
3. **Manage** タブに移動する  
4. **Details** セクションから **Project ID** をコピーする  

## WatsonxChatModel

`WatsonxChatModel` クラスを使用すると、LangChain4j 内に完全にカプセル化された `ChatModel` インターフェースのインスタンスを作成できます。
インスタンスを作成するには、必須パラメータを指定する必要があります。

- `baseUrl(...)` – IBM Cloud エンドポイント URL（`String`、`URI`、または `CloudRegion`）；
- `apiKey(...)` – IBM Cloud IAM API キー；
- `projectId(...)` – IBM Cloud Project ID（または `spaceId(...)` を使用）；
- `modelName(...)` – 推論用の基盤モデル ID；

または、次を指定して**デプロイ済みモデル**を使用できます。

- `baseUrl(...)` – IBM Cloud エンドポイント URL（`String`、`URI`、または `CloudRegion`）；
- `apiKey(...)` – IBM Cloud IAM API キー；
- `deploymentId(...)` – オンデマンドでデプロイされたモデルの Deployment ID；

> `.apiKey(...)` または `.authenticator(...)` による完全な `Authenticator` インスタンスのいずれかで認証できます。

### 例

#### カタログの基盤モデルを使用する

```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.watsonx.WatsonxChatModel;
import com.ibm.watsonx.ai.CloudRegion;

ChatModel chatModel = WatsonxChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("ibm/granite-4-h-small")
    .temperature(0.7)
    .maxOutputTokens(0)
    .build();

String answer = chatModel.chat("Hello from watsonx.ai");
System.out.println(answer);
```

#### デプロイ済みモデルを使用する（オンデマンドデプロイメント）

IBM watsonx.ai では、組織が独占的に使用するために、専用ハードウェア上で基盤モデルをオンデマンドでデプロイできます。これらのデプロイ済みモデルは `deploymentId` を使用してアクセスできます。

```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.watsonx.WatsonxChatModel;
import com.ibm.watsonx.ai.CloudRegion;

ChatModel chatModel = WatsonxChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .deploymentId("your-deployment-id")
    .temperature(0.7)
    .maxOutputTokens(0)
    .build();

String answer = chatModel.chat("Hello from watsonx.ai");
System.out.println(answer);
```

> **注意:** `deploymentId` を使用する場合、デプロイメントに既にこれらの情報が含まれているため、`projectId`、`spaceId`、または `modelName` を指定する必要はありません。

> 🔗 [利用可能なモデルを表示](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models.html?context=wx#ibm-provided)

> 🔗 [オンデマンドでのモデルデプロイについて詳しく学ぶ](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/deploy-on-demand-overview.html?context=wx&audience=wdp)

## WatsonxStreamingChatModel

`WatsonxStreamingChatModel` は、LangChain4j 内で IBM watsonx.ai のストリーミングサポートを提供します。トークンが生成されるにつれて処理したい場合に有用で、チャット UI や長いテキスト生成などのリアルタイムアプリケーションに最適です。

ストリーミングは、非ストリーミングの [`WatsonxChatModel`](#watsonxchatmodel) と同じ設定構造とパラメータを使用します。主な違いは、レスポンスがハンドラーインターフェースを通じて増分的に配信されることです。

### 例

#### カタログの基盤モデルを使用する

```java
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.StreamingChatResponseHandler;
import dev.langchain4j.model.chat.ChatResponse;
import dev.langchain4j.model.watsonx.WatsonxStreamingChatModel;
import com.ibm.watsonx.ai.CloudRegion;

StreamingChatModel model = WatsonxStreamingChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("ibm/granite-4-h-small")
    .maxOutputTokens(0)
    .build();

model.chat("What is the capital of Italy?", new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.println("Partial: " + partialResponse);
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        System.out.println("Complete: " + completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        error.printStackTrace();
    }
});
```

#### デプロイ済みモデルを使用する（オンデマンドデプロイメント）

```java
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.StreamingChatResponseHandler;
import dev.langchain4j.model.chat.ChatResponse;
import dev.langchain4j.model.watsonx.WatsonxStreamingChatModel;
import com.ibm.watsonx.ai.CloudRegion;

StreamingChatModel model = WatsonxStreamingChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .deploymentId("your-deployment-id")
    .maxOutputTokens(0)
    .build();

model.chat("What is the capital of Italy?", new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.println("Partial: " + partialResponse);
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        System.out.println("Complete: " + completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        error.printStackTrace();
    }
});
```

> **注意:** `deploymentId` を使用する場合、デプロイメントに既にこれらの情報が含まれているため、`projectId`、`spaceId`、または `modelName` を指定する必要はありません。

> 🔗 [利用可能なモデルを表示](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models.html?context=wx#ibm-provided)

> 🔗 [オンデマンドでのモデルデプロイについて詳しく学ぶ](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/deploy-on-demand-overview.html?context=wx&audience=wdp)

## ツール統合

`WatsonxChatModel` と `WatsonxStreamingChatModel` はどちらも **LangChain4j Tools** をサポートしており、モデルが `@Tool` でアノテーションされた Java メソッドを呼び出せます。

以下は同期モデル（`WatsonxChatModel`）を使用した例ですが、同じアプローチがストリーミングバリアントにも適用されます。

```java
static class Tools {

    @Tool
    LocalDate currentDate() {
        return LocalDate.now();
    }

    @Tool
    LocalTime currentTime() {
        return LocalTime.now();
    }
}

interface AiService {
    String chat(String userMessage);
}

ChatModel chatModel = WatsonxChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("mistralai/mistral-small-3-1-24b-instruct-2503")
    .maxOutputTokens(0)
    .build();

AiService aiService = AiServices.builder(AiService.class)
        .chatModel(model)
        .tools(new Tools())
        .build();

String answer = aiService.chat("What is the date today?");
System.out.println(answer);
```

> **注意:** 選択したモデルがツール使用をサポートしていることを確認してください。
---

## Thinking / Reasoning 出力の有効化

一部の基盤モデルは、レスポンスの一部として内部の*reasoning*（*thinking* とも呼ばれる）ステップを含めることができます。  
モデルによっては、この reasoning は**最終レスポンスと同じテキストに埋め込まれている**場合もあれば、`watsonx.ai` から専用フィールドで**別途返される**場合もあります。  

この動作を正しく有効化しキャプチャするには、モデルの出力形式に従って `thinking(...)` ビルダーメソッドを設定する必要があります。  
これにより、LangChain4j がモデル出力から reasoning とレスポンス内容を自動的に抽出できます。

主な設定モードは 2 つあります。

- **`ExtractionTags`** → 同じテキストブロックで reasoning とレスポンスを返すモデル向け（例: **ibm/granite-3-3-8b-instruct**）。  
- **`ThinkingEffort`** → 既に reasoning とレスポンスを自動的に分離するモデル向け（例: **openai/gpt-oss-120b**）。  

### reasoning とレスポンスを一緒に返すモデル

モデルが同じテキスト文字列で reasoning とレスポンスを出力する場合は **`ExtractionTags`** を使用します。  
タグは、reasoning と最終レスポンスを分離するために使用される XML 風のマーカーを定義します。

**タグの例:**

- **Reasoning タグ:** `<think>` — モデルの内部 reasoning を含みます。  
- **Response タグ:** `<response>` — ユーザー向けの回答を含みます。  

#### 動作

- **両方のタグ**が指定されている場合、それらを直接使用して reasoning とレスポンスのセグメントを抽出します。  
- **reasoning タグのみ**が指定されている場合、そのタグの外側にあるすべてがレスポンスと見なされます。  

#### **ibm/granite-3-3-8b-instruct** の例

```java
ChatModel chatModel = WatsonxChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("ibm/granite-3-3-8b-instruct")
    .maxOutputTokens(0)
    .thinking(ExtractionTags.of("think", "response"))
    .build();

ChatResponse chatResponse = chatModel.chat(
    UserMessage.userMessage("Why is the sky blue?")
);

AiMessage aiMessage = chatResponse.aiMessage();

System.out.println(aiMessage.thinking());
System.out.println(aiMessage.text());
```

### reasoning とレスポンスを別々に返すモデル

既に reasoning とレスポンスを別フィールドとして返すモデルでは、生成中にモデルが適用する reasoning の量を制御するために **`ThinkingEffort`** を使用します。
あるいは、ブールフラグを使用して有効にします。

#### **openai/gpt-oss-120b** の例

```java
ChatModel chatModel = WatsonxChatModel.builder()
    .baseUrl(CloudRegion.DALLAS)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("openai/gpt-oss-120b")
    .thinking(ThinkingEffort.HIGH)
    .build();
```

または

```java
ChatModel chatModel = WatsonxChatModel.builder()
    .baseUrl(CloudRegion.DALLAS)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("openai/gpt-oss-120b")
    .thinking(true)
    .build();
```

### ストリーミングの例

```java
StreamingChatModel model = WatsonxStreamingChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("ibm/granite-3-3-8b-instruct")
    .thinking(ExtractionTags.of("think", "response"))
    .build();

List<ChatMessage> messages = List.of(
    UserMessage.userMessage("Why is the sky blue?")
);

ChatRequest chatRequest = ChatRequest.builder()
    .messages(messages)
    .build();

model.chat(chatRequest, new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        ...
    }

    @Override
    public void onPartialThinking(PartialThinking partialThinking) {
        ...
    }
});
```

> **注意事項:**
> - 選択したモデルが reasoning 出力をサポートしていることを確認してください。  
> - reasoning とレスポンスを単一のテキスト文字列に埋め込むモデルには `ExtractionTags` を使用します。  
> - 既に reasoning とレスポンスを自動的に分離するモデルには `ThinkingEffort` または `thinking(true)` を使用します。  

## WatsonxModelCatalog

`WatsonxModelCatalog` は、IBM watsonx.ai 上で利用可能なすべての基盤モデルをプログラムで発見・一覧表示する方法を提供します。
LangChain4j の `ModelCatalog` インターフェースを実装しており、各モデルに関する詳細情報を取得できます。

### 例

```java
import dev.langchain4j.model.catalog.ModelCatalog;
import dev.langchain4j.model.catalog.ModelDescription;
import dev.langchain4j.model.watsonx.WatsonxModelCatalog;
import com.ibm.watsonx.ai.CloudRegion;

ModelCatalog modelCatalog = WatsonxModelCatalog.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .build();

var models = modelCatalog.listModels();
```

## WatsonxModerationModel

`WatsonxModerationModel` は、IBM watsonx.ai を使用した LangChain4j の `ModerationModel` インターフェース実装を提供します。  
**検出器（detectors）** を通じて、テキスト内の機密、安全でない、またはポリシー違反のコンテンツを自動的に検出・フラグ付けできます。

1 つまたは複数の**検出器**を使用して、次のような異なる種類のコンテンツを識別できます。

- **Pii** – 個人識別情報を検出（例: メール、電話番号）  
- **Hap** – ヘイト、虐待、または冒涜を検出  
- **GraniteGuardian** – リスクのあるまたは有害な言語を検出  

### 例

```java
ModerationModel model = WatsonxModerationModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .detectors(Hap.ofDefaults(), GraniteGuardian.ofDefaults())
    .build();

Response<Moderation> response = model.moderate("...");
```

### メタデータ

各モデレーションレスポンスには、検出に関する追加コンテキストを提供する `metadata` マップが含まれます。  

| キー | 説明 | 
|-----|--------------|
| `detection` | 検出器によって割り当てられた検出ラベルまたはカテゴリ
| `detection_type` | フラグをトリガーした検出器のタイプ 
| `start` | 検出されたセグメントの開始文字インデックス 
| `end` | 検出されたセグメントの終了文字インデックス 
| `score` | 検出の信頼度スコア 

これらのメタデータ値は `Response.metadata()` 経由で利用できます。

```java
Map<String, Object> metadata = response.metadata();
System.out.println("Detection type: " + metadata.get("detection_type"));
System.out.println("Score: " + metadata.get("score"));
```
## 環境変数による設定

LangChain4j watsonx 統合では、環境変数を通じて内部 HTTP 動作をカスタマイズできます。  
これらの設定はオプションであり、変数が明示的に定義されていない場合は妥当なデフォルト値が使用されます。

### リトライ設定

HTTP リクエストは、一時的な障害や認証トークンの期限切れの場合に自動的にリトライされます。  
リトライ動作は次の環境変数でカスタマイズできます。

| 環境変数 | 説明 | デフォルト |
|---------------------|-------------|---------|
| `WATSONX_RETRY_TOKEN_EXPIRED_MAX_RETRIES` | 認証トークンが期限切れになった場合の最大リトライ回数（HTTP 401 / 403） | `1` |
| `WATSONX_RETRY_STATUS_CODES_MAX_RETRIES` | 一時的な HTTP ステータスコードの最大リトライ回数（`429`、`503`、`504`、`520`） | `10` |
| `WATSONX_RETRY_STATUS_CODES_BACKOFF_ENABLED` | 一時的なリトライに対する指数バックオフを有効化 | `true` |
| `WATSONX_RETRY_STATUS_CODES_INITIAL_INTERVAL_MS` | 初期リトライ間隔（ミリ秒、指数バックオフの基準として使用） | `20` |

### HTTP IO エグゼキュータ設定

ストリーミングレスポンスと HTTP レスポンス処理は、内部 IO エグゼキュータによって処理されます。  
デフォルトでは、ストリーミングイベントの順次処理を確保するためにシングルスレッドのエグゼキュータが使用されます。

この動作は次の環境変数でカスタマイズできます。

| 環境変数 | 説明 | デフォルト |
|---------------------|-------------|---------|
| `WATSONX_IO_EXECUTOR_THREADS` | HTTP IO および SSE ストリーム解析に使用するスレッド数 | `1` |

## Quarkus

詳細は[こちら](https://docs.quarkiverse.io/quarkus-langchain4j/dev/watsonx-chat-model.html)を参照してください。

## 例

- [WatsonxChatModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxChatModelTest.java)
- [WatsonxChatModelReasoningTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxChatModelReasoningTest.java)
- [WatsonxStreamingChatModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxStreamingChatModelTest.java)
- [WatsonxStreamingChatModelReasoningTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxStreamingChatModelTest.java)
- [WatsonxToolsTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxToolsTest.java)
- [WatsonxTokenCounterEstimatorTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxTokenCounterEstimatorTest.java)
- [WatsonxModerationModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxModerationModelTest.java)
