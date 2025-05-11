---
sidebar_position: 5
---

# DashScope

[DashScope](https://dashscope.aliyun.com/)は[Alibaba Cloud](https://www.alibabacloud.com/)によって開発されたプラットフォームです。
特に本番環境でのAI/MLモデルを扱う際に、モデルの可視化、監視、デバッグのためのインターフェースを提供します。
このプラットフォームを使用すると、パフォーマンスメトリクスの可視化、モデルの動作の追跡、デプロイサイクルの早い段階での潜在的な問題の特定が可能になります。

[Qwen](https://tongyi.aliyun.com/)モデルは[Alibaba Cloud](https://www.alibabacloud.com/)によって開発された一連の生成AIモデルです。
Qwenファミリーのモデルは、テキスト生成、要約、質問応答、さまざまなNLPタスクなどのタスク向けに特別に設計されています。

詳細については[DashScopeドキュメント](https://help.aliyun.com/zh/model-studio/getting-started/?spm=a2c4g.11186623.help-menu-2400256.d_0.6655453aLIyxGp)を参照してください。
LangChain4jは[DashScope Java SDK](https://help.aliyun.com/zh/dashscope/java-sdk-best-practices?spm=a2c4g.11186623.0.0.272a1507Ne69ja)を使用してDashScopeと統合しています。

## Maven依存関係

:::note
`1.0.0-alpha1`以降、`langchain4j-dashscope`は`langchain4j-community`に移行し、
`langchain4j-community-dashscope`に名前が変更されました。
:::

`1.0.0-alpha1`より前：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-dashscope</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1`以降：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-dashscope</artifactId>
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

## 設定可能なパラメータ

`QwenEmbeddingModel`は初期化時に以下のパラメータを設定できます：

| プロパティ | 説明 | デフォルト値 |
|-----------|------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| baseUrl   | 接続先のURL。HTTPまたはWebSocketを使用してDashScopeに接続できます | https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding |
| apiKey    | APIキー |                                                                                         |
| modelName | 使用するモデル | text-embedding-v2                                                                       |

## 例

- [QwenEmbeddingModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-dashscope/src/test/java/dev/langchain4j/community/model/dashscope/QwenEmbeddingModelIT.java)
