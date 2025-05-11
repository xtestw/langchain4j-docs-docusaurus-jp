---
sidebar_position: 4
---

# ChatGLM

https://github.com/THUDM/ChatGLM-6B

ChatGLMは清華大学によってリリースされたオープンなバイリンガル対話言語モデルです。

ChatGLM2、ChatGLM3、GLM4については、それらのAPIはOpenAIと互換性があります。`langchain4j-zhipu-ai`を参照するか、`langchain4j-open-ai`を使用できます。

## Maven依存関係

:::note
`1.0.0-alpha1`以降、`langchain4j-chatglm`は`langchain4j-community`に移行し、`langchain4j-community-chatglm`に名前が変更されました。
:::

`1.0.0-alpha1`より前：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-chatglm</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1`以降：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-chatglm</artifactId>
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
        <typ>pom</typ>
        <scope>import</scope>
    </dependency>
</dependencyManagement>
```


## API

以下のコードを使用して`ChatGlmChatModel`をインスタンス化できます：

```java
ChatModel model = ChatGlmChatModel.builder()
        .baseUrl(System.getenv("CHATGLM_BASE_URL"))
        .logRequests(true)
        .logResponses(true)
        .build();
```

これで通常の`ChatModel`のように使用できます。

:::note
`ChatGlmChatModel`は関数呼び出しと構造化出力をサポートしていません。[index](index.md)を参照してください。
:::

## 例

- [ChatGlmChatModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-chatglm/src/test/java/dev/langchain4j/community/model/chatglm/ChatGlmChatModelIT.java)
