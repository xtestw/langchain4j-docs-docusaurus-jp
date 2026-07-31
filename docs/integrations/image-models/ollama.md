---
sidebar_position: 9
---

# Ollama 画像生成

:::warning

Ollama の画像生成は実験的です。Ollama API および LangChain4j 統合は将来のバージョンで変更される可能性があります。

:::

## Maven 依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-ollama</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## API

- `OllamaImageModel`

`OllamaImageModel` は `ImageModel` を実装し、Ollama の標準 `/api/generate` エンドポイント経由でテキストから画像への生成をサポートします。画像編集、および同一プロンプトからの複数画像生成はサポートされません。

実験的な画像生成機能をサポートする Ollama のバージョンとモデルが必要です。通常のテキストモデルは画像ではなくテキストを返し、`OllamaImageGenerationException` で失敗します。

## 使い方

```java
ImageModel imageModel = OllamaImageModel.builder()
        .baseUrl("http://localhost:11434")
        .modelName("x/z-image-turbo")
        .width(1024)
        .height(768)
        .steps(20)
        .seed(42)
        .build();

Response<Image> response = imageModel.generate("a sunset over mountains");
Image image = response.content();
byte[] imageBytes = Base64.getDecoder().decode(image.base64Data());
Files.write(Path.of("ollama-image.png"), imageBytes);
```

## パラメータ

| Parameter           | Description                                                                                 | Type                  |
|---------------------|---------------------------------------------------------------------------------------------|-----------------------|
| `httpClientBuilder` | [カスタマイズ可能な HTTP クライアント](https://docs.langchain4j.dev/tutorials/customizable-http-client) を参照 | `HttpClientBuilder`   |
| `baseUrl`           | Ollama サーバーのベース URL。                                                          | `String`              |
| `modelName`         | Ollama サーバーで使用する画像生成モデル。                                    | `String`              |
| `width`             | 生成画像の幅（ピクセル）。`0` を使うか未設定の場合は Ollama/モデルのデフォルトを使用。設定時は 0〜4096。 | `Integer`             |
| `height`            | 生成画像の高さ（ピクセル）。`0` を使うか未設定の場合は Ollama/モデルのデフォルトを使用。設定時は 0〜4096。 | `Integer`             |
| `steps`             | 拡散ステップ数。`0` を使うか未設定の場合は Ollama/モデルのデフォルトを使用。負の値は不可。 | `Integer`             |
| `seed`              | Ollama の `options.seed` 経由で送る乱数シード。                                              | `Integer`             |
| `timeout`           | API 呼び出し完了までの最大時間。                                       | `Duration`            |
| `customHeaders`     | カスタム HTTP ヘッダー。                                                                        | `Map<String, String>` |
| `logRequests`       | リクエストをログするかどうか。                                                                    | `Boolean`             |
| `logResponses`      | レスポンスをログするかどうか。                                                                   | `Boolean`             |
| `maxRetries`        | API 呼び出し失敗時の最大リトライ回数。                                   | `Integer`             |

現時点では `OllamaImageModel` 用の Spring Boot starter 設定はありません。

生成された画像は Base64 エンコードされた PNG データとして返されます。URL 出力、トークン使用量、および Ollama のストリーミング進捗フィールド（`completed` や `total` など）は公開されません。
