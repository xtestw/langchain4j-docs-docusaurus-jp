---
sidebar_position: 8
---

# Google Vertex AI Gemini

Vertex AIはGoogle Cloudの完全管理型AI開発プラットフォームであり、旧世代（PaLM2）と新世代（Gemini）を含むGoogleの大規模生成モデルへのアクセスを提供します。

Vertex AIを利用するには、まずGoogle Cloud Platformアカウントを作成する必要があります。

## はじめに

### Google Cloudアカウントの作成

Google Cloudを初めて利用する場合は、以下のページの「Get set up on Google Cloud」ドロップダウンメニューにある「[create an account]」ボタンをクリックして新しいアカウントを作成できます：

[アカウントを作成する](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#new-to-google-cloud)

### Google Cloud Platformアカウント内でプロジェクトを作成する

Google Cloudアカウント内で新しいプロジェクトを作成し、以下の手順に従ってVertex AI APIを有効にします：

[新しいプロジェクトを作成する](https://cloud.google.com/vertex-ai/docs/start/cloud-environment#set_up_a_project)

将来のAPI呼び出しに必要となるため、`PROJECT_ID`をメモしておいてください。

### Google Cloud認証戦略の選択

Google CloudサービスとAPIに対してアプリケーションが認証を行う方法はいくつかあります。例えば、[サービスアカウント](https://cloud.google.com/docs/authentication/provide-credentials-adc#local-key)を作成し、環境変数`GOOGLE_APPLICATION_CREDENTIALS`を認証情報を含むJSONファイルのパスに設定することができます。

すべての認証戦略は[こちら](https://cloud.google.com/docs/authentication/provide-credentials-adc)で確認できます。ただし、ローカルテストを簡単にするために、ここでは`gcloud`ユーティリティを使用した認証を使用します。

### Google Cloud CLIのインストール（オプション）

クラウドプロジェクトにローカルからアクセスするには、[インストール手順](https://cloud.google.com/sdk/docs/install)に従って`gcloud`ツールをインストールできます。GNU/Linuxオペレーティングシステムの場合、インストール手順は次のとおりです：

1. SDKをダウンロードする：

```bash
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-467.0.0-linux-x86_64.tar.gz
```

2. アーカイブを展開する：

```bash
tar -xf google-cloud-cli-467.0.0-linux-x86_64.tar.gz
```
3. インストールスクリプトを実行する：

```bash
cd google-cloud-sdk/
./install.sh
```

4. 次のコマンドを実行して、デフォルトのプロジェクトと認証情報を設定します：

```bash
gcloud auth application-default login
```

この認証方法は、`vertex-ai`（埋め込みモデル、PaLM2）と`vertex-ai-gemini`（Gemini）の両方のパッケージと互換性があります。

## 依存関係の追加

始めるには、プロジェクトの`pom.xml`に次の依存関係を追加します：

```xml
<dependency>
  <groupId>dev.langchain4j</groupId>
  <artifactId>langchain4j-vertex-ai-gemini</artifactId>
  <version>1.0.0-beta4</version>
</dependency>
```

またはプロジェクトの`build.gradle`に：

```groovy
implementation 'dev.langchain4j:langchain4j-vertex-ai-gemini:1.0.0-beta4'
```

### サンプルコードを試す：

[テキスト予測のためのチャットモデルの使用例](https://github.com/langchain4j/langchain4j-examples/blob/main/vertex-ai-gemini-examples/src/main/java/VertexAiGeminiChatModelExamples.java)

[画像入力を使用したGemini Pro Vision](https://github.com/langchain4j/langchain4j/blob/657aac9519b57afc04ea434ddcfa70d701923b91/langchain4j-vertex-ai-gemini/src/test/java/dev/langchain4j/model/vertexai/VertexAiGeminiChatModelIT.java#L123)

`PROJECT_ID`フィールドは、新しいGoogle Cloudプロジェクトを作成するときに設定した変数を表します。

```java
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.vertexai.VertexAiGeminiChatModel;

public class GeminiProVisionWithImageInput {

    private static final String PROJECT_ID = "YOUR-PROJECT-ID";
    private static final String LOCATION = "us-central1";
    private static final String MODEL_NAME = "gemini-1.5-flash";
    private static final String CAT_IMAGE_URL = "https://upload.wikimedia.org/" +
        "wikipedia/commons/e/e9/" +
        "Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png";

    public static void main(String[] args) {
        ChatModel visionModel = VertexAiGeminiChatModel.builder()
            .project(PROJECT_ID)
            .location(LOCATION)
            .modelName(MODEL_NAME)
            .build();

        ChatResponse response = visionModel.chat(
            UserMessage.from(
                ImageContent.from(CAT_IMAGE_URL),
                TextContent.from("What do you see?")
            )
        );
        
        System.out.println(response.aiMessage().text());
    }
}
```

`VertexAiGeminiStreamingChatModel`クラスのおかげでストリーミングもサポートされています：

```java
var model = VertexAiGeminiStreamingChatModel.builder()
        .project(PROJECT_ID)
        .location(LOCATION)
        .modelName(GEMINI_1_5_PRO)
        .build();

model.chat("Why is the sky blue?", new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.print(partialResponse);
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse){
        System.print(completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        error.printStackTrace();
    }
});
```

`LambdaStreamingResponseHandler`から`onPartialResponse()`と`onPartialResponseAndError()`ユーティリティ関数のショートカットを使用できます：

```java
model.chat("Why is the sky blue?", onPartialResponse(System.out::print));
model.chat("Why is the sky blue?", onPartialResponseAndError(System.out::print, Throwable::printStackTrace));
```

### 利用可能なモデル

| モデル名                   | 説明                                                                                                | 入力                                         | プロパティ                                           |
|---------------------------|-----------------------------------------------------------------------------------------------------|----------------------------------------------|-----------------------------------------------------|
| `gemini-1.5-flash`        | 高ボリューム、高品質、コスト効率の良いアプリケーション向けの速度と効率性を提供します。                | テキスト、コード、画像、音声、動画、音声付き動画、PDF | 最大入力トークン: 1,048,576, 最大出力トークン: 8,192 |
| `gemini-1.5-pro`          | テキストまたはコードの応答のためのテキストまたはチャットプロンプトをサポートします。最大入力トークン制限までの長文脈理解をサポートします。 | テキスト、コード、画像、音声、動画、音声付き動画、PDF | 最大入力トークン: 2,097,152, 最大出力トークン: 8,192 |
| `gemini-1.0-pro`          | テキストのみのタスクに最適なパフォーマンスを発揮するモデルです。                                    | テキスト                                     | 最大入力トークン: 32,760, 最大出力トークン: 8,192    |
| `gemini-1.0-pro-vision`   | 幅広いアプリケーションに対応する最高のパフォーマンスを持つ画像および動画理解モデルです。            | テキスト、画像、音声、動画、音声付き動画、PDF | 最大入力トークン: 16,384, 最大出力トークン: 2,048    |
| `gemini-1.0-ultra`        | 指示、コード、推論を含む複雑なタスク向けに最適化された最も高性能なテキストモデルです。              | テキスト                                     | 最大入力トークン: 8,192, 最大出力トークン: 2,048     |
| `gemini-1.0-ultra-vision` | 最も高性能なマルチモーダルビジョンモデルです。テキスト、画像、動画の入力を共同でサポートするように最適化されています。 | テキスト、コード、画像、音声、動画、音声付き動画、PDF | 最大入力トークン: 8,192, 最大出力トークン: 2,048     |

モデルについての詳細は[Geminiモデルのドキュメントページ](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models)で確認できます。

2024年3月の時点では、Ultraバージョンは許可リストによるプライベートアクセスとなっています。そのため、次のような例外が発生する可能性があります：

```text
Caused by: io.grpc.StatusRuntimeException:
 FAILED_PRECONDITION: Project `1234567890` is not allowed to use Publisher Model
  `projects/{YOUR_PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-ultra`
```

## 設定

```java
ChatModel model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)        // Google CloudプロジェクトのプロジェクトID
    .location(LOCATION)         // AI推論が行われる地域
    .modelName(MODEL_NAME)      // 使用するモデル
    .logRequests(true)          // 入力リクエストをログに記録
    .logResponses(true)         // 出力レスポンスをログに記録
    .maxOutputTokens(8192)      // 生成する最大トークン数（最大8192）
    .temperature(0.7)           // 温度（0から2の間）
    .topP(0.95)                 // topP（0から1の間）- 最も確率の高いトークンの累積確率
    .topK(3)                    // topK（正の整数）- 最も確率の高いトークンの中から選択
    .seed(1234)                 // 乱数生成器のシード
    .maxRetries(2)              // 最大再試行回数
    .responseMimeType("application/json") // JSON構造化出力を取得するため
    .responseSchema(/*...*/)    // 提供されたスキーマに従った構造化出力
    .safetySettings(/*...*/)    // 不適切なコンテンツをフィルタリングするための安全設定
    .useGoogleSearch(true)      // Google検索結果で回答を根拠付ける
    .vertexSearchDatastore(name)// カスタムVertex AI Search データストアからのデータ
                                // バックドキュメントで回答を根拠付ける
    .toolCallingMode(/*...*/)   // AUTO（自動）、ANY（関数リストから）、NONE
    .allowedFunctionNames(/*...*/) // ANYツール呼び出しモードを使用する場合、
                                // 呼び出し可能な関数名を指定
    .listeners(/*...*/)         // モデルイベントを受信するリスナーのリスト
    .build();
```

同じパラメータはストリーミングチャットモデルでも利用可能です。

## その他の例

Geminiは`マルチモーダル`モデルであり、テキストだけでなく、画像、音声、動画ファイル、およびPDFも入力として受け付けます。

### 画像の内容を説明する

```java
ChatModel model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName(GEMINI_1_5_PRO)
    .build();

UserMessage userMessage = UserMessage.from(
    ImageContent.from(CAT_IMAGE_URL),
    TextContent.from("What do you see? Reply in one word.")
);

ChatResponse response = model.chat(userMessage);
```

URLはウェブURLでも、`gs://my-bucket/my-image.png`のようなGoogle Cloud Storageバケットに保存されたファイルを指すこともできます。

また、Base64エンコードされた文字列として画像の内容を渡すこともできます：

```java
String base64Data = Base64.getEncoder().encodeToString(readBytes(CAT_IMAGE_URL));
UserMessage userMessage = UserMessage.from(
        ImageContent.from(base64Data, "image/png"),
        TextContent.from("What do you see? Reply in one word.")
);
```

### PDFドキュメントについて質問する

```java
var model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName(GEMINI_1_5_PRO)
    .logRequests(true)
    .logResponses(true)
    .build();

UserMessage message = UserMessage.from(
    PdfFileContent.from(Paths.get("src/test/resources/gemini-doc-snapshot.pdf").toUri()),
    TextContent.from("Provide a summary of the document")
);

ChatResponse response = model.chat(message);
```

### ツール呼び出し

```java
ChatModel model = VertexAiGeminiChatModel.builder()
        .project(PROJECT_ID)
        .location(LOCATION)
        .modelName(GEMINI_1_5_PRO)
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
        .messages(UserMessage.from("What is the weather in Paris?"))
        .toolSpecifications(weatherToolSpec)
        .build();

ChatResponse response = model.chat(request);
```

モデルはテキストメッセージではなく、ツール実行リクエストで応答します。
あなたの責任は、`ToolExecutionResultMessage`をモデルに送り返すことで、その実行リクエストの結果をモデルに提供することです。
その後、モデルはテキスト応答で返信できるようになります。

並列関数呼び出しもサポートされており、モデルが単一の応答で複数のツール実行リクエストを行うよう要求することができます。

### AiServicesによるツールサポート

`AiServices`を使用して、ツールを活用した独自のアシスタントを作成できます。
次の例では、数学計算を行う`Calculator`ツール、アシスタントの契約を指定する`Assistant`インターフェース、
そしてGemini、チャットメモリ、およびCalculatorツールを使用するように`AiServices`を構成しています。

```java
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

### Google検索結果による回答の根拠付け

LLMは必ずしもすべての質問に対する答えを知っているわけではありません！
特に最後のトレーニング以降に発生した最近のイベントや情報については、なおさらです。
Geminiの回答をGoogle検索の新鮮な結果で_根拠付け_することが可能です：

```java
var modelWithSearch = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("gemini-1.5-flash-001")
    .useGoogleSearch(true)
    .build();

String resp = modelWithSearch.chat("What is the score of yesterday's football match from Paris Saint Germain?");
```

### Vertex AI Search結果による回答の根拠付け

プライベートな内部情報、ドキュメント、データを扱う場合、
[Vertex AI Search データストア](https://cloud.google.com/generative-ai-app-builder/docs/create-data-store-es)を使用してそれらのドキュメントを保持できます。
そして、Geminiの回答をそれらのドキュメントで根拠付けることができます：

```java
var modelWithSearch = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("gemini-1.5-flash-001")
    .vertexSearchDatastore("name_of_the_datastore")
    .build();
```

### JSON構造化出力

Geminiに有効なJSON出力のみを返すよう依頼できます：

```java
var modelWithResponseMimeType = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("gemini-1.5-flash-001")
    .responseMimeType("application/json")
    .build();

String userMessage = "Return JSON with two fields: name and surname of Klaus Heisler.";
String jsonResponse = modelWithResponseMimeType.chat(userMessage).content().text();
// {"name": "Klaus", "surname": "Heisler"}
```

### JSONスキーマによる厳格なJSON構造化出力

`responseMimeType("application/json")`を使用しても、プロンプトが希望するJSON出力を正確に記述していない場合、
モデルは応答方法において少し創造的になる可能性があります。
より厳格なJSON構造化出力を確保するために、応答のJSONスキーマを指定できます：

```java
Schema schema = Schema.newBuilder()
    .setType(Type.OBJECT)
    .putProperties("name", Schema.newBuilder()
        .setType(Type.STRING)
        .build())
    .putProperties("address", Schema.newBuilder()
        .setType(Type.OBJECT)
        .putProperties("street", 
            Schema.newBuilder().setType(Type.STRING).build())
        .putProperties("zipcode",
           Schema.newBuilder().setType(Type.STRING).build())
    .build())
.build();

var model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName(GEMINI_1_5_PRO)
    .responseMimeType("application/json")
    .responseSchema(Schema)
    .build();
```

Javaクラス用のスキーマを生成する便利なメソッドもあります：

```java
class Artist {
    public String artistName;
    int artistAge;
    protected boolean artistAdult;
    private String artistAddress;
    public Pet[] pets;
}

class Pet {
    public String name;
}

Schema schema = SchemaHelper.fromClass(Artist.class);

var model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName(GEMINI_1_5_PRO)
    .responseMimeType("application/json")
    .responseSchema(schema)
    .build();
```

JSONスキーマ文字列からスキーマを作成する別のメソッドもあります：
`SchemaHelper.fromJson(...)`。

Geminiは構造化出力としてJSONオブジェクトと配列の両方をサポートしていますが、
出力としてのJSON文字列列挙型という特別なケースもあります。
これは、Geminiに分類タスク（感情分析など）を依頼する場合に特に興味深いものです：

```java
var model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName(GEMINI_1_5_PRO)
    .logRequests(true)
    .logResponses(true)
    .responseSchema(Schema.newBuilder()
        .setType(Type.STRING)
        .addAllEnum(Arrays.asList("POSITIVE", "NEUTRAL", "NEGATIVE"))
        .build())
    .build();
```

この場合、暗黙的なレスポンスMIMEタイプは`text/x.enum`に設定されます
（これは公式に登録されたMIMEタイプではありません）。

### 安全設定の指定

有害なコンテンツをフィルタリングまたはブロックしたい場合は、異なるしきい値レベルで安全設定を設定できます：

```java
HashMap<HarmCategory, SafetyThreshold> safetySettings = new HashMap<>();
safetySettings.put(HARM_CATEGORY_HARASSMENT, BLOCK_LOW_AND_ABOVE);
safetySettings.put(HARM_CATEGORY_DANGEROUS_CONTENT, BLOCK_ONLY_HIGH);
safetySettings.put(HARM_CATEGORY_SEXUALLY_EXPLICIT, BLOCK_MEDIUM_AND_ABOVE);

var model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("gemini-1.5-flash-001")
    .safetySettings(safetySettings)
    .logRequests(true)
    .logResponses(true)
    .build();
```

## 参考資料

[利用可能なロケーション](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations#available-regions)

[マルチモーダル機能](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/overview#multimodal_models)


## 例

- [Google Vertex AI Gemini の例](https://github.com/langchain4j/langchain4j-examples/tree/main/vertex-ai-gemini-examples/src/main/java)
