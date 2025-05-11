---
sidebar_position: 30
---

# ロギング

LangChain4jは[SLF4J](https://www.slf4j.org/)をロギングに使用しており、
[Logback](https://logback.qos.ch/)や[Log4j](https://logging.apache.org/log4j/2.x/index.html)など、
お好みのロギングバックエンドを接続できます。

## 純粋なJava

モデルのインスタンスを作成する際に`.logRequests(true)`と`.logResponses(true)`を設定することで、
LLMへの各リクエストとレスポンスのロギングを有効にできます：
```java
OpenAiChatModel.builder()
    ...
    .logRequests(true)
    .logResponses(true)
    .build();
```

依存関係にSLF4Jロギングバックエンドの1つがあることを確認してください。例えば、Logback：
```xml
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.5.8</version>
</dependency>
```

## Quarkus

[Quarkus統合](/tutorials/quarkus-integration)を使用する場合、
ロギングは`application.properties`ファイルで設定されます：

```properties
...
quarkus.langchain4j.openai.chat-model.log-requests = true
quarkus.langchain4j.openai.chat-model.log-responses = true
quarkus.log.console.enable = true
quarkus.log.file.enable = false
```

これらのプロパティは、アプリケーションを開発モード（`mvn quarkus:dev`）で実行している場合、
Quarkus Dev UIでも設定および変更できます。
Dev UIは`http://localhost:8080/q/dev-ui`で利用できます。

## Spring Boot

[Spring Boot統合](/tutorials/spring-boot-integration)を使用する場合、
ロギングは`application.properties`ファイルで設定されます：

```properties
...
langchain4j.open-ai.chat-model.log-requests = true
langchain4j.open-ai.chat-model.log-responses = true
logging.level.dev.langchain4j = DEBUG
```
