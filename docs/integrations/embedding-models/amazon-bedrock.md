---
sidebar_position: 2
---

# Amazon Bedrock


## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-bedrock</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```


## AWS認証情報
Amazon Bedrock埋め込みを使用するには、AWS認証情報を設定する必要があります。
オプションの1つは、`AWS_ACCESS_KEY_ID`と`AWS_SECRET_ACCESS_KEY`環境変数を設定することです。
詳細は[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html)で確認できます。

## Cohereモデル
- `BedrockCohereEmbeddingModel`

## Cohere埋め込みモデル
Bedrock Cohere埋め込みモデルのサポートが提供されており、以下のバージョンを使用できます：

- **`cohere.embed-english-v3`**
- **`cohere.embed-multilingual-v3`**

これらのモデルは、英語および多言語テキスト処理タスク向けの高品質なテキスト埋め込みを生成するのに理想的です。

### 実装例

以下はBedrockの埋め込みモデルを設定して使用する方法の例です：

```
BedrockCohereEmbeddingModel embeddingModel = BedrockCohereEmbeddingModel
        .builder()
        .region(Region.US_EAST_1)
        .model("cohere.embed-multilingual-v3")
        .inputType(BedrockCohereEmbeddingModel.InputType.SEARCH_QUERY)
        .truncation(BedrockCohereEmbeddingModel.Truncate.NONE)
        .build();
```

## API

- `BedrockTitanEmbeddingModel`
- `BedrockCohereEmbeddingModel`

## 例

- [BedrockEmbeddingIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-bedrock/src/test/java/dev/langchain4j/model/bedrock/BedrockEmbeddingIT.java)
