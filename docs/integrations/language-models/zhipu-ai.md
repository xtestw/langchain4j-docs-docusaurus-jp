---
sidebar_position: 19
---

# ZhiPu AI

[ZhiPu AI](https://www.zhipuai.cn/)は、テキスト生成、テキスト埋め込み、画像生成などのモデルサービスを提供するプラットフォームです。詳細については[ZhiPu AIオープンプラットフォーム](https://open.bigmodel.cn/)を参照してください。
LangChain4jは[HTTPエンドポイント](https://bigmodel.cn/dev/api/normal-model/glm-4)を使用してZhiPu AIと統合しています。
HTTPエンドポイントから公式SDKへの移行を検討しており、どのような協力も歓迎します！

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
    <version>1.0.0-beta4</version>
</dependency>
```

または、BOMを使用して依存関係を一貫して管理することもできます：

```xml

<dependencyManagement>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-community-bom</artifactId>
        <version>1.0.0-beta4</version>
        <typ>pom</typ>
        <scope>import</scope>
    </dependency>
</dependencyManagement>
```

## 設定可能なパラメータ

### `ZhipuAiChatModel`

`ZhipuAiChatModel`を初期化する際に設定できるパラメータは以下の通りです：

| プロパティ      | 説明                                                                                                                                                                                                                                                                  | デフォルト値               |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------|
| baseUrl        | 接続先のURL。HTTPまたはWebSocketを使用してDashScopeに接続できます                                                                                                                                                                                                 | https://open.bigmodel.cn/ |
| apiKey         | APIキー                                                                                                                                                                                                                                                                  |                           |
| model          | 使用するモデル                                                                                                                                                                                                                                                            | glm-4-flash               |
| topP           | カーネルサンプリングの確率閾値で、モデルが生成するテキストの多様性を制御します。`top_p`が高いほど生成されるテキストの多様性が高くなり、逆もまた然りです。値の範囲：(0, 1.0]。一般的にはこれまたは温度のいずれかを変更することをお勧めしますが、両方は変更しないでください。 |                           |
| maxRetries     | リクエストの最大再試行回数                                                                                                                                                                                                                                           | 3                         |
| temperature    | モデルが生成するテキストの多様性を制御するサンプリング温度。温度が高いほど生成されるテキストの多様性が高くなり、逆もまた然りです。値の範囲：[0, 2)                                                                                    | 0.7                       |
| stops          | stopパラメータを使用すると、モデルは指定された文字列またはtoken_idを含む可能性がある場合に自動的にテキスト生成を停止します。                                                                                                                                     |                           |
| maxToken       | このリクエストで返されるトークンの最大数。                                                                                                                                                                                                                                       | 512                       |
| listeners      | リクエスト、レスポンス、エラーをリッスンするリスナー。                                                                                                                                                                                                                      |                           |
| callTimeout    | リクエストのためのOKHttpタイムアウト設定                                                                                                                                                                                                                                            |                           |
| connectTimeout | リクエストのためのOKHttpタイムアウト設定                                                                                                                                                                                                                                            |                           |
| writeTimeout   | リクエストのためのOKHttpタイムアウト設定                                                                                                                                                                                                                                            |                           |
| readTimeout    | リクエストのためのOKHttpタイムアウト設定                                                                                                                                                                                                                                            |                           |
| logRequests    | リクエストをログに記録するかどうか                                                                                                                                                                                                                                                | false                     |
| logResponses   | レスポンスをログに記録するかどうか                                                                                                                                                                                                                                               | false                     |

### `ZhipuAiStreamingChatModel`

`maxRetries`を除いて`ZhipuAiChatModel`と同じです。

## 例

### 通常のJava

以下のコードを使用して`ZhipuAiChatModel`を初期化できます：

```java
ChatModel qwenModel = ZhipuAiChatModel.builder()
                    .apiKey("You API key here")
                    .callTimeout(Duration.ofSeconds(60))
                    .connectTimeout(Duration.ofSeconds(60))
                    .writeTimeout(Duration.ofSeconds(60))
                    .readTimeout(Duration.ofSeconds(60))
                    .build();
```

または他のパラメータをより詳細にカスタマイズする場合：

```java
ChatModel qwenModel = ZhipuAiChatModel.builder()
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

### その他の例

以下でより多くの例を確認できます：

- [ZhipuAiChatModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-zhipu-ai/src/test/java/dev/langchain4j/community/model/zhipu/ZhipuAiChatModelIT.java)
- [ZhipuAiStreamingChatModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-zhipu-ai/src/test/java/dev/langchain4j/community/model/zhipu/ZhipuAiStreamingChatModelIT.java)
