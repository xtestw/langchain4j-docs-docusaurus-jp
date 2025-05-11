---
sidebar_position: 11
---

# Jlama
[Jlamaプロジェクト](https://github.com/tjake/Jlama)

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
    <artifactId>langchain4j-jlama</artifactId>
    <version>1.0.0-beta4</version>
</dependency>

<dependency>
    <groupId>com.github.tjake</groupId>
    <artifactId>jlama-native</artifactId>
    <!-- より高速な推論のため。linux-x86_64、macos-x86_64/aarch_64、windows-x86_64をサポート
       OSとアーキテクチャを検出するには https://github.com/trustin/os-maven-plugin を使用 -->
    <classifier>${os.detected.name}-${os.detected.arch}</classifier>
    <version>${jlama.version}</version> <!-- langchain4j-jlama pomからのバージョン -->
</dependency>

```

Gradleプロジェクトの`build.gradle`

```groovy
implementation 'dev.langchain4j:langchain4j:{your-version}'
implementation 'dev.langchain4j:langchain4j-jlama:{your-version}'
```

### モデルの選択
[HuggingFace](https://huggingface.co/models?library=safetensors&sort=trending)のほとんどのsafetensorモデルを使用でき、`owner/model-name`形式で指定できます。
Jlamaは人気のある事前量子化モデルのリストをhttp://huggingface.co/tjakeで管理しています。

以下のアーキテクチャを使用するモデルがサポートされています：
- Gemmaモデル
- Llamaモデル
- Mistralモデル
- Mixtralモデル
- GPT-2モデル
- BERTモデル

## チャット補完
チャットモデルを使用すると、会話データで微調整されたモデルで人間のような応答を生成できます。

### 同期処理
クラスを作成し、以下のコードを追加します。

```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.jlama.JlamaChatModel;

public class HelloWorld {
    public static void main(String[] args) {
        ChatModel model = JlamaChatModel.builder()
                .modelName("tjake/TinyLlama-1.1B-Chat-v1.0-Jlama-Q4")
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
import dev.langchain4j.model.jlama.JlamaStreamingChatModel;
import dev.langchain4j.model.output.Response;

import java.util.concurrent.CompletableFuture;

public class HelloWorld {
    public static void main(String[] args) {
        StreamingChatModel model = JlamaStreamingChatModel.builder()
                .modelName("tjake/TinyLlama-1.1B-Chat-v1.0-Jlama-Q4")
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

もちろん、Jlamaチャット補完と[モデルパラメータの設定](/tutorials/model-parameters)や[チャットメモリ](/tutorials/chat-memory)などの他の機能を組み合わせて、より正確な応答を得ることができます。

[チャットメモリ](/tutorials/chat-memory)では、チャット履歴を渡す方法を学び、LLMが以前に何が言われたかを知ることができます。この単純な例のようにチャット履歴を渡さない場合、LLMは以前に何が言われたかを知らないため、2番目の質問（「私が今何を尋ねましたか？」）に正しく答えることができません。

タイムアウト、モデルタイプ、モデルパラメータなど、多くのパラメータが背後で設定されています。
[モデルパラメータの設定](/tutorials/model-parameters)では、これらのパラメータを明示的に設定する方法を学びます。


Jlamaには設定できる特別なモデルパラメータがいくつかあります

 - `modelCachePath`パラメータ：ダウンロード後にモデルがキャッシュされるディレクトリのパスを指定できます。デフォルトは`~/.jlama`です。
 - `workingDirectory`パラメータ：特定のモデルインスタンスの永続的なChatMemoryをディスク上に保持できます。これはチャットメモリを使用するよりも高速です。
 - `quantizeModelAtRuntime`パラメータ：実行時にモデルを量子化します。現在の量子化は常にQ4です。jlamaプロジェクトツールを使用してモデルを事前に量子化することもできます（詳細は[Jlamaプロジェクト](https://github.com/tjake/jlama)を参照）。

### 関数呼び出し
Jlamaは、それをサポートするモデル（Mistral、Llama-3.1など）の関数呼び出しをサポートしています。
[Jlamaの例](https://github.com/langchain4j/langchain4j-examples/tree/main/jlama-examples)を参照してください。

### JSONモード
Jlamaは（まだ）JSONモードをサポートしていません。しかし、モデルにJSONを返すよう丁寧に依頼することは常に可能です。

## 例

- [Jlamaの例](https://github.com/langchain4j/langchain4j-examples/tree/main/jlama-examples)
