---
sidebar_position: 29
---

# Kotlinサポート

[Kotlin](https://kotlinlang.org)はJVM（およびその他のプラットフォーム）を対象とする静的型付け言語で、Javaライブラリとの[相互運用性](https://kotlinlang.org/docs/reference/java-interop.html)を備えた簡潔でエレガントなコードを可能にします。
LangChain4jはKotlinの[拡張機能](https://kotlinlang.org/docs/extensions.html)と[型安全ビルダー](https://kotlinlang.org/docs/type-safe-builders.html)を活用して、Java APIをKotlin固有の便利な機能で強化します。これにより、ユーザーは既存のJavaクラスをKotlin向けにカスタマイズした追加機能で拡張できます。
    
## はじめに

プロジェクトの依存関係に`langchain4j-kotlin`モジュールを追加します：
```xml
 <dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-kotlin</artifactId>
    <version>[LATEST_VERSION]</version>
</dependency>
```

データクラスを使用する場合は、クラスパスに[Jackson module kotlin](https://github.com/FasterXML/jackson-module-kotlin)があることを確認してください。Mavenの場合、ランタイム依存関係を追加します：

```xml
 <dependency>
    <groupId>com.fasterxml.jackson.module</groupId>
    <artifactId>jackson-module-kotlin</artifactId>
    <version>[LATEST_VERSION]</version>
    <scope>runtime</scope>
</dependency>
```

## ChatModel拡張機能

このKotlinコードは、[コルーチンとサスペンド関数](https://kotlinlang.org/docs/coroutines-basics.html)と[型安全ビルダー](https://kotlinlang.org/docs/type-safe-builders.html)を使用してLangChain4jの[`ChatModel`](https://docs.langchain4j.dev/tutorials/chat-and-language-models)と対話する方法を示しています。

```kotlin
val model = OpenAiChatModel.builder()
    .apiKey("YOUR_API_KEY")
    // その他の設定パラメータはこちら...
    .build()

CoroutineScope(Dispatchers.IO).launch {
    val response = model.chat {
        messages += systemMessage("あなたは役立つアシスタントです")
        messages += userMessage("こんにちは！")
        parameters {
            temperature = 0.7
        }
    }
    println(response.aiMessage().text())
}
```

対話はKotlinの**コルーチン**を使用して非同期的に行われます：
- `CoroutineScope(Dispatchers.IO).launch`：ネットワークやファイルI/Oなどのブロッキングタスクに最適化された[IOディスパッチャー](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-i-o.html)でプロセスを実行します。これにより、呼び出しスレッドがブロックされるのを防ぎ、応答性を確保します。
- `model.chat`はサスペンド関数で、ビルダーブロックを使用してチャットリクエストを構造化します。このアプローチによりボイラープレートが減少し、コードの可読性と保守性が向上します。

高度なシナリオでは、カスタム`ChatRequestParameters`をサポートするために、型安全ビルダー関数はカスタムビルダーを受け入れます：
```kotlin
fun <B : DefaultChatRequestParameters.Builder<*>> parameters(
    builder: B = DefaultChatRequestParameters.builder() as B,
    configurer: ChatRequestParametersBuilder<B>.() -> Unit
)
```
使用例：
```kotlin
 model.chat {
    messages += systemMessage("あなたは役立つアシスタントです")
    messages += userMessage("こんにちは！")
    parameters(OpenAiChatRequestParameters.builder()) {
        temperature = 0.7 // DefaultChatRequestParameters.Builderプロパティ
        builder.seed(42) // OpenAiChatRequestParameters.Builderプロパティ
    }
}
```

## ストリーミングのユースケース

`StreamingChatModel`拡張機能は、AIモデルによって生成されるレスポンスを段階的に処理する必要があるユースケースに機能を提供します。これは、チャットインターフェース、ライブエディタ、またはトークンごとのストリーミング対話を必要とするシステムなど、リアルタイムフィードバックを必要とするアプリケーションで特に有用です。
Kotlinコルーチンを使用して、`chatFlow`拡張関数は言語モデルからのストリーミングレスポンスを構造化されたキャンセル可能な`Flow`シーケンスに変換し、コルーチンフレンドリーなノンブロッキング実装を可能にします。


以下は`chatFlow`を使用した完全な対話の実装方法です：
```kotlin
val flow = model.chatFlow { // 非ストリーミングシナリオと同様
    messages += userMessage("ストリーミングの仕組みを説明してもらえますか？")
    parameters { // ChatRequestParameters
        temperature = 0.7
        maxOutputTokens = 42
    }
}

runBlocking { // コルーチンコンテキストで実行する必要があります
    flow.collect { reply ->
        when (reply) {
            is StreamingChatModelReply.PartialResponse -> {
                print(reply.partialResponse) // 到着したらすぐに出力をストリーム
            }
            is StreamingChatModelReply.CompleteResponse -> {
                println("\n完了: ${reply.response.aiMessage().text()}")
            }
            is StreamingChatModelReply.Error -> {
                println("エラーが発生しました: ${reply.cause.message}")
            }
        }
    }
}
```

例として[このテスト](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-kotlin/src/test/kotlin/dev/langchain4j/kotlin/model/chat/StreamingChatModelExtensionsKtTest.kt)をご覧ください。

## コンパイラの互換性

Kotlinでツールを定義する場合、メソッドパラメータに対するJavaリフレクションのためのメタデータを保持するように、Kotlinコンパイルが[`javaParameters`](https://kotlinlang.org/docs/gradle-compiler-options.html#attributes-specific-to-jvm)を`true`に設定するように構成されていることを確認してください。この設定は、ツール仕様で正しい引数名を維持するために必要です。

Gradleを使用する場合、以下の設定で実現できます：
```kotlin
kotlin {
    compilerOptions {
        javaParameters = true
    }
}
```
