---
sidebar_position: 9
---

# Oracle Coherence

https://coherence.community/

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-coherence</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

`langchain4j-coherence`モジュールはCoherenceを提供された依存関係として持っており、さまざまなCoherenceバージョンで動作します。
開発者は関連するCoherence依存関係（コミュニティエディションまたは商用バージョン）を含める必要があります。
Coherence CEのgroupIdは`com.oracle.coherence.ce`で、商用バージョンのgroupIdは`com.oracle.coherence`です。

例えば、コミュニティエディション（CE）を使用するには、依存関係管理セクションにCoherence BOMを追加し、Coherenceを依存関係として追加します。その他のCoherenceモジュールは必要に応じてプロジェクトに追加できます。

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.oracle.coherence.ce</groupId>
            <artifactId>coherence-bom</artifactId>
            <version>24.09</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-coherence</artifactId>
        <version>1.0.0-beta4</version>
    </dependency>
    <dependency>
        <groupId>com.oracle.coherence.ce</groupId>
        <artifactId>coherence</artifactId>
    </dependency>
</dependencies>
```

## API

- `CoherenceEmbeddingStore`
- `CoherenceChatMemoryStore`

## 例

- [CoherenceEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/oracle-coherence-example/src/main/java/CoherenceEmbeddingStoreExample.java)
