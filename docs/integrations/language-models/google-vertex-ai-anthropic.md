---
sidebar_position: 9
---

# Google Vertex AI Anthropic

Google Vertex AI は、Google Cloud Platform 経由で Anthropic の Claude モデルへのアクセスを提供します。この統合により、Google Cloud のインフラとセキュリティ機能を活用しながら、Claude の高度な言語能力を利用できます。

## はじめに

### Google Cloud アカウントの作成

Google Cloud を初めて利用する場合は、次のページの `Get set up on Google Cloud` ドロップダウンメニュー内にある `[create an account]` ボタンをクリックして新しいアカウントを作成できます。

[アカウントを作成](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#new-to-google-cloud)

### Google Cloud Platform アカウント内でプロジェクトを作成

Google Cloud アカウント内で新しいプロジェクトを作成し、次の手順に従って Vertex AI API を有効にしてください。

[新しいプロジェクトを作成](https://cloud.google.com/vertex-ai/docs/start/cloud-environment#set_up_a_project)

今後の API 呼び出しで必要になるため、`PROJECT_ID` を控えておいてください。

### Vertex AI Model Garden で Claude モデルを有効化

Claude モデルは Google Cloud プロジェクトで有効にする必要があります。

1. [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden) に移動します
2. "Claude" モデルを検索します
3. 使用したい Claude モデル（例：Claude 3.5 Sonnet、Claude 3 Opus）を有効にします

### Google Cloud 認証戦略の選択

アプリケーションが Google Cloud のサービスと API に対して認証する方法は複数あります。たとえば、[サービスアカウント](https://cloud.google.com/docs/authentication/provide-credentials-adc#local-key)を作成し、環境変数 `GOOGLE_APPLICATION_CREDENTIALS` を認証情報が含まれる JSON ファイルのパスに設定できます。

すべての認証戦略は[こちら](https://cloud.google.com/docs/authentication/provide-credentials-adc)で確認できます。ただし、ローカルテストを簡単にするため、ここでは `gcloud` ユーティリティによる認証を使用します。

### Google Cloud CLI のインストール（オプション）

ローカルからクラウドプロジェクトにアクセスするには、[インストール手順](https://cloud.google.com/sdk/docs/install)に従って `gcloud` ツールをインストールできます。GNU/Linux オペレーティングシステムの場合、インストール手順は次のとおりです。

1. SDK をダウンロードします。

```bash
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-467.0.0-linux-x86_64.tar.gz
```

2. アーカイブを展開します。

```bash
tar -xf google-cloud-cli-467.0.0-linux-x86_64.tar.gz
```

3. インストールスクリプトを実行します。

```bash
cd google-cloud-sdk/
./install.sh
```

4. 次のコマンドを実行して、デフォルトプロジェクトと認証情報を設定します。

```bash
gcloud auth application-default login
```

この認証方法は `langchain4j-vertex-ai-anthropic` パッケージと互換性があります。

## 依存関係の追加

始めるには、プロジェクトの `pom.xml` に次の依存関係を追加します。

```xml
<dependency>
  <groupId>dev.langchain4j</groupId>
  <artifactId>langchain4j-vertex-ai-anthropic</artifactId>
  <version>1.18.1-beta28</version>
</dependency>
```

またはプロジェクトの `build.gradle`：

```groovy
implementation 'dev.langchain4j:langchain4j-vertex-ai-anthropic:1.18.1-beta28'
```

### サンプルコードを試す

`PROJECT_ID` フィールドは、新しい Google Cloud プロジェクト作成時に設定した変数を表します。

```java
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.vertexai.anthropic.VertexAiAnthropicChatModel;

public class VertexAiAnthropicExample {

    private static final String PROJECT_ID = "YOUR-PROJECT-ID";
    private static final String LOCATION = "us-central1";
    private static final String MODEL_NAME = "claude-3-5-sonnet-v2@20241022";

    public static void main(String[] args) {
        ChatModel model = VertexAiAnthropicChatModel.builder()
                .project(PROJECT_ID)
                .location(LOCATION)
                .modelName(MODEL_NAME)
                .maxTokens(1000)
                .temperature(0.7)
                .build();

        ChatResponse response = model.chat(ChatRequest.builder()
                .messages(List.of(UserMessage.from("Hello, Claude!")))
                .build());

        System.out.println(response.aiMessage().text());
    }
}
```

ストリーミングも `VertexAiAnthropicStreamingChatModel` クラスによりサポートされています。

```java
import dev.langchain4j.model.vertexai.anthropic.VertexAiAnthropicStreamingChatModel;
import dev.langchain4j.model.chat.StreamingChatResponseHandler;

var model = VertexAiAnthropicStreamingChatModel.builder()
        .project(PROJECT_ID)
        .location(LOCATION)
        .modelName(MODEL_NAME)
        .build();

model.

chat(ChatRequest.builder()
    .

messages(List.of(UserMessage.from("Tell me a story")))
        .

build(), new

StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse (String partialResponse){
        System.out.print(partialResponse);
    }

    @Override
    public void onCompleteResponse (ChatResponse completeResponse){
        System.out.println("\nDone!");
    }

    @Override
    public void onError (Throwable error){
        error.printStackTrace();
    }
});
```

`LambdaStreamingResponseHandler` のショートカットユーティリティ関数 `onPartialResponse()` と `onPartialResponseAndError()` も使用できます。

```java
import static dev.langchain4j.model.chat.response.streaming.LambdaStreamingResponseHandler.onPartialResponse;
import static dev.langchain4j.model.chat.response.streaming.LambdaStreamingResponseHandler.onPartialResponseAndError;

model.chat(ChatRequest.builder()
    .messages(List.of(UserMessage.from("Why is the sky blue?")))
    .build(), onPartialResponse(System.out::print));

model.chat(ChatRequest.builder()
    .messages(List.of(UserMessage.from("Why is the sky blue?")))
    .build(), onPartialResponseAndError(System.out::print, Throwable::printStackTrace));
```

### 利用可能なモデル

[Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude) の利用可能モデル一覧です。
モデルについては [Claude モデルドキュメント](https://docs.anthropic.com/en/docs/about-claude/models) で確認できます。

## 設定

```java
ChatModel model = VertexAiAnthropicChatModel.builder()
    .project(PROJECT_ID)            // your Google Cloud project ID
    .location(LOCATION)             // where inference takes place, see "Locations" below
    .modelName(MODEL_NAME)          // the Claude model used
    .maxTokens(4096)               // the maximum number of tokens to generate
    .temperature(0.7)              // temperature (between 0 and 1)
    .topP(0.95)                    // topP (between 0 and 1) — cumulative probability
    .topK(40)                      // topK (positive integer) — pick from top K tokens
    .stopSequences(Arrays.asList("Human:", "Assistant:")) // stop sequences
    .enablePromptCaching(true)     // enable prompt caching for cost/latency optimization
    .credentials(credentials)      // custom Google Cloud credentials
    .logRequests(true)             // log input requests
    .logResponses(true)            // log output responses
    .build();
```

同じパラメータはストリーミングチャットモデルでも利用できます。

### ロケーション

`location` はリクエストの処理場所を決定します。Vertex AI は 3 種類のロケーションを提供し、
`.location(...)` に渡す値によってどれが使われるかが決まります。

| location の値 | 種類 | 動作 |
|---|---|---|
| `"global"` | グローバル | 利用可能な容量がある任意のリージョンへ各リクエストをルーティングします。可用性に優れ、料金プレミアムはありません。データレジデンシー要件がない限り推奨です。 |
| `"us"`、`"eu"` | マルチリージョン | その地理範囲内のリージョンへ各リクエストをルーティングし、データレジデンシーと高可用性を両立します。 |
| `"us-east5"`、`"europe-west1"` など | リージョナル | すべてのリクエストを特定の 1 リージョン経由でルーティングします。単一リージョンのデータレジデンシーやプロビジョンドスループットに必要です。 |

```java
ChatModel model = VertexAiAnthropicChatModel.builder()
    .project(PROJECT_ID)
    .location("global")
    .modelName(MODEL_NAME)
    .build();
```

モデルの可用性はロケーションごとに異なり、マルチリージョンおよびリージョナルロケーションはグローバルより料金プレミアムが付くことに注意してください。詳細は
[グローバル、マルチリージョン、リージョナルエンドポイント](https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai#global-multi-region-and-regional-endpoints)
を参照してください。

## その他の例

Claude はテキストと画像の両方を入力として受け付ける強力なマルチモーダルモデルです。

### ビジョン機能

```java
import dev.langchain4j.data.image.Image;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;

ChatModel model = VertexAiAnthropicChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("claude-3-5-sonnet-v2@20241022")
    .build();

Image image = Image.builder()
    .base64Data("base64-encoded-image-data")
    .mimeType("image/jpeg")
    .build();

UserMessage userMessage = UserMessage.from(
    ImageContent.from(image),
    TextContent.from("What do you see in this image?")
);

ChatResponse response = model.chat(ChatRequest.builder()
    .messages(List.of(userMessage))
    .build());

System.out.println(response.aiMessage().text());
```

### ツール呼び出し

```java
import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.data.message.ToolExecutionResultMessage;
import dev.langchain4j.model.output.structured.JsonObjectSchema;

ChatModel model = VertexAiAnthropicChatModel.builder()
        .project(PROJECT_ID)
        .location(LOCATION)
        .modelName("claude-3-5-sonnet-v2@20241022")
        .build();

ToolSpecification weatherToolSpec = ToolSpecification.builder()
        .name("getWeatherForecast")
        .description("Get the weather forecast for a location")
        .parameters(JsonObjectSchema.builder()
                .addStringProperty("location", "the location to get the weather forecast for")
                .required("location")
                .build())
        .build();

ChatRequest request = ChatRequest.builder()
        .messages(List.of(UserMessage.from("What is the weather in Paris?")))
        .toolSpecifications(List.of(weatherToolSpec))
        .build();

ChatResponse response = model.chat(request);
```

モデルはテキストメッセージではなく、ツール実行リクエストで応答します。
あなたの責務は、その実行リクエストの結果をモデルに提供することです。
そのためには `ToolExecutionResultMessage` をモデルに送り返します。
その後、モデルはテキスト応答を返せるようになります。

### AiServices によるツールサポート

`AiServices` を使って、ツールで強化された独自のアシスタントを作成できます。
次の例では、数学計算を行う `Calculator` ツール、
アシスタントの契約を定義する `Assistant` インターフェース、
そして Claude、チャットメモリ、計算機ツールを使う `AiServices` の設定を示します。

```java
import dev.langchain4j.service.AiServices;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;

static class Calculator {
    @Tool("Adds two given numbers")
    double add(double a, double b) {
        return a + b;
    }

    @Tool("Multiplies two given numbers")
    String multiply(double a, double b) {
        return String.valueOf(a * b);
    }
}

interface Assistant {
    String chat(String userMessage);
}

Calculator calculator = new Calculator();

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(model)
        .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
        .tools(calculator)
        .build();

String answer = assistant.chat("How much is 74589613588 + 4786521789?");
```

### プロンプトキャッシュ

Claude は、繰り返しや長いプロンプトのコスト削減と応答時間改善のためにプロンプトキャッシュをサポートします。

```java
import dev.langchain4j.data.message.SystemMessage;

ChatModel model = VertexAiAnthropicChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("claude-3-5-sonnet-v2@20241022")
    .enablePromptCaching(true)
    .build();

SystemMessage systemMessage = SystemMessage.from(
    "You are an expert software engineer with deep knowledge of Java, " +
    "Spring Boot, microservices architecture, and cloud-native development. " +
    "Always provide detailed, production-ready code examples with proper " +
    "error handling, logging, and best practices."
);

UserMessage userMessage = UserMessage.from("How do I implement JWT authentication?");

ChatResponse response = model.chat(ChatRequest.builder()
    .messages(List.of(systemMessage, userMessage))
    .build());
```

プロンプトキャッシュにより次が得られます。
- **コスト削減**：キャッシュされたコンテンツで最大約 90% 安くなります
- **レイテンシ改善**：応答時間が最大約 85% 速くなります
- **自動最適化**：手動のキャッシュ管理は不要です

### カスタム認証

カスタムの Google Cloud 認証情報を提供できます。

```java
import com.google.auth.oauth2.GoogleCredentials;
import java.io.FileInputStream;

GoogleCredentials credentials = GoogleCredentials.fromStream(
    new FileInputStream("path/to/service-account-key.json"));

ChatModel model = VertexAiAthropicChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("claude-3-5-sonnet-v2@20241022")
    .credentials(credentials)
    .build();
```
 
## 参考資料

[利用可能なロケーション](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations#available-regions)

[Claude モデルドキュメント](https://docs.anthropic.com/en/docs/about-claude/models)

[Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
