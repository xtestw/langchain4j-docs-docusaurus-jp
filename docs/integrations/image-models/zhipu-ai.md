---
sidebar_position: 6
---

# ZhiPu AI

[ZhiPu AI](https://www.zhipuai.cn/)は、テキスト生成、テキスト埋め込み、画像生成などのモデルサービスを提供するプラットフォームです。詳細については[ZhiPu AIオープンプラットフォーム](https://open.bigmodel.cn/)を参照してください。
LangChain4jは[HTTPエンドポイント](https://bigmodel.cn/dev/api/normal-model/glm-4)を使用してZhiPu AIと統合しています。
HTTPエンドポイントから公式SDKへの移行を検討しており、どのような協力も歓迎します！

## Maven依存関係

LangChain4jでは、通常のJavaまたはSpring BootアプリケーションでZhiPu AIを使用できます。

### 通常のJava

:::note
`1.0.0-alpha1`以降、`langchain4j-zhipu-ai`は`langchain4j-community`に移行し、
`langchain4j-community-zhipu-ai`に名前が変更されました
:::

`1.0.0-alpha1`より前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-zhipu-ai</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1`以降：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-zhipu-ai</artifactId>
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

- `ZhipuAiImageModel`


## 例

- [ZhipuAiImageModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-zhipu-ai/src/test/java/dev/langchain4j/community/model/zhipu/ZhipuAiImageModelIT.java)
