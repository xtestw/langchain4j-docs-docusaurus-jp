---
sidebar_position: 18
---

# Qianfan

[百度智能云千帆大模型](https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application)
![image](https://github.com/langchain4j/langchain4j/assets/95265298/600f8006-4484-4a75-829c-c8c16a3130c2)

## Maven依存関係

LangChain4jでDashScopeを通常のJavaまたはSpring Bootアプリケーションで使用できます。

### 通常のJava

:::note
`1.0.0-alpha1`以降、`langchain4j-qianfan`は`langchain4j-community`に移行し、`langchain4j-community-qianfan`に名前が変更されました。
:::

`1.0.0-alpha1`より前：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-qianfan</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1`以降：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-qianfan</artifactId>
    <version>${latest version here}</version>
</dependency>
```

### Spring Boot

:::note
`1.0.0-alpha1`以降、`langchain4j-qianfan-spring-boot-starter`は`langchain4j-community`に移行し、
`langchain4j-community-qianfan-spring-boot-starter`に名前が変更されました。
:::

`1.0.0-alpha1`より前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-qianfan-spring-boot-starter</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1`以降：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-qianfan-spring-boot-starter</artifactId>
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

- `QianfanEmbeddingModel`


## 例

- [QianfanEmbeddingModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-qianfan/src/test/java/dev/langchain4j/community/model/qianfan/QianfanEmbeddingModelIT.java)
