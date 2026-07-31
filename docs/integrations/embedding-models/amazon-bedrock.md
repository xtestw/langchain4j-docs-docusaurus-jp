---
sidebar_position: 2
---

# Amazon Bedrock


## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-bedrock</artifactId>
    <version>1.18.1</version>
</dependency>
```


## AWS認証情報
Amazon Bedrock埋め込みを使用するには、AWS認証情報を構成する必要があります。
オプションの1つは、`AWS_ACCESS_KEY_ID`と`AWS_SECRET_ACCESS_KEY`環境変数を設定することです。
詳細については[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html)を参照してください。

## Cohereモデル
- `BedrockCohereEmbeddingModel`

## Cohere埋め込みモデル
Bedrock Cohere埋め込みモデルのサポートが提供されており、次のバージョンを使用できます：

- **`cohere.embed-english-v3`**
- **`cohere.embed-multilingual-v3`**

これらのモデルは、英語および多言語テキスト処理タスク向けの高品質なテキスト埋め込みの生成に最適です。

### 実装例

以下は、Bedrock埋め込みモデルを構成して使用する方法の例です：

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

## Titanマルチモーダル埋め込み

`BedrockTitanEmbeddingModel`はAmazon Titanマルチモーダル埋め込み（`amazon.titan-embed-image-v1`）をサポートします：テキストおよび/または単一の画像を1つの（融合された）埋め込みに変換します。

```java
EmbeddingModel model = BedrockTitanEmbeddingModel.builder()
    .model("amazon.titan-embed-image-v1")
    .region(Region.US_EAST_1)
    .build();

EmbeddingResponse response = model.embed(EmbeddingRequest.builder()
    .input(TextContent.from("a photo of a cat"), ImageContent.from(base64Data, "image/png"))
    .build());
```

Titanには**base64**画像データが必要です（URLはサポートされていません）。リスナーは`.listeners(...)`で構成できます。リクエスト/レスポンスAPIについては、[埋め込みモデル](/tutorials/rag#embedding-model)を参照してください。

## 例

- [BedrockEmbeddingIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-bedrock/src/test/java/dev/langchain4j/model/bedrock/BedrockEmbeddingIT.java)
