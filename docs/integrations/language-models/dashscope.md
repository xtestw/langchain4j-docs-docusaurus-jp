---
sidebar_position: 5
---

# DashScope (Qwen)

[DashScope](https://dashscope.aliyun.com/)は[Alibaba Cloud](https://www.alibabacloud.com/)によって開発されたプラットフォームです。
特に本番環境でAI/MLモデルを扱う際に、モデルの可視化、監視、デバッグのためのインターフェースを提供します。
このプラットフォームを使用すると、パフォーマンスメトリクスの可視化、モデルの動作の追跡、
デプロイサイクルの早い段階で潜在的な問題を特定することができます。

[Qwen](https://tongyi.aliyun.com/)モデルは[Alibaba Cloud](https://www.alibabacloud.com/)によって開発された
一連の生成AIモデルです。Qwenファミリーのモデルは、テキスト生成、要約、質問応答、
さまざまなNLPタスクなどのタスク向けに特別に設計されています。

詳細については[DashScopeドキュメント](https://help.aliyun.com/zh/model-studio/getting-started/?spm=a2c4g.11186623.help-menu-2400256.d_0.6655453aLIyxGp)
を参照してください。LangChain4jは[DashScope Java SDK](https://help.aliyun.com/zh/dashscope/java-sdk-best-practices?spm=a2c4g.11186623.0.0.272a1507Ne69ja)
を使用してDashScopeと統合しています。

## Maven依存関係

プレーンJavaまたはSpring Bootアプリケーションでは、LangChain4jでDashScopeを使用できます。

### プレーンJava

:::note
`1.0.0-alpha1`以降、`langchain4j-dashscope`は`langchain4j-community`に移行し、
`langchain4j-community-dashscope`に名前が変更されました。
:::

`1.0.0-alpha1`より前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-dashscope</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1`以降：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-dashscope</artifactId>
    <version>${latest version here}</version>
</dependency>
```

### Spring Boot

:::note
`1.0.0-alpha1`以降、`langchain4j-dashscope-spring-boot-starter`は`langchain4j-community`に移行し、
`langchain4j-community-dashscope-spring-boot-starter`に名前が変更されました。
:::

`1.0.0-alpha1`より前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-dashscope-spring-boot-starter</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1`以降：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-dashscope-spring-boot-starter</artifactId>
    <version>${latest version here}</version>
</dependency>
```

または、BOMを使用して依存関係を一貫して管理することもできます：

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

## 設定可能なパラメータ

`langchain4j-community-dashscope`には使用できる4つのモデルがあります：

- `QwenChatModel`
- `QwenStreamingChatModel`
- `QwenLanguageModel`
- `QwenStreamingLanguageModel`

`langchain4j-dashscope`はテキスト生成画像モデルを提供します
- `WanxImageModel`

### `QwenChatModel`

`QwenChatModel`には初期化時に設定できる以下のパラメータがあります：

| プロパティ          | 説明                                                                                                                                                                                                                                                                  | デフォルト値                                                                                                                                                                                            |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| baseUrl           | 接続先のURL。HTTPまたはWebSocketを使用してDashScopeに接続できます                                                                                                                                                                                                 | [テキスト推論](https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation)と[マルチモーダル](https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation) |
| apiKey            | APIキー                                                                                                                                                                  |                                                                                                                                                                                                          |
| modelName         | 使用するモデル                                                                                                                                                                                                                                                            | qwen-plus                                                                                                                                                                                                |
| topP              | カーネルサンプリングの確率閾値は、モデルによって生成されるテキストの多様性を制御します。`top_p`が高いほど、生成されるテキストの多様性が高くなり、その逆も同様です。値の範囲：(0, 1.0]。一般的には、これまたは温度のいずれかを変更することをお勧めしますが、両方は変更しないでください。 |                                                                                                                                                                                                          |
| topK              | 生成プロセス中にサンプリングされる候補セットのサイズ                                                                                                                                                                                                                         |                                                                                                                                                                                                          |
| enableSearch      | モデルがテキスト生成時にインターネット検索結果を参照するかどうか                                                                                                                                                                                                    |                                                                                                                                                                                                          |
| seed              | seedパラメータを設定すると、テキスト生成プロセスがより決定論的になり、通常は結果の一貫性を保つために使用されます                                                                                                                                   |                                                                                                                                                                                                          |
| repetitionPenalty | モデル生成中の連続シーケンスでの繰り返し。`repetition_penalty`を増やすとモデル生成での繰り返しが減少し、1.0はペナルティなしを意味します。値の範囲：(0, +inf)                                                                                        |                                                                                                                                                                                                          |
| temperature       | モデルによって生成されるテキストの多様性を制御するサンプリング温度。温度が高いほど、生成されるテキストの多様性が高くなり、その逆も同様です。値の範囲：[0, 2)                                                                                    |                                                                                                                                                                                                          |
| stops             | stopパラメータを使用すると、モデルは指定された文字列またはtoken_idを含もうとしているときに自動的にテキスト生成を停止します                                                                                                                                     |                                                                                                                                                                                                          |
| maxTokens         | このリクエストによって返されるトークンの最大数                                                                                                                                                                                                                       |                                                                                                                                                                                                          |
| listeners         | リクエスト、レスポンス、エラーをリッスンするリスナー                                                                                                                                                                                                                      |                                                                                                                                                                                                          |

### `QwenStreamingChatModel`

`QwenChatModel`と同じです

### `QwenLanguageModel`

`QwenChatModel`と同じですが、`listeners`は除きます。

### `QwenStreamingLanguageModel`

`QwenChatModel`と同じですが、`listeners`は除きます。

## 例

### プレーンJava

以下のコードを使用して`QwenChatModel`を初期化できます：

```java
ChatModel qwenModel = QwenChatModel.builder()
                    .apiKey("あなたのAPIキーをここに")
                    .modelName("qwen-max")
                    .build();
```

または他のパラメータをより詳細にカスタマイズ：

```java
ChatModel qwenModel = QwenChatModel.builder()
                    .apiKey("あなたのAPIキーをここに")
                    .modelName("qwen-max")
                    .enableSearch(true)
                    .temperature(0.7)
                    .maxTokens(4096)
                    .stops(List.of("Hello"))
                    .build();
```


テキストから画像を生成する方法：

```java
WanxImageModel wanxImageModel = WanxImageModel.builder()
                    .modelName("wanx2.1-t2i-plus") 
                    .apiKey("阿里云百炼apikey")     
                    .build();
Response<Image> response = wanxImageModel.generate("美女");
System.out.println(response.content().url());

```

### Spring Boot

`langchain4j-community-dashscope-spring-boot-starter`依存関係を導入した後、以下の設定を使用して簡単に`QwenChatModel`ビーンを登録できます：

```properties
langchain4j.community.dashscope.chat-model.api-key=<あなたのAPIキーをここに>
langchain4j.community.dashscope.chat-model.model-name=qwen-max
# プロパティは`QwenChatModel`と同じです
# 例：
# langchain4j.community.dashscope.chat-model.temperature=0.7
# langchain4j.community.dashscope.chat-model.max-tokens=4096
```

### その他の例

詳細は[LangChain4j Community](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-dashscope/src/test/java/dev/langchain4j/community/model/dashscope)で確認できます
