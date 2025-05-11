---
sidebar_position: 22
---

# Xinference

- https://inference.readthedocs.io/


## Maven依存関係

`1.0.0-alpha1`以降：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-xinference</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

または、BOMを使用して依存関係を一貫して管理することもできます：

```xml
<dependencyManagement>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-community-bom</artifactId>
        <version>1.0.0-beta4</version>
        <typ>pom</typ>
        <scope>import</scope>
    </dependency>
</dependencyManagement>
```

## API

- `XinferenceEmbeddingModel`


## 例

- [XinferenceEmbeddingModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-xinference/src/test/java/dev/langchain4j/community/model/xinference/XinferenceEmbeddingModelIT.java)
