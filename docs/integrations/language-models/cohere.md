---
sidebar_position: 23
---

# Cohere

:::note

これはコミュニティ版 `Cohere` チャットモデル統合のドキュメントです。

[Cohere の V2 Chat API](https://docs.cohere.com/reference/chat) に基づいて実装されています。
:::

## Maven依存関係

`1.0.0-alpha1` 以降：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-cohere</artifactId>
    <version>${latest version here}</version>
</dependency>
```

または、BOM を使って依存関係を一貫して管理できます：

```xml
<dependencyManagement>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-community-bom</artifactId>
        <version>${latest version here}</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
</dependencyManagement>
```

## チャットモデルのサポート

次のコードで `CohereChatModel` をインスタンス化できます：

```java
ChatModel model = CohereChatModel.builder()
        .apiKey(System.getenv("CO_API_KEY"))
        .modelName("command-r7b-12-2024")
        .logRequests(true)
        .logResponses(true)
        .build();
```

ストリーミングレスポンスには `CohereStreamingChatModel` を使用します：

```java
StreamingChatModel streamingModel = CohereStreamingChatModel.builder()
        .apiKey(System.getenv("CO_API_KEY"))
        .modelName("command-r7b-12-2024")
        .logRequests(true)
        .logResponses(true)
        .build();
```

## 設定可能なパラメータ

`CohereChatModel` と `CohereStreamingChatModel` は次のパラメータを受け付けます：

| プロパティ                       | 説明                                                                                          | デフォルト値                     |
|----------------------------|---------------------------------------------------------------------------------------------|----------------------------|
| `baseUrl`                  | Cohere API への接続 URL。                                                                        | https://api.cohere.com/v2/ |
| `apiKey`                   | API キー。                                                                                      |                            |
| `modelName`                | 使用するモデル。例：`command-r7b-12-2024` または `command-r-plus`。                                         |                            |
| `timeout`                  | リクエストの HTTP クライアントタイムアウト。                                                                     |                            |
| `maxRetries`               | リクエストごとの最大リトライ回数。`CohereChatModel` でのみ利用可能。                                                   | 3                          |
| `temperature`              | サンプリング温度。                                                                                   |                            |
| `topP`                     | Nucleus sampling のしきい値。                                                                     |                            |
| `topK`                     | 各ステップで最も可能性の高い `topK` 個のトークンにサンプリングを制限します。                                                   |                            |
| `frequencyPenalty`         | 出現頻度に基づくトークンへのペナルティ。                                                                          |                            |
| `presencePenalty`          | 少なくとも 1 回出現したトークンへのペナルティ。                                                                    |                            |
| `maxTokens`                | このリクエストで返される最大トークン数。                                                                          |                            |
| `stopSequences`            | モデルがそれ以上のテキスト生成を停止するシーケンス。                                                                    |                            |
| `toolSpecifications`       | モデルが呼び出せるツール（関数）定義。                                                                           |                            |
| `toolChoice`               | モデルのツール選択方法を制御する `ToolChoice`。可能な値：`AUTO`、`REQUIRED`。                                         |                            |
| `responseFormat`           | レスポンス形式。例：`TEXT` または `JSON`。                                                                 |                            |
| `thinkingType`             | 推論対応モデル向けの拡張思考を有効/無効にする `CohereThinkingType`。                                                   |                            |
| `thinkingTokenBudget`      | モデルが内部思考に使える最大トークン数。                                                                          |                            |
| `safetyMode`               | プロンプトに挿入される `CohereSafetyMode`。可能な値：`CONTEXTUAL`、`STRICT`、`OFF`。                              |                            |
| `priority`                 | Cohere API が高負荷のときのリクエスト優先度。                                                                 |                            |
| `seed`                     | 設定すると、モデルは決定論的にトークンをサンプリングします。                                                                |                            |
| `logprobs`                 | レスポンスにトークンの対数確率を含めるかどうか。                                                                      |                            |
| `strictTools`              | ツール定義への厳格な準拠を強制するかどうか。                                                                        |                            |
| `defaultRequestParameters` | すべてのリクエストに適用されるデフォルトの `ChatRequestParameters`。                                                |                            |
| `listeners`                | リクエスト、レスポンス、エラーを監視するリスナー。                                                                     |                            |
| `logRequests`              | リクエストをログ出力するかどうか。                                                                             | `false`                    |
| `logResponses`             | レスポンスをログ出力するかどうか。                                                                             | `false`                    |

## レスポンスメタデータ

Cohere 固有のレスポンスメタデータにアクセスできます：

```java
ChatResponse response = model.chat(UserMessage.from("Hello"));
CohereChatResponseMetadata metadata = (CohereChatResponseMetadata) response.metadata();

List<CohereLogprobs> logprobs = metadata.logprobs();
CohereBilledUnits billedUnits = metadata.billedUnits();
Integer cachedTokens = metadata.cachedTokens();
```

| プロパティ          | 説明                                                              |
|----------------|-----------------------------------------------------------------|
| `logprobs`     | 生成トークンの対数確率。`logprobs` が有効なときに返されます。                             |
| `billedUnits`  | リクエストの課金内訳（入力トークン、出力トークン、検索ユニット、分類）。                             |
| `cachedTokens` | Cohere のプロンプトキャッシュから提供されたトークン数。                                 |

## 例

- [CohereChatModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-cohere/src/test/java/dev/langchain4j/community/model/cohere/common/CohereChatModelIT.java)
- [CohereStreamingChatModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-cohere/src/test/java/dev/langchain4j/community/model/cohere/common/CohereStreamingChatModelIT.java)
