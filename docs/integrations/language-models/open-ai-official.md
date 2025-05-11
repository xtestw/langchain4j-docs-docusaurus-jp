---
sidebar_position: 16
---

# OpenAI 公式 SDK

:::note

これは[公式OpenAI Java SDK](https://github.com/openai/openai-java)を使用する`OpenAI 公式 SDK`統合のドキュメントです。

LangChain4jはチャットモデルを使用するためにOpenAIとの4つの異なる統合を提供しており、これは#2です：

- [OpenAI](/integrations/language-models/open-ai)はOpenAI REST APIのカスタムJava実装を使用し、Quarkus（Quarkus RESTクライアントを使用）とSpring（SpringのRestClientを使用）で最もよく機能します。
- [OpenAI 公式 SDK](/integrations/language-models/open-ai-official)は公式OpenAI Java SDKを使用します。
- [Azure OpenAI](/integrations/language-models/azure-open-ai)はMicrosoftのAzure SDKを使用し、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最適です。
- [GitHub Models](/integrations/language-models/github-models)はAzure AI Inference APIを使用してGitHub Modelsにアクセスします。

:::

## この統合のユースケース

この統合は[OpenAI Java SDK GitHubリポジトリ](https://github.com/openai/openai-java)を使用し、以下が提供するすべてのOpenAIモデルで動作します：

- OpenAI
- Azure OpenAI
- GitHub Models

また、DeepSeekなどのOpenAI APIをサポートするモデルでも動作します。

## OpenAIドキュメント

- [OpenAI Java SDK GitHubリポジトリ](https://github.com/openai/openai-java)
- [OpenAI APIドキュメント](https://platform.openai.com/docs/introduction)
- [OpenAI APIリファレンス](https://platform.openai.com/docs/api-reference)

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-official</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

## モデルの設定

:::note
この設定と次のセクションの使用方法は、非ストリーミングモード（「ブロッキング」または「同期」モードとも呼ばれます）のためのものです。
ストリーミングモードについては2セクション後で詳しく説明します：モデルとのリアルタイムチャットを可能にしますが、使用はより複雑です。
:::

OpenAIモデルを使用するには、通常、エンドポイントURL、APIキー、モデル名が必要です。これはモデルがホストされている場所によって異なり、この統合は
いくつかの自動設定でより簡単にしようとしています：

### 一般的な設定

```java
import com.openai.models.ChatModel;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openaiofficial.OpenAiOfficialChatModel;

// ....

ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl(System.getenv("OPENAI_BASE_URL"))
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(ChatModel.GPT_4O_MINI)
        .build();
```

### OpenAI設定

OpenAIの`baseUrl`（`https://api.openai.com/v1`）はデフォルトなので、省略できます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(ChatModel.GPT_4O_MINI)
        .build();
```

### Azure OpenAI設定

#### 一般的な設定

Azure OpenAIの場合、`baseUrl`の設定は必須であり、そのURLが`openai.azure.com`で終わる場合、Azure OpenAIが自動的に検出されます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .modelName(ChatModel.GPT_4O_MINI)
        .build();
```

Azure OpenAIの使用を強制したい場合は、`isAzure()`メソッドも使用できます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .isAzure(true)
        .modelName(ChatModel.GPT_4O_MINI)
        .build();
```

#### パスワードレス認証

「パスワードレス」認証を使用してAzure OpenAIに認証することができます。これはAPIキーを管理する必要がないため、より安全です。

そのためには、まずAzure OpenAIインスタンスがマネージドIDをサポートするように設定し、このアプリケーションにアクセス権を与える必要があります。例えば：

```bash
# Azure OpenAIインスタンスでシステムマネージドIDを有効にする
az cognitiveservices account identity assign \
    --name <your-openai-instance-name> \
    --resource-group <your-resource-group>

# ログインしているIDを取得する
az ad signed-in-user show \
    --query id -o tsv
    
# Azure OpenAIインスタンスへのアクセス権を付与する
az role assignment create \
    --role "Cognitive Services OpenAI User" \
    --assignee <your-logged-identity-from-the-previous-command> \
    --scope "/subscriptions/<your-subscription-id>/resourceGroups/<your-resource-group>"
```

次に、Maven `pom.xml`に`azure-identity`依存関係を追加する必要があります：

```xml
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-identity</artifactId>
</dependency>
```

APIキーが設定されていない場合、LangChain4jはAzure OpenAIでパスワードレス認証を自動的に使用します。

### GitHub Models設定

GitHub Modelsの場合、デフォルトの`baseUrl`（`https://models.inference.ai.azure.com`）を使用できます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl("https://models.inference.ai.azure.com")
        .apiKey(System.getenv("GITHUB_TOKEN"))
        .modelName(ChatModel.GPT_4O_MINI)
        .build();
```

または、GitHub Modelsの使用を強制するために`isGitHubModels()`メソッドを使用することもできます。これにより`baseUrl`が自動的に設定されます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .apiKey(System.getenv("GITHUB_TOKEN"))
        .modelName(ChatModel.GPT_4O_MINI)
        .isGitHubModels(true)
        .build();
```

GitHub ModelsはGitHub ActionsやGitHub Codespacesを使用する際に自動的に入力される`GITHUB_TOKEN`環境変数を使用して設定されることが多いため、自動的に検出されます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .modelName(ChatModel.GPT_4O_MINI)
        .isGitHubModels(true)
        .build();
```

この最後の設定は使いやすく、`GITHUB_TOKEN`環境変数がコードやGitHubログに公開されないため、より安全です。

## モデルの使用

前のセクションでは、`ChatModel`インターフェースを実装する`OpenAiOfficialChatModel`オブジェクトが作成されました。

これは[AIサービス](https://docs.langchain4j.dev/tutorials/spring-boot-integration/#langchain4j-spring-boot-starter)によって使用されるか、Javaアプリケーションで直接使用されます。

この例では、Spring Beanとしてオートワイヤリングされています：

```java
@RestController
class ChatModelController {

    ChatModel chatModel;

    ChatModelController(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/model")
    public String model(@RequestParam(value = "message", defaultValue = "Hello") String message) {
        return chatModel.chat(message);
    }
}
```

## 構造化出力
[構造化出力](https://openai.com/index/introducing-structured-outputs-in-the-api/)機能は
[ツール](/tutorials/tools)と[レスポンスフォーマット](/tutorials/ai-services#json-mode)の両方でサポートされています。

構造化出力の詳細については[こちら](/tutorials/structured-outputs)をご覧ください。

### ツール用の構造化出力
ツールの構造化出力機能を有効にするには、モデルを構築する際に`.strictTools(true)`を設定します：

```java
OpenAiOfficialChatModel.builder()
        // ...
        .strictTools(true)
        .build();
```

これにより、現在のOpenAIの制限により、すべてのツールパラメータが必須（JSONスキーマでは`required`）になり、
JSONスキーマの各`object`に対して`additionalProperties=false`が設定されることに注意してください。

### レスポンスフォーマット用の構造化出力
AIサービスを使用する際にレスポンスフォーマット用の構造化出力機能を有効にするには、
モデルを構築する際に`supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA))`と`.strictJsonSchema(true)`を設定します：

```java
import static dev.langchain4j.model.chat.Capability.RESPONSE_FORMAT_JSON_SCHEMA;

// ...

OpenAiChatModel.builder()
        // ...
        .supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA))
        .strictJsonSchema(true)
        .build();
```

この場合、AIサービスは指定されたPOJOからJSONスキーマを自動的に生成し、それをLLMに渡します。

## ストリーミング用のモデル設定

:::note
上記の2つのセクションでは、非ストリーミングモード（「ブロッキング」または「同期」モードとも呼ばれます）のモデル設定について詳しく説明しました。
このセクションはストリーミングモード用であり、モデルとのリアルタイムチャットを可能にしますが、使用はより複雑です。
:::

これは非ストリーミングモードと似ていますが、`OpenAiOfficialChatModel`の代わりに`OpenAiOfficialStreamingChatModel`クラスを使用する必要があります：

```java
StreamingChatModel model = OpenAiOfficialStreamingChatModel.builder()
        .baseUrl(System.getenv("OPENAI_BASE_URL"))
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(ChatModel.GPT_4O_MINI)
        .build();
```

非ストリーミング設定セクションで詳述されているように、Azure OpenAIまたはGitHub Modelsの使用を強制するために、特定の`isAzure()`および`isGitHubModels()`メソッドを使用することもできます。

