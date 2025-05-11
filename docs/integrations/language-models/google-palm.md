---
sidebar_position: 9
---

# Google Vertex AI PaLM 2

:::note
「Bison」モデルはGoogleによって廃止されました。
したがって、`VertexAiChatModel`と`VertexAiLanguageModel`は現在非推奨となり、
将来のバージョンで削除される予定です。
代わりに[`langchain4j-vertex-ai-gemini`](/integrations/language-models/google-vertex-ai-gemini)モジュールの
`VertexAiGeminiChatModel`を使用する「Gemini」モデルのいずれかを使用してください。
:::

## はじめに

始めるには、[Vertex AI Gemini統合チュートリアル](/integrations/language-models/google-vertex-ai-gemini)の「はじめに」セクションに記載されている手順に従って、
Google Cloud Platformアカウントを作成し、Vertex AI APIにアクセスできる新しいプロジェクトを設定してください。

## 依存関係の追加

プロジェクトの`pom.xml`に次の依存関係を追加します：

```xml
<dependency>
  <groupId>dev.langchain4j</groupId>
  <artifactId>langchain4j-vertex-ai</artifactId>
  <version>1.0.0-beta4</version>
</dependency>
```

またはプロジェクトの`build.gradle`に：

```groovy
implementation 'dev.langchain4j:langchain4j-vertex-ai:1.0.0-beta4'
```

### サンプルコードを試す：

[Vertex AI埋め込みモデルを使用する例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/embedding/model/VertexAiEmbeddingModelExample.java)

`PROJECT_ID`フィールドは、新しいGoogle Cloudプロジェクトを作成するときに設定した変数を表します。

```java
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.vertexai.VertexAiChatModel;

public class ChatModelExample {

    private static final String PROJECT_ID = "YOUR-PROJECT-ID";
    // `chat-bison`はPaLM2汎用チャットモデルを意味します
    private static final String MODEL_NAME = "chat-bison";

    public static void main(String[] args) {
        ChatModel model = VertexAiChatModel.builder()
            .endpoint("us-central1-aiplatform.googleapis.com:443")
            .location("us-central1")
            .publisher("google")
            .project(PROJECT_ID)
            .modelName(MODEL_NAME)
            .temperature(0.0)
            .build();

        ChatResponse response = model.chat(
            UserMessage.from(
                "あなたがどのような言語モデルであるかを数文で説明してください：\n" +
                "あなたのコードネームは何か数文で説明してください："
            )
        );
        System.out.println(response.aiMessage().text());

        // 私はGoogleによってトレーニングされた大規模言語モデルです。
        // 私はテキストとコードの膨大なデータセットでトレーニングされた
        //     トランスフォーマーベースの言語モデルです。
        // 私は人間の言語を理解して生成することができ、
        //     さまざまなプログラミング言語でコードを書くこともできます。
        //
        // 私のコードネームはPaLM 2で、Pathways Language Model 2の略です。

    }

}
```

### 利用可能なチャットモデル

チャットモデルは、モデルがチャット内の以前のメッセージを追跡し、新しい応答を生成するためのコンテキストとして使用するマルチターンチャット向けに最適化されています。

|モデル名|説明| プロパティ                                                    |
|----------|-----------|---------------------------------------------------------------|
|chat-bison|マルチターン会話のユースケース向けに微調整されています。| 最大入力トークン: 8192. 最大出力トークン: 2048       |
|chat-bison-32k|マルチターン会話のユースケース向けに微調整されています。| 最大トークン (入力 + 出力): 32,768. 最大出力トークン: 8,192 |
|codechat-bison|コード関連の質問を支援するチャットボット会話向けに微調整されたモデルです。| 最大入力トークン: 6144. 最大出力トークン: 1024       |
|codechat-bison-32k|コード関連の質問を支援するチャットボット会話向けに微調整されたモデルです。| 最大トークン (入力 + 出力): 32,768. 最大出力トークン: 8,192 |

`chat-bison`のような単純なモデル名を使用するか、`chat-bison@002`のような安定バージョンを指定することができます。

### 利用可能なテキストモデル

テキストモデルは、分類、要約、抽出、コンテンツ作成、アイデア創出などの自然言語タスクの実行に最適化されています。

`text-bison`、`text-bison-32k`、`text-unicorn`などのテキストモデルには、[クラス](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-vertex-ai/src/test/java/dev/langchain4j/model/vertexai/VertexAiLanguageModelIT.java)の`VertexAiLanguageModel`を使用してください。

## 参考資料

[Vertex AI PaLM 2モデルに関するGoogleのコードラボ](https://codelabs.developers.google.com/codelabs/genai-text-gen-java-palm-langchain4j)

[PaLM2生成モデル](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#palm-models)

[モデル命名の説明](https://cloud.google.com/vertex-ai/generative-ai/docs/language-model-overview#model_naming_scheme)

[利用可能なPaLM安定バージョン](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versioning#palm-stable-versions-available)


## 例

- [VertexAiChatModelIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-vertex-ai/src/test/java/dev/langchain4j/model/vertexai/VertexAiChatModelIT.java)
- [VertexAiLanguageModelIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-vertex-ai/src/test/java/dev/langchain4j/model/vertexai/VertexAiLanguageModelIT.java)
