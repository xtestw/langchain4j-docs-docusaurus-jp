---
sidebar_position: 4
---

# Local

`CommandLineExecutionEngine` はローカルのコンピュータ環境を使って、指定されたコマンドラインコードを実行します。
実装済みのツールとして `CommandLineTool` と `LocalScriptExecutionTool` があり、
**デスクトップ自動化（Desktop Automation）** や **Computer-Use** Agent
（ファイル管理、アプリケーション制御など）に役立ちます。自然言語でコンピュータを制御できます。例えば：
 - `set my mac output volume 50`
 - `list all running applications in my mac`
 - `tell a story and then read it out loud`
 - `tell a story about moon and save it into a text file`
 - ...

:::danger
⚠️ セキュリティ警告：高リスクなコード実行

注意！本番のオンラインサービス環境でコードを実行するのは*危険*な場合があります。
オンラインサービスで使う場合は、セキュリティサンドボックス環境経由で実行する必要があります。

❗ 本番環境では使用しないでください！
:::

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-code-execution-engine-local</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## API

- `CommandLineExecutionEngine`
- `CommandLineTool`
- `LocalScriptExecutionTool`


## 例

```java
        LocalScriptExecutionTool tool = new LocalScriptExecutionTool();

        Assistant assistant = AiServices.builder(Assistant.class)
                .chatModel(model)
                .tools(tool)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();

        String answer = assistant.chat("list all running applications in my mac");
        System.out.println(answer);
```

- [CommandLineExecutionEngineTest](https://github.com/langchain4j/langchain4j-community/blob/main/code-execution-engines/langchain4j-community-code-execution-engine-local/src/test/java/dev/langchain4j/community/code/local/CommandLineExecutionEngineTest.java)
- [CommandLineToolIT](https://github.com/langchain4j/langchain4j-community/blob/main/code-execution-engines/langchain4j-community-code-execution-engine-local/src/test/java/dev/langchain4j/community/code/local/CommandLineToolIT.java)
- [CommandLineToolTest](https://github.com/langchain4j/langchain4j-community/blob/main/code-execution-engines/langchain4j-community-code-execution-engine-local/src/test/java/dev/langchain4j/community/code/local/CommandLineToolTest.java)
- [LocalScriptExecutionToolIT](https://github.com/langchain4j/langchain4j-community/blob/main/code-execution-engines/langchain4j-community-code-execution-engine-local/src/test/java/dev/langchain4j/community/code/local/LocalScriptExecutionToolIT.java)
- [LocalScriptExecutionToolTest](https://github.com/langchain4j/langchain4j-community/blob/main/code-execution-engines/langchain4j-community-code-execution-engine-local/src/test/java/dev/langchain4j/community/code/local/LocalScriptExecutionToolTest.java) 
