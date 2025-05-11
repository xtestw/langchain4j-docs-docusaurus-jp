---
sidebar_position: 6
---

# GitHub モデル

:::note

これは、GitHub モデルにアクセスするために Azure AI 推論 API を使用する `GitHub Models` 統合のドキュメントです。

LangChain4j はチャットモデルを使用するための OpenAI との 4 つの異なる統合を提供しており、これは #4 です：

- [OpenAI](/integrations/language-models/open-ai) は、OpenAI REST API のカスタム Java 実装を使用し、Quarkus（Quarkus REST クライアントを使用）と Spring（Spring の RestClient を使用）で最適に動作します。
- [OpenAI 公式 SDK](/integrations/language-models/open-ai-official) は、OpenAI の公式 Java SDK を使用します。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) は、Microsoft Azure SDK を使用し、高度な Azure 認証メカニズムを含む Microsoft Java スタックを使用している場合に最適です。
- [GitHub モデル](/integrations/language-models/github-models) は、GitHub モデルにアクセスするために Azure AI 推論 API を使用します。

:::

生成 AI アプリケーションを開発したい場合、GitHub モデルを使用して AI モデルを無料で見つけて実験することができます。
アプリケーションを本番環境に移行する準備ができたら、有料の Azure アカウントからのトークンに切り替えることができます。

## GitHub モデルのドキュメント

- [GitHub モデルのドキュメント](https://docs.github.com/en/github-models)
- [GitHub モデルのマーケットプレイス](https://github.com/marketplace/models)

## Maven 依存関係

### 通常の Java

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-github-models</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

## GitHub トークン

GitHub モデルを使用するには、認証のために GitHub トークンを使用する必要があります。

トークンは [GitHub 開発者設定 > 個人アクセストークン](https://github.com/settings/tokens) で作成および管理されます。

トークンを取得したら、環境変数として設定し、コードで使用できます：

```bash
export GITHUB_TOKEN="<あなたの GitHub トークンをここに入力>"
```

## GitHub トークンを使用した `GitHubModelsChatModel` の作成

### 通常の Java

```java
GitHubModelsChatModel model = GitHubModelsChatModel.builder()
        .gitHubToken(System.getenv("GITHUB_TOKEN"))
        .modelName("gpt-4o-mini")
        .build();
```

これにより `GitHubModelsChatModel` のインスタンスが作成されます。
モデルパラメータ（例：`temperature`）は `GitHubModelsChatModel` のビルダーで値を提供することでカスタマイズできます。

### Spring Boot

`GitHubModelsChatModelConfiguration` Spring Bean を作成します：

```Java
package com.example.demo.configuration.github;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.github.GitHubModelsChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("github")
public class GitHubModelsChatModelConfiguration {

    @Value("${GITHUB_TOKEN}")
    private String gitHubToken;

    @Bean
    ChatModel gitHubModelsChatModel() {
        return GitHubModelsChatModel.builder()
                .gitHubToken(gitHubToken)
                .modelName("gpt-4o-mini")
                .logRequestsAndResponses(true)
                .build();
    }
}
```

この設定により `GitHubModelsChatModel` ビーンが作成され、
[AI サービス](https://docs.langchain4j.dev/tutorials/spring-boot-integration/#langchain4j-spring-boot-starter) で使用するか、
必要な場所でオートワイヤすることができます。例えば：

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

## GitHub トークンを使用した `GitHubModelsStreamingChatModel` の作成

### 通常の Java

```java
GitHubModelsStreamingChatModel model = GitHubModelsStreamingChatModel.builder()
        .gitHubToken(System.getenv("GITHUB_TOKEN"))
        .modelName("gpt-4o-mini")
        .logRequestsAndResponses(true)
        .build();
```

### Spring Boot

`GitHubModelsStreamingChatModelConfiguration` Spring Bean を作成します：
```Java
package com.example.demo.configuration.github;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.github.GitHubModelsChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("github")
public class GitHubModelsStreamingChatModelConfiguration {

    @Value("${GITHUB_TOKEN}")
    private String gitHubToken;

    @Bean
    GitHubModelsStreamingChatModel gitHubModelsStreamingChatModel() {
        return GitHubModelsStreamingChatModel.builder()
                .gitHubToken(System.getenv("GITHUB_TOKEN"))
                .modelName("gpt-4o-mini")
                .logRequestsAndResponses(true)
                .build();
    }
}
```

## 例

- [GitHub モデルの例](https://github.com/langchain4j/langchain4j-examples/tree/main/github-models-examples/src/main/java)
