---
sidebar_position: 20
---

# ZhiPu AI

[ZhiPu AI](https://www.zhipuai.cn/)は、テキスト生成、テキスト埋め込み、画像生成などのモデルサービスを提供するプラットフォームです。詳細については[ZhiPu AIオープンプラットフォーム](https://open.bigmodel.cn/)を参照してください。
LangChain4jは[HTTPエンドポイント](https://bigmodel.cn/dev/api/normal-model/glm-4)を使用してZhiPu AIと統合しています。HTTPエンドポイントから公式SDKへの移行を検討しており、どのような協力も歓迎します！

## Maven依存関係

LangChain4jでは、通常のJavaまたはSpring BootアプリケーションでZhiPu AIを使用できます。

### 通常のJava

:::note
`1.0.0-alpha1`以降、`langchain4j-zhipu-ai`は`langchain4j-community`に移行し、
`langchain4j-community-zhipu-ai`に名前が変更されました
:::

`1.0.0-alpha1`より前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-zhipu-ai</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1`以降：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-zhipu-ai</artifactId>
    <version>${latest version here}</version>
</dependency>
```

または、BOMを使用して依存関係を一貫して管理できます：

```xml

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-community-bom</artifactId>
            <version>${latest version here}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## 設定可能なパラメータ

### `ZhipuAiChatModel`

`ZhipuAiChatModel`を初期化する際に、次のパラメータを設定できます：

| プロパティ     | 説明                                                                                                                                                                                                                                                                  | デフォルト値                |
|----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------|
| baseUrl        | 接続先のURL。HTTPまたはWebSocketでDashScopeに接続できます                                                                                                                                                                                                              | https://open.bigmodel.cn/   |
| apiKey         | APIキー                                                                                                                                                                                                                                                              |                             |
| model          | 使用するモデル                                                                                                                                                                                                                                                        | glm-4-flash                 |
| topP           | カーネルサンプリングの確率しきい値で、モデルが生成するテキストの多様性を制御します。`top_p`が高いほど生成テキストは多様になり、低いほどその逆です。値の範囲：(0, 1.0]。通常はこの値かtemperatureのどちらか一方を変更することを推奨します。                                          |                             |
| maxRetries     | リクエストの最大リトライ回数                                                                                                                                                                                                                                            | 3                           |
| temperature    | モデルが生成するテキストの多様性を制御するサンプリング温度。temperatureが高いほど生成テキストは多様になり、低いほどその逆です。値の範囲：[0, 2)                                                                                                                                     | 0.7                         |
| stops          | stopパラメータを指定すると、モデルは指定された文字列またはtoken_idを含みそうになった時点で自動的にテキスト生成を停止します                                                                                                                                                     |                             |
| maxToken       | このリクエストで返される最大トークン数                                                                                                                                                                                                                                  | 512                         |
| listeners      | リクエスト、レスポンス、エラーをリッスンするリスナー                                                                                                                                                                                                                    |                             |
| callTimeout    | リクエスト用のOKHttpタイムアウト設定                                                                                                                                                                                                                                    |                             |
| connectTimeout | リクエスト用のOKHttpタイムアウト設定                                                                                                                                                                                                                                    |                             |
| writeTimeout   | リクエスト用のOKHttpタイムアウト設定                                                                                                                                                                                                                                    |                             |
| readTimeout    | リクエスト用のOKHttpタイムアウト設定                                                                                                                                                                                                                                    |                             |
| logRequests    | リクエストをログに記録するかどうか                                                                                                                                                                                                                                      | false                       |
| logResponses   | レスポンスをログに記録するかどうか                                                                                                                                                                                                                                      | false                       |
| doSample       | サンプリングを使用するかどうか。`false`に設定すると、モデルは貪欲復号を使用します                                                                                                                                                                                          |                             |
| toolStream     | 部分的なツールストリーミングを有効にするかどうか。`true`に設定すると、ツール呼び出しを増分的にストリームできます                                                                                                                                                                    | false                       |

### `ZhipuAiChatRequestParameters`

チャットリクエスト送信時に、`ZhipuAiChatRequestParameters`を使用して追加パラメータを設定できます：

| プロパティ | 説明                                                                                                                                                   | デフォルト値 |
|------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| doSample   | サンプリングを使用するかどうか。`false`に設定すると、モデルは貪欲復号を使用します                                                                              |              |
| toolStream | 部分的なツールストリーミングを有効にするかどうか。`true`に設定すると、ツール呼び出しを増分的にストリームできます                                                | false        |
| thinking   | 推論モードの設定。`type`は推論タイプを指定し、`clearThinking`はレスポンス内に内部思考プロセスを表示するかどうかを制御します                                    |              |

### `ZhipuAiStreamingChatModel`

`maxRetries`を除き、`ZhipuAiChatModel`と同じです。

## 例

### 通常のJava

次のコードで`ZhipuAiChatModel`を初期化できます：

```java
ChatModel model = ZhipuAiChatModel.builder()
        .apiKey("You API key here")
        .callTimeout(Duration.ofSeconds(60))
        .connectTimeout(Duration.ofSeconds(60))
        .writeTimeout(Duration.ofSeconds(60))
        .readTimeout(Duration.ofSeconds(60))
        .build();
```

または、他のパラメータをより細かくカスタマイズできます：

```java
ChatModel model = ZhipuAiChatModel.builder()
        .apiKey("You API key here")
        .model("glm-4")
        .temperature(0.6)
        .maxToken(1024)
        .maxRetries(2)
        .callTimeout(Duration.ofSeconds(60))
        .connectTimeout(Duration.ofSeconds(60))
        .writeTimeout(Duration.ofSeconds(60))
        .readTimeout(Duration.ofSeconds(60))
        .build();
```

### 推論（Reasoning）

推論モードを有効にして、モデルの内部思考プロセスを取得できます：

```java
ChatModel model = ZhipuAiChatModel.builder()
        .apiKey("You API key here")
        .model(ChatCompletionModel.GLM_4_7)  // Use GLM-4-5 or upper model for reasoning support
        .build();

ChatResponse response = model.chat(
        ChatRequest.builder()
                .messages(UserMessage.from("What is the capital of Germany?"))
                .parameters(ZhipuAiChatRequestParameters.builder()
                        .thinking(Thinking.builder()
                                .type("reasoning")
                                .clearThinking(true)
                                .build())
                        .build())
                .build());

AiMessage aiMessage = response.aiMessage();
System.out.println("Answer: "+aiMessage.text());
System.out.println("Thinking: "+aiMessage.thinking());
```

### 部分ツール呼び出し（ストリーミング）

`toolStream`を使用して、部分的なツール呼び出しを増分的にストリームできます：

```java
ZhipuAiStreamingChatModel model = ZhipuAiStreamingChatModel.builder()
        .apiKey("You API key here")
        .model(ChatCompletionModel.GLM_4_7)
        .build();

ToolSpecification calculator = ToolSpecification.builder()
        .name("calculator")
        .description("returns a sum of two numbers")
        .parameters(JsonObjectSchema.builder()
                .addIntegerProperty("first")
                .addIntegerProperty("second")
                .build())
        .build();

TestStreamingChatResponseHandler handler = new TestStreamingChatResponseHandler() {
    @Override
    public void onPartialToolCall(ToolExecutionRequest partialToolCall) {
        System.out.println("Partial tool call: " + partialToolCall.name() + " - " + partialToolCall.arguments());
    }
};

model.chat(
        ChatRequest.builder()
                .messages(UserMessage.from("2+2=?"))
                .parameters(ZhipuAiChatRequestParameters.builder()
                        .toolSpecifications(calculator)
                        .toolStream(true)
                        .build())
                .build(),
        handler);
```

### その他の例

その他の例は次を参照してください：

- [ZhipuAiChatModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-zhipu-ai/src/test/java/dev/langchain4j/community/model/zhipu/ZhipuAiChatModelIT.java)
- [ZhipuAiStreamingChatModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-zhipu-ai/src/test/java/dev/langchain4j/community/model/zhipu/ZhipuAiStreamingChatModelIT.java)
- [ZhipuAiChatModelReasoningIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-zhipu-ai/src/test/java/dev/langchain4j/community/model/zhipu/ZhipuAiChatModelReasoningIT.java)
- [ZhipuAiStreamingChatModelReasoningIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-zhipu-ai/src/test/java/dev/langchain4j/community/model/zhipu/ZhipuAiStreamingChatModelReasoningIT.java)
- [ZhipuAiStreamingPartialToolCallIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-zhipu-ai/src/test/java/dev/langchain4j/community/model/zhipu/ZhipuAiStreamingPartialToolCallIT.java)


