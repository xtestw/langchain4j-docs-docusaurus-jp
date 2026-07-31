---
sidebar_position: 3
---

# Google AI Gemini 画像生成

Gemini は、**Nano Banana**（Gemini 2.5 Flash Image）および **Nano Banana Pro**（Gemini 3 Pro Image Preview）と呼ばれる専用画像モデルを使用して、会話形式で画像の生成と編集ができます。

## 目次

- [概要](#overview)
- [利用可能なモデル](#models-available)
- [GoogleAiGeminiImageModel](#googleaigeminiimagemodel)
    - [基本的な使い方](#basic-usage)
    - [設定](#configuration)
- [画像生成](#image-generation)
    - [テキストから画像](#text-to-image)
    - [アスペクト比](#aspect-ratios)
    - [画像サイズ](#image-sizes)
- [画像編集](#image-editing)
    - [要素の追加と削除](#adding-and-removing-elements)
    - [スタイル転送](#style-transfer)
    - [インペインティング](#inpainting)
- [バッチ画像生成](#batch-image-generation)
- [制限事項](#limitations)
- [リソース](#resources)

## 概要

Gemini のネイティブ画像生成機能により、次のことが可能です：

- **テキストから画像**：テキストの説明から高品質な画像を生成
- **画像編集**：既存の画像に要素を追加、削除、または変更
- **スタイル転送**：画像に芸術的なスタイルを適用
- **反復的な改善**：複数ターンの会話で画像を反復的に改善
- **高忠実度テキストレンダリング**：読みやすく適切に配置されたテキストを含む画像を生成

生成されたすべての画像には [SynthID 透かし](https://ai.google.dev/responsible/docs/safeguards/synthid) が含まれます。

## 利用可能なモデル

| モデル | 説明 | 最大解像度 | 最大入力画像数 |
|-------|-------------|----------------|------------------|
| `gemini-2.5-flash-image` | 高速・効率的な画像生成（Nano Banana） | 1024px | 3 |
| `gemini-3-pro-image-preview` | 高度な機能、思考モード、Google Search grounding（Nano Banana Pro） | 4K | 14 |

## GoogleAiGeminiImageModel

### 基本的な使い方

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash-image")
    .build();

Response<Image> response = imageModel.generate(
    "A nano banana dish in a fancy restaurant with a Gemini theme"
);

// Save the generated image
Image image = response.content();
byte[] imageBytes = Base64.getDecoder().decode(image.base64Data());
Files.write(Paths.get("nano-banana.png"), imageBytes);
```

### 設定

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-3-pro-image-preview")
    .aspectRatio("16:9")              // Output aspect ratio
    .imageSize("2K")                   // Resolution (Gemini 3 Pro only)
    .timeout(Duration.ofSeconds(120))
    .maxRetries(3)
    .logRequestsAndResponses(true)
    .safetySettings(...)               // Content safety settings
    .build();
```

## 画像生成

### テキストから画像

説明的なテキストプロンプトから画像を生成します：

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash-image")
    .build();

// Photorealistic style
Response<Image> photo = imageModel.generate("""
    A photorealistic close-up portrait of an elderly Japanese ceramicist
    with deep wrinkles and a warm smile, inspecting a tea bowl.
    Soft golden hour light, 85mm portrait lens, shallow depth of field.
    """);

// Stylized illustration
Response<Image> sticker = imageModel.generate("""
    A kawaii-style sticker of a happy red panda wearing a bamboo hat,
    munching on a leaf. Bold outlines, cel-shading, vibrant colors,
    white background.
    """);

// Logo design
Response<Image> logo = imageModel.generate("""
    A modern, minimalist logo for 'The Daily Grind' coffee shop.
    Clean, bold sans-serif font. Black and white. Circular design
    with a clever coffee bean element.
    """);
```

### アスペクト比

両モデルでサポートされるアスペクト比：

| アスペクト比 | ユースケース |
|--------------|----------|
| `1:1` | 正方形、ソーシャルメディア投稿 |
| `2:3`、`3:2` | ポートレート/ランドスケープ写真 |
| `3:4`、`4:3` | 標準写真 |
| `4:5`、`5:4` | Instagram 投稿 |
| `9:16`、`16:9` | Stories、YouTube サムネイル |
| `21:9` | シネマティック、ウルトラワイド |

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash-image")
    .aspectRatio("16:9")  // Widescreen format
    .build();
```

### 画像サイズ

**Gemini 3 Pro Image Preview** はより高い解像度をサポートします：

| サイズ | 説明 |
|------|-------------|
| `1K` | デフォルト解像度 |
| `2K` | より高い解像度 |
| `4K` | 最大解像度 |

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-3-pro-image-preview")
    .aspectRatio("1:1")
    .imageSize("4K")  // High resolution output
    .build();
```

## 画像編集

### 要素の追加と削除

既存の画像をテキストプロンプトと一緒に提供して編集します：

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash-image")
    .build();

// Load the source image
Image sourceImage = Image.builder()
    .base64Data(Base64.getEncoder().encodeToString(
        Files.readAllBytes(Paths.get("cat.png"))))
    .mimeType("image/png")
    .build();

Response<Image> edited = imageModel.edit(
    sourceImage,
    "Add a small wizard hat on the cat's head. " +
    "Make it look natural with matching lighting."
);
```

### スタイル転送

画像を異なる芸術的スタイルに変換します：

```java
Image cityPhoto = // ... load your image

Response<Image> stylized = imageModel.edit(
    cityPhoto,
    "Transform this city street into Vincent van Gogh's 'Starry Night' style. " +
    "Preserve the composition but render with swirling brushstrokes " +
    "and a dramatic palette of deep blues and bright yellows."
);
```

### インペインティング

他の部分を保持したまま特定の要素を変更します：

```java
Image livingRoom = // ... load your image

Response<Image> edited = imageModel.edit(
    livingRoom,
    "Change only the blue sofa to a vintage brown leather chesterfield. " +
    "Keep everything else exactly the same."
);
```

## バッチ画像生成

大規模に複数の画像を生成する場合、コストが 50% 削減されます：

```java
GoogleAiGeminiBatchImageModel batchModel = GoogleAiGeminiBatchImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash-image")
    .build();

List<String> prompts = List.of(
    "A nano banana dish in a Gemini-themed restaurant",
    "A kawaii sticker of a banana wearing a chef hat",
    "A photorealistic banana split dessert",
    "A minimalist logo for 'Nano Banana Co.'"
);

// Submit batch
BatchResponse<Response<Image>> response = batchModel.submit(GeminiBatchRequest.from(
    prompts, "image-batch"));
String batchId = response.batchId();

// Poll for completion
while (!response.state().isTerminal()) {
    Thread.sleep(10000);
    response = batchModel.retrieve(batchId);
}

// Process results
if (response.state() == BatchState.SUCCEEDED) {
    for (Response<Image> imageResponse : response.responses()) {
        Image image = imageResponse.content();
        byte[] imageBytes = Base64.getDecoder().decode(image.base64Data());
        // Save or process each image
    }
}

// Clean up
batchModel.deleteBatchJob(batchId);
```

`responses()` と `errors()` はフラットな便利ビューです（決して `null` ではなく、報告するものがない場合は空）。
どのプロンプトがどの画像を生成したかはわかりません。各結果をプロンプトに対応付けるには、
`results()` を使用してください：送信されたプロンプトと**同じ順序**でリクエストごとに 1 つの
`BatchItemResult` を返し、それぞれが `response()` を持つ `BatchItemResult.Success`、または
`error()` を持つ `BatchItemResult.Failure` です：

```java
List<BatchItemResult<Response<Image>>> results = response.results();
for (int i = 0; i < results.size(); i++) {
    BatchItemResult<Response<Image>> item = results.get(i);
    if (item.isSuccess()) {
        Image image = item.response().content();
        // Save or process the image generated for prompts.get(i)
    } else {
        BatchError error = item.error();
        System.err.println("Prompt #" + i + " failed: " + error.code() + " - " + error.message());
    }
}
```

## 制限事項

- **言語**：EN で最高のパフォーマンス。サポート言語には ar-EG、de-DE、es-MX、fr-FR、hi-IN、id-ID、it-IT、ja-JP、ko-KR、pt-BR、ru-RU、vi-VN、zh-CN が含まれます
- **入力**：画像生成では音声および動画入力はサポートされていません
- **出力数**：モデルは要求された正確な数の画像を常に生成するとは限りません
- **入力画像**：
    - `gemini-2.5-flash-image`：最大 3 枚の入力画像
    - `gemini-3-pro-image-preview`：最大 14 枚の入力画像（一貫性のための人物画像を最大 5 枚含む）
- **URL 画像**：編集では URL ベースの画像はサポートされていません。base64 エンコードされた画像を使用してください
- **透かし**：生成されたすべての画像には SynthID 透かしが含まれます

## リソース

- [Gemini 画像生成ドキュメント](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini API モデル](https://ai.google.dev/gemini-api/docs/models/gemini)
- [Batch API ドキュメント](https://ai.google.dev/gemini-api/docs/batch-api)
- [画像生成 Cookbook](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_Started_Nano_Banana.ipynb)
