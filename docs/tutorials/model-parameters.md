---
sidebar_position: 4
---

# モデルパラメータ

選択するモデルとプロバイダーによって、以下を定義する多数のパラメータを調整できます：
- モデルの出力：生成されるコンテンツ（テキスト、画像）の創造性または決定論的なレベル、
生成されるコンテンツの量など。
- 接続性：ベースURL、認証キー、タイムアウト、リトライ、ロギングなど。

通常、すべてのパラメータとその意味はモデルプロバイダーのウェブサイトで確認できます。
例えば、OpenAI APIのパラメータは https://platform.openai.com/docs/api-reference/chat
（最新バージョン）で確認でき、以下のようなオプションが含まれています：

| パラメータ          | 説明                                                                                                                                                                                | 型        |
|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| `modelName`        | 使用するモデルの名前（例：gpt-4o、gpt-4o-miniなど）                                                                                                                                   | `String`  |
| `temperature`      | 使用するサンプリング温度（0〜2の間）。0.8のような高い値は出力をよりランダムにし、0.2のような低い値はより焦点を絞った決定論的な出力にします。                                                | `Double`  |
| `maxTokens`        | チャット補完で生成できるトークンの最大数。                                                                                                                                            | `Integer` |
| `frequencyPenalty` | -2.0から2.0の間の数値。正の値は、これまでのテキストでの既存の頻度に基づいて新しいトークンにペナルティを与え、モデルが同じ行を逐語的に繰り返す可能性を減少させます。                        | `Double`  |
| `...`              | ...                                                                                                                                                                                | `...`     |

OpenAI LLMのパラメータの完全なリストは、[OpenAI言語モデルページ](/integrations/language-models/open-ai)を参照してください。
モデルごとのパラメータと既定値の完全なリストは、個別のモデルページ
（統合、言語モデル、画像モデルの下）で確認できます。

`*Model`を作成するには2つの方法があります：
- APIキーなどの必須パラメータのみを受け入れる静的ファクトリで、
他のすべての必須パラメータは適切なデフォルト値に設定されます。
- ビルダーパターン：ここでは、各パラメータの値を指定できます。


## モデルビルダー
ビルダーパターンを使用して、モデルの利用可能なすべてのパラメータを次のように設定できます：
```java
OpenAiChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .temperature(0.3)
        .timeout(ofSeconds(60))
        .logRequests(true)
        .logResponses(true)
        .build();
```

## Quarkusでのパラメータ設定
Quarkusアプリケーションでのlangchain4jパラメータは、`application.properties`ファイルで次のように設定できます：
```
quarkus.langchain4j.openai.api-key=${OPENAI_API_KEY}
quarkus.langchain4j.openai.chat-model.temperature=0.5
quarkus.langchain4j.openai.timeout=60s
```

興味深いことに、デバッグ、調整、あるいは利用可能なすべてのパラメータを知るためには、
quarkus DEV UIを見ることができます。
このダッシュボードでは、実行中のインスタンスにすぐに反映される変更を行うことができ、
変更は自動的にコードに移植されます。
DEV UIは、`quarkus dev`コマンドでQuarkusアプリケーションを実行することでアクセスでき、
localhost:8080/q/dev-ui（またはアプリケーションをデプロイする場所）で見つけることができます。

[![](/img/quarkus-dev-ui-parameters.png)](/tutorials/model-parameters)

Quarkus統合の詳細については[こちら](/tutorials/quarkus-integration)を参照してください。

## Spring Bootでのパラメータ設定
[Spring Bootスターター](https://github.com/langchain4j/langchain4j-spring)のいずれかを使用している場合、
`application.properties`ファイルでモデルパラメータを次のように設定できます：
```
langchain4j.open-ai.chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.chat-model.model-name=gpt-4-1106-preview
...
```
サポートされているプロパティの完全なリストは
[こちら](https://github.com/langchain4j/langchain4j-spring/blob/main/langchain4j-open-ai-spring-boot-starter/src/main/java/dev/langchain4j/openai/spring/AutoConfig.java)で確認できます。

Spring Boot統合の詳細については[こちら](/tutorials/spring-boot-integration)を参照してください。
