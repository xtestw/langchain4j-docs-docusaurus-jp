---
title: OpenAI 互換言語モデル
sidebar_position: 17
---

# OpenAI 互換言語モデル

多くのサービスやツールが OpenAI 互換 API を公開しています。LangChain4j でそれらを使う一般的な手順は次のとおりです：

1.  **Base URL を特定する：** サービスの API エンドポイントを見つけます。多くの場合 `/v1` で終わります。
2.  **API Key を取得する：** サービスが認証を必要とする場合は API キーを取得します。ローカルサービスでキーが不要な場合は、`apiKey` パラメータにプレースホルダーを入れてください。
3.  **モデル名を指定する：** サービスで使う正しいモデル名を確認します。多くの場合必須です。
4.  **`OpenAiChatModel` または `OpenAiStreamingChatModel` を設定する：**

    ```java
    ChatModel model = OpenAiChatModel.builder()
            .baseUrl("YOUR_API_BASE_URL") // e.g., "http://localhost:8000/v1"
            .apiKey("YOUR_API_KEY_OR_PLACEHOLDER") // e.g., "sk-yourkey" or "none"
            .modelName("MODEL_NAME_AS_PER_PROVIDER_DOCS") // e.g., "gpt-3.5-turbo" or custom name
            // Add other configurations like temperature, timeout, etc. as needed
            .logRequests(true)
            .logResponses(true)
            .build();
    ```

### 特定の OpenAI 互換 API 向け設定

一部の OpenAI 互換 API は、特にツール呼び出しにおけるストリーミング応答の挙動が異なる場合があります。LangChain4j はこれらの違いに対応する設定オプションを提供します：

#### `accumulateToolCallId`（`OpenAiStreamingChatModel` 用）

ストリーミング応答におけるツール呼び出し ID の扱いを制御します。デフォルトは `true` です。

- **有効（`true`）**：ツール呼び出し ID はストリーミングチャンク間で蓄積されます（標準の OpenAI 挙動）
    - 例：チャンク 1 が "abc"、チャンク 2 が "def" → 最終 ID："abcdef"
- **無効（`false`）**：各チャンクのツール呼び出し ID が前のものを置き換えます
    - 例：チャンク 1 が "abc"、チャンク 2 が "abc" → 最終 ID："abc"
    - すべてのチャンクで完全なツール呼び出し ID を送る DeepSeek や Qwen などの API で使用します

```java
StreamingChatModel model = OpenAiStreamingChatModel.builder()
        .baseUrl("https://api.deepseek.com/v1") // or other provider
        .apiKey("YOUR_API_KEY")
        .modelName("deepseek-chat")
        .accumulateToolCallId(false) // Set to false for DeepSeek, Qwen, etc.
        .build();
    ```
以下では、Tuning Engines、Groq、Docker Model Runner、GPT4All、Ollama、LM Studio を含む、人気の OpenAI 互換 API 向けの具体例を示します。

### 目次：
- [OpenAI 互換言語モデルを使う前提条件](#prerequisites-for-using-openai-compatible-language-models)
- [Tuning Engines](#tuning-engines)
- [Groq](#groq)
- [Docker Model Runner](#docker-model-runner)
- [GPT4All](#gpt4all)
- [Ollama](#ollama)
- [LM Studio](#lm-studio)

## OpenAI 互換言語モデルを使う前提条件

LangChain4j の OpenAI モジュールは、ローカルおよびクラウドベースのソリューションを含む、さまざまな OpenAI 互換 API で利用できます。以下の各モデルについて、[標準の OpenAI 例](https://github.com/langchain4j/langchain4j-examples/blob/main/open-ai-examples/src/main/java/OpenAiChatModelExamples.java) と同様にモデルとチャットできる `ChatModel` の作成方法を示します。

まず、`pom.xml` または Gradle ビルドファイルに OpenAI モジュールがあることを確認してください：

### プレーン Java
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>1.18.1</version>
</dependency>
```

### Spring Boot
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## Tuning Engines

**デプロイ：** SaaS（キー必須）

**説明：** [Tuning Engines](https://www.tuningengines.com/) は、モデルプロバイダーの前に置ける OpenAI 互換エンドポイントを公開します。LangChain4j はアプリケーションとエージェントロジックを保持し、エンドポイント側でルーティング、ポリシー制御、監査ログ、トレース、承認、コスト可視化を集中管理できます。

```java
ChatModel model = OpenAiChatModel.builder()
        .baseUrl("https://api.tuningengines.com/v1")
        .apiKey(System.getenv("TUNING_ENGINES_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();
```

## Groq

**デプロイ：** SaaS（キー必須）

**説明：** Groq は LLM 向けに非常に高速な推論を提供します。

**セットアップ：**
Groq を使うには [GroqCloud](https://console.groq.com/keys) の API キーが必要です。

LangChain4j の `OpenAiChatModel` または `OpenAiStreamingChatModel` を設定します：
```java
ChatModel model = OpenAiChatModel.builder()
        .baseUrl("https://api.groq.com/openai/v1")
        .apiKey(System.getenv("GROQ_API_KEY")) // Or your actual key
        .modelName("llama3-8b-8192") // Or any other model offered by Groq, e.g., mixtral-8x7b-32768, llama3-70b-8192
        .temperature(0.0)
        .build();
```
利用可能なモデル名は [Groq モデルページ](https://console.groq.com/docs/models) で確認できます。

## Docker Model Runner

**デプロイ：** ローカル

**説明：** Docker Model Runner を使うと、Docker Desktop で LLM をローカル実行できます（内部で `llama.cpp` を使い、CPU も利用可能）。開発、テスト、オフライン利用に便利です。Mac と Windows で動作します。

**セットアップ：**

1. Docker Desktop をインストールする
2. Docker Desktop で Docker Model Runner 機能を有効にする（Settings > Experimental Features > Enable Docker Model Runner）
3. その直下で "Enable host-side TCP support" にチェックを入れる。
4. Docker Model Runner CLI でモデルを pull する。例：`docker model pull ai/qwen3`、または [この一覧](https://hub.docker.com/u/ai) の他のモデル。

`ai/qwen3` の例（モデルの詳細は [こちら](https://hub.docker.com/r/ai/qwen3)）：

```java
ChatModel model = OpenAiChatModel.builder()
        .baseUrl("http://localhost:12434/engines/llama.cpp/v1")
        .modelName("ai/qwen3")
        .build();
```
一部のモデルはツール呼び出しをサポートします。詳細は docker モデルページを参照してください。

## GPT4All

**デプロイ：** ローカル

**説明：** GPT4All は、マシン上でオープンソース LLM を実行するデスクトップアプリケーションを提供します。OpenAI 互換 API を公開することもできます。

**セットアップ：**
1. [https://gpt4all.io/](https://gpt4all.io/) から GPT4All をダウンロードしてインストールします。
2. GPT4All を起動し、UI から目的のモデルをダウンロードします（例：`llama-3.2-1b-instruct`）。
3. GPT4All 設定で "Web Server" モードを有効にします（"Settings" > "Application" > Advanced 配下："Enable Local API Server"）。
4. GPT4All に表示される IP アドレスとポートを控えます（通常は `http://localhost:4891/v1`）。
5. LangChain4j を設定します：
```java
ChatModel model = OpenAiChatModel.builder()
        .baseUrl("http://localhost:4891/v1")
        .modelName("llama-3.2-1b-instruct") // The model name might be derived from the model loaded in GPT4All UI or configurable. Check GPT4All docs.
        .build();
```

## Ollama

LangChain4j には専用の `langchain4j-ollama` モジュールがありますが（[Ollama ドキュメント](./ollama.md) を参照）、上記のように OpenAI モジュールを使って Ollama の OpenAI 互換エンドポイントに接続することもできます。

**デプロイ：** ローカル

**説明：** Ollama を使うと、Llama 3、Mistral などのオープンソース大規模言語モデルをローカルで実行できます。OpenAI 互換 API エンドポイントを提供します。

**セットアップ：**
1. [https://ollama.ai/](https://ollama.ai/) から Ollama をインストールします。
2. コマンドラインでモデルを pull します：`ollama pull <model_name>`（例：`ollama pull gemma3`）。
3. Ollama が稼働していることを確認します。`http://localhost:11434/v1/` で OpenAI 互換 API を提供します。
4. LangChain4j を設定します：
```java
ChatModel model = OpenAiChatModel.builder()
        .baseUrl("http://localhost:11434/v1/")
        .modelName("gemma3")
        .build();
```

**例：**
*   OpenAI 互換エンドポイントの利用では、一般的な OpenAI の例を応用してください。
*   専用 Ollama モジュールの利用：[langchain4j-examples/.../OllamaChatModelExamples.java](https://github.com/langchain4j/langchain4j-examples/blob/main/src/main/java/dev/langchain4j/model/ollama/OllamaChatModelExamples.java)


## LM Studio

**デプロイ：** ローカル

**説明：** LM Studio は、ローカル LLM の発見、ダウンロード、実行のための UI を提供します。OpenAI 互換のローカルサーバー機能もあります。

**セットアップ：**
1. [https://lmstudio.ai/](https://lmstudio.ai/) から LM Studio をダウンロードしてインストールします。
2. LM Studio UI（Search タブ）から目的のモデルをダウンロードします。例：`smollm2-135m-instruct`。
3. 「Developer」タブ（左側の `>_` のようなアイコン）に移動し、サーバー状態を 'running' に切り替えます
4. サーバーが稼働すると、右上にアドレスが表示されます（例：`http://127.0.0.1:1234`）。あるいは cURL 呼び出しから完全な URL も確認できます。
5. 現時点で LM Studio は HTTP2 をサポートしないため、HTTP1.1 の使用を強制する必要があります。そのために正しい maven または gradle 依存関係を追加します：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-http-client-jdk</artifactId>
    <version>1.18.1</version>
</dependency>
```
6. LangChain4j を設定し、`httpClientBuilder` を指定します
```java
import java.net.http.HttpClient;
import dev.langchain4j.http.client.jdk.JdkHttpClientBuilder;
import dev.langchain4j.http.client.jdk.JdkHttpClient;

...

HttpClient.Builder httpClientBuilder = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1) ;

JdkHttpClientBuilder jdkHttpClientBuilder = JdkHttpClient.builder()
        .httpClientBuilder(httpClientBuilder);

ChatModel model = OpenAiChatModel.builder()
        .baseUrl("http://127.0.0.1:1234/v1")
        .modelName("smollm2-135m-instruct")
        .httpClientBuilder(jdkHttpClientBuilder)
        .build();
```
