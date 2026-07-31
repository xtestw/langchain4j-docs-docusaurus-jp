---
sidebar_position: 7
---

# Docling

[Docling](https://docling.ai) は IBM Research のドキュメント処理エンジンで、PDF、DOCX、PPTX などさまざまなドキュメント形式からテキストと構造を抽出します。OCR、テーブル抽出、レイアウト分析などの高度な機能を提供します。

この統合は、稼働中の [docling-serve](https://github.com/docling-project/docling-serve) インスタンスと REST API 経由で通信し、[公式 Docling Java ライブラリ](https://docling-project.github.io/docling-java/current/) を使って構築されています。


## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-document-parser-docling</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

このモジュールは `docling-serve-api`（インターフェース）に依存し、参照 HTTP クライアントである `docling-serve-client` をオプションのランタイム依存関係として含みます。

**Spring Boot や Quarkus を使っていない場合**（これらは独自の `DoclingServeApi` 実装を提供する場合があります）、参照クライアントも明示的に追加する必要があります：

```xml
<dependency>
    <groupId>ai.docling</groupId>
    <artifactId>docling-serve-client</artifactId>
    <version>0.5.1</version>
</dependency>
```

[Quarkus](https://quarkus.io) や [Spring Boot](https://spring.io/projects/spring-boot) などのフレームワークは独自の Docling 統合を提供します。それらの具体的な実装の配線方法については [Docling Java ドキュメント](https://docling-project.github.io/docling-java/dev/docling-serve/serve-client/#when-to-use-this-module) を参照してください。


## 使い方

`docling-serve` インスタンスを起動し（[docling-serve ドキュメント](https://github.com/docling-project/docling-serve) を参照）、`DoclingServeApi` クライアントを構築してパーサーに渡します：

```java
DoclingServeApi api = DoclingServeApi.builder()
        .baseUrl("http://localhost:5001")
        .build();

DoclingDocumentParser parser = DoclingDocumentParser.builder()
        .doclingClient(api)
        .build();

Document document = parser.parse(inputStream);
String text = document.text();
```

### 変換オプション

Docling の処理をカスタマイズするには、[`ConvertDocumentOptions`](https://docling-project.github.io/docling-java/dev/docling-serve/serve-api/#requests-convertdocumentrequest) をビルダーに渡します：

```java
ConvertDocumentOptions options = ConvertDocumentOptions.builder()
        // configure options here
        .build();

DoclingDocumentParser parser = DoclingDocumentParser.builder()
        .doclingClient(api)
        .options(options)
        .build();
```

### カスタムテキスト抽出

デフォルトでは、パーサーは Docling レスポンスから markdown コンテンツを抽出します。`documentTextExtractor` ビルダーメソッド経由で `Function<InBodyConvertDocumentResponse, String>` を提供すると、テキスト抽出方法をカスタマイズできます。この関数は完全な `InBodyConvertDocumentResponse` を受け取り、さまざまな形式（markdown、HTML、テキスト、doctags、JSON）の変換済みドキュメント、変換エラー、処理時間、ステータス情報にアクセスできます。

例えば、markdown の代わりに HTML コンテンツを抽出する場合：

```java
DoclingDocumentParser parser = DoclingDocumentParser.builder()
        .doclingClient(api)
        .documentTextExtractor(response -> response.getDocument().getHtmlContent())
        .build();
```

またはプレーンテキストを抽出する場合：

```java
DoclingDocumentParser parser = DoclingDocumentParser.builder()
        .doclingClient(api)
        .documentTextExtractor(response -> response.getDocument().getTextContent())
        .build();
```

## API

- `DoclingDocumentParser`


## 例

- [DoclingDocumentParserTest](https://github.com/langchain4j/langchain4j/blob/main/document-parsers/langchain4j-document-parser-docling/src/test/java/dev/langchain4j/data/document/parser/docling/DoclingDocumentParserTest.java)
- [DoclingDocumentParserIT](https://github.com/langchain4j/langchain4j/blob/main/document-parsers/langchain4j-document-parser-docling/src/test/java/dev/langchain4j/data/document/parser/docling/DoclingDocumentParserIT.java)
