---
sidebar_position: 24
---

# Vearch

https://github.com/vearch/vearch


## Maven依存関係

:::note
`1.0.0-alpha1`以降、`langchain4j-vearch`は`langchain4j-community`に移行し、`langchain4j-community-vearch`に名前が変更されました。
:::

`0.36.2`以前：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-vearch</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

`1.0.0-alpha1`以降：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-vearch</artifactId>
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

### `1.0.0-alpha1`以前

:::note
* `1.0.0-alpha1`以前の`langchain4j-vearch`は`Vearch`の[古いAPI](https://vearch.readthedocs.io/zh-cn/v3.3.x/overview.html)を使用しており、vearch 3.4.xバージョンでは非推奨です。
* `1.0.0-alpha1`以降の`langchain4j-community-vearch`は`Vearch`の[最新API](https://vearch.readthedocs.io/zh-cn/latest/overview.html)を使用しており、3.5.xおよび3.4.xバージョンをサポートしています。

最新バージョンの`Vearch`をサポートする`langchain4j-community-vearch`の使用をお勧めします。
:::

`VearchEmbeddingStore`を使用するには、`VearchConfig`をインスタンス化する必要があります：

```java
String embeddingFieldName = "text_embedding";
String textFieldName = "text";
Map<String, Object> metadata = createMetadata().toMap();

// プロパティの初期化
Map<String, SpacePropertyParam> properties = new HashMap<>(4);
properties.put(embeddingFieldName, SpacePropertyParam.VectorParam.builder()
        .index(true)
        .storeType(SpaceStoreType.MEMORY_ONLY)
        .dimension(384)
        .build());
properties.put(textFieldName, SpacePropertyParam.StringParam.builder().build());
// メタデータを追加... 例：properties.put("name", SpacePropertyParam.StringParam.builder().build());

VearchConfig vearchConfig = VearchConfig.builder()
        .spaceEngine(SpaceEngine.builder()
                .name("gamma")
                .indexSize(1L)
                .retrievalType(RetrievalType.FLAT)
                .retrievalParam(RetrievalParam.FLAT.builder()
                        .build())
                .build())
        .properties(properties)
        .embeddingFieldName(embeddingFieldName)
        .textFieldName(textFieldName)
        .databaseName(databaseName)
        .spaceName(spaceName)
        .modelParams(singletonList(ModelParam.builder()
                .modelId("vgg16")
                .fields(singletonList("string"))
                .out("feature")
                .build()))
        .build();
```

次に、`VearchEmbeddingStore`を作成できます：

```java
VearchEmbeddingStore embeddingStore = VearchEmbeddingStore.builder()
        .vearchConfig(vearchConfig)
        .baseUrl(baseUrl)
        .build();
```


### `1.0.0-alpha1`以降

`VearchEmbeddingStore`を使用するには、`VearchConfig`をインスタンス化する必要があります：

```java
String embeddingFieldName = "text_embedding";
String textFieldName = "text";
String spaceName = "embedding_space_" + ThreadLocalRandom.current().nextInt(0, Integer.MAX_VALUE);

// フィールドの初期化
List<Field> fields = new ArrayList<>(4);
List<String> metadataFieldNames = new ArrayList<>();
fields.add(VectorField.builder()
        .name(embeddingFieldName)
        .dimension(embeddingModel.dimension())
        .index(Index.builder()
                .name("gamma")
                .type(IndexType.HNSW)
                .params(HNSWParam.builder()
                        .metricType(MetricType.INNER_PRODUCT)
                        .efConstruction(100)
                        .nLinks(32)
                        .efSearch(64)
                        .build())
                .build())
        .build()
);
fields.add(StringField.builder().name(textFieldName).fieldType(FieldType.STRING).build());
// メタデータを追加... 例：fields.add(StringField.builder().name("name").fieldType(FieldType.STRING).build());

VearchConfig vearchConfig = VearchConfig.builder()
        .databaseName(databaseName)
        .spaceName(spaceName)
        .textFieldName(textFieldName)
        .embeddingFieldName(embeddingFieldName)
        .fields(fields)
        .metadataFieldNames(metadataFieldNames)
        .searchIndexParam(HNSWSearchParam.builder()
                // 現在はINNER_PRODUCTのみサポート
                .metricType(MetricType.INNER_PRODUCT)
                .efSearch(64)
                .build())
        .build();
```

次に、`VearchEmbeddingStore`を作成できます：

```java
VearchEmbeddingStore embeddingStore = VearchEmbeddingStore.builder()
        .vearchConfig(vearchConfig)
        .baseUrl(baseUrl)
        .logRequests(true)
        .logResponses(true)
        .build();
```


## 例

- [VearchEmbeddingStoreIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-vearch/src/test/java/dev/langchain4j/store/embedding/vearch/VearchEmbeddingStoreIT.java)
