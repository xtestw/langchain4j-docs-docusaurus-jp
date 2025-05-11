---
sidebar_position: 6
---

# Xinference

- https://inference.readthedocs.io/


## Maven依存関係

`0.37.0`以降：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-xinference</artifactId>
    <version>0.37.0</version>
</dependency>
```

または、BOMを使用して依存関係を一貫して管理することもできます：

```xml
<dependencyManagement>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-community-bom</artifactId>
        <version>0.37.0</version>
        <typ>pom</typ>
        <scope>import</scope>
    </dependency>
</dependencyManagement>
```

## API

- `XinferenceScoringModel`


## 例

- [XinferenceScoringModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-xinference/src/test/java/dev/langchain4j/community/model/xinference/XinferenceScoringModelIT.java)
