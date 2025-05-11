---
sidebar_position: 4
---

# OpenAI 公式 SDK

:::note

これは[公式OpenAI Java SDK](https://github.com/openai/openai-java)を使用する`OpenAI 公式 SDK`統合のドキュメントです。

LangChain4jは画像生成のためにOpenAIとの3つの異なる統合を提供しており、これは#2です：

- [OpenAI](/integrations/language-models/open-ai)はOpenAI REST APIのカスタムJava実装を使用し、Quarkus（Quarkus RESTクライアントを使用）とSpring（SpringのRestClientを使用）で最もよく機能します。
- [OpenAI 公式 SDK](/integrations/language-models/open-ai-official)は公式OpenAI Java SDKを使用します。
- [Azure OpenAI](/integrations/language-models/azure-open-ai)はMicrosoftのAzure SDKを使用し、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最適です。

:::

## この統合のユースケース

この統合は[OpenAI Java SDK GitHubリポジトリ](https://github.com/openai/openai-java)を使用し、以下によって提供されるすべてのOpenAIモデルで動作します：

- OpenAI
- Azure OpenAI

また、OpenAI APIをサポートするモデルでも動作します。

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

OpenAIモデルを使用するには、通常、エンドポイントURL、APIキー、モデル名が必要です。これはモデルがホストされている場所によって異なり、この統合はいくつかの自動設定で簡単にします：

### 一般的な設定

```java
import com.openai.models.images.ImageModel;
import dev.langchain4j.model.image.ImageModel;
import dev.langchain4j.model.openaiofficial.OpenAiOfficialImageModel;

// ....

ImageModel model = OpenAiOfficialImageModel.builder()
        .baseUrl(System.getenv("OPENAI_BASE_URL"))
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(ImageModel.DALL_E_3)
        .build();
```

### Azure OpenAIとGitHub Modelsのための特定の設定

[OpenAI 公式チャットモデル](/integrations/language-models/open-ai-official)の設定と同様に、`isAzure()`および`isGitHubModels()`メソッドを使用して、Azure OpenAIおよびGitHub Modelsで`OpenAiOfficialImageModel`を設定できます。

#### Azure OpenAI

```java
ImageModel model = OpenAiOfficialImageModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .modelName(ImageModel.DALL_E_3)
        .isAzure(true) // ベースURLが`openai.azure.com`で終わる場合は不要
        .build();
```

[OpenAI 公式チャットモデル](/integrations/language-models/open-ai-official)のドキュメントで説明されているように、「パスワードレス」認証を使用することもできます。

#### GitHub Models

```java
ImageModel model = OpenAiOfficialImageModel.builder()
        .modelName(ImageModel.DALL_E_3)
        .isGitHubModels(true)
        .build();
```

## モデルの使用

モデルが設定されたら、それを使用して画像を生成できます：

```java
String imageUrl = imageModel
        .generate("フランス、パリのコーヒーマグ")
        .content()
        .url()
        .toString();
```
