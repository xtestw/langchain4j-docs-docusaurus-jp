---
sidebar_position: 31
---

# JSON Codec

LangChain4j は、「tools」および「structured output」機能で使用される内部 JSON シリアライザ（デフォルトは Jackson）を同梱しています。

デフォルトのシリアライザはほとんどの場合問題なく動作します。ただし、特定の環境では、他の依存関係の影響でデフォルトの Jackson シリアライザがエラーを起こすことがあります。例えば Jetbrains/IntelliJ プラグインの開発者などで報告されています。

独自の JSON シリアライザ（いわゆる JSON Codec）を提供する必要がある場合は、次の手順に従ってください：

1. プロジェクトで `dev.langchain4j.spi.json.JsonCodecFactory` の実装を作成する

この例では、ファクトリクラスを `example.MyJsonCodecFactory` とします。

LangChain4j が内部で使用するデフォルトコーデックである `dev.langchain4j.internal.JacksonJsonCodec` を確認し、必要に応じて適応できます。

2. SPI プロバイダ設定ファイルを追加する

リソースフォルダ（例：`src/main/resources`）に `META-INF/services` フォルダを追加し、`dev.langchain4j.spi.json.JsonCodecFactory` という名前のファイルを作成します。そのファイルの内容は、ファクトリ実装の FQDN である必要があります。この例では次のとおりです：

```
example.MyJsonCodecFactory
```

## 注意事項

`dev.langchain4j.spi.json.JsonCodecFactory` は LangChain4j では内部利用向けとされています。カスタマイズした JSON Codec が確実に必要な環境でのみ、この方法を使用してください。
