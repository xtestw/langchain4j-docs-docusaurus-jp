---
sidebar_position: 22
---

# Redis

https://redis.io/


## Maven依存関係

LangChain4jでRedisを使用するには、プレーンJavaまたはSpring Bootアプリケーションで使用できます。

### プレーンJava

:::note
`1.0.0-beta1`以降、`langchain4j-redis`は`langchain4j-community`に移行し、
`langchain4j-community-redis`に名前が変更されました。
:::

`1.0.0-beta1`より前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-redis</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-beta1`以降：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-redis</artifactId>
    <version>${latest version here}</version>
</dependency>
```

### Spring Boot

:::note
`1.0.0-beta1`以降、`langchain4j-redis-spring-boot-starter`は`langchain4j-community`に移行し、
`langchain4j-community-redis-spring-boot-starter`に名前が変更されました。
:::

`1.0.0-beta1`より前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-redis-spring-boot-starter</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-beta1`以降：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-redis-spring-boot-starter</artifactId>
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

- `RedisEmbeddingStore`


## 例

- [RedisEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/redis-example/src/main/java/RedisEmbeddingStoreExample.java)
