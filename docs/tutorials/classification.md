---
sidebar_position: 13
---

# 分類

## **概要**
このドキュメントでは、Javaの**LangChain4j**を使用した分類システムの実装を説明します。分類は、**感情分析、意図検出**、**エンティティ認識**など、テキストを事前定義されたラベルに分類するために不可欠です。

この例では、LangChain4jのAI駆動サービスを使用した**感情分類**を示します。

---

LangChain4jは、テキスト分類の一般的な2つのアプローチをサポートしています：

- ラベルが微妙な自然言語推論に依存する場合は、**AI Services**経由でLLMを使用します。
- 各カテゴリにラベル付きの例があり、意味的類似度で分類したい場合は、`TextClassifier`と`EmbeddingModelTextClassifier`経由で**埋め込み**を使用します。

## **感情分類サービス**
感情分類システムは、入力テキストを次の**感情カテゴリ**のいずれかに分類します：
- **POSITIVE**
- **NEUTRAL**
- **NEGATIVE**

### **実装**
```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.UserMessage;

public class SentimentClassification {

    // Initialize the chat model using OpenAI
    static ChatModel chatModel = OpenAiChatModel.withApiKey("YOUR_OPENAI_API_KEY");

    // Define the Sentiment enum
    enum Sentiment {
        POSITIVE, NEUTRAL, NEGATIVE
    }

    // Define the AI-powered Sentiment Analyzer interface
    interface SentimentAnalyzer {

        @UserMessage("Analyze sentiment of {{it}}")
        Sentiment analyzeSentimentOf(String text);

        @UserMessage("Does {{it}} have a positive sentiment?")
        boolean isPositive(String text);
    }

    public static void main(String[] args) {

        // Create an AI-powered Sentiment Analyzer instance
        SentimentAnalyzer sentimentAnalyzer = AiServices.create(SentimentAnalyzer.class, chatModel);

        // Example Sentiment Analysis
        Sentiment sentiment = sentimentAnalyzer.analyzeSentimentOf("I love this product!");
        System.out.println(sentiment); // Expected Output: POSITIVE

        boolean positive = sentimentAnalyzer.isPositive("This is a terrible experience.");
        System.out.println(positive); // Expected Output: false
    }
}
```

---

## **コンポーネントの説明**

### **1. チャットモデルの初期化**
```java
static ChatModel chatModel = OpenAiChatModel.withApiKey("YOUR_OPENAI_API_KEY");
```
- 自然言語テキストを処理するために**OpenAIチャットモデル**を初期化します。
- `"YOUR_OPENAI_API_KEY"`を実際のOpenAI APIキーに置き換えてください。

### **2. 感情カテゴリの定義**
```java
enum Sentiment {
    POSITIVE, NEUTRAL, NEGATIVE
}
```
- `Sentiment`列挙型は、可能な感情分類を表します。

### **3. AI駆動の感情アナライザーの作成**
```java
interface SentimentAnalyzer {
    
    @UserMessage("Analyze sentiment of {{it}}")
    Sentiment analyzeSentimentOf(String text);

    @UserMessage("Does {{it}} have a positive sentiment?")
    boolean isPositive(String text);
}
```
- このインターフェースは2つのAI駆動メソッドを定義します：
    - `analyzeSentimentOf(String text)`：指定されたテキストを**POSITIVE、NEUTRAL**、または**NEGATIVE**に分類します。
    - `isPositive(String text)`：テキストがポジティブな感情を持つ場合は`true`を返し、それ以外は`false`を返します。

### **4. AIサービスインスタンスの作成**
```java
SentimentAnalyzer sentimentAnalyzer = AiServices.create(SentimentAnalyzer.class, chatModel);
```
- `AiServices.create()`は、AIモデルを使用して`SentimentAnalyzer`インターフェースを動的に実装します。

### **5. 感情分析の実行**
```java
Sentiment sentiment = sentimentAnalyzer.analyzeSentimentOf("I love this product!");
System.out.println(sentiment); // Output: POSITIVE

boolean positive = sentimentAnalyzer.isPositive("This is a terrible experience.");
System.out.println(positive); // Output: false
```
- AIモデルは、指定されたテキストを事前定義された感情カテゴリの1つに分類します。
- `isPositive()`メソッドはブール結果を提供します。

---

## **埋め込みベースの分類**

`EmbeddingModelTextClassifier`は、入力を埋め込み、各ラベルの埋め込み例と比較することでテキストを分類します。すべてのクラスに代表的な例を提供でき、分類リクエストごとにLLM呼び出しが不要な場合に有用です。

```java
import dev.langchain4j.classification.EmbeddingModelTextClassifier;
import dev.langchain4j.classification.TextClassifier;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2q.AllMiniLmL6V2QuantizedEmbeddingModel;

import java.util.List;
import java.util.Map;

public class EmbeddingBasedSentimentClassification {

    enum Sentiment {
        POSITIVE, NEUTRAL, NEGATIVE
    }

    public static void main(String[] args) {

        Map<Sentiment, List<String>> examples = Map.of(
                Sentiment.POSITIVE, List.of("This is great!", "I love this product."),
                Sentiment.NEUTRAL, List.of("It is okay.", "This works as expected."),
                Sentiment.NEGATIVE, List.of("This is terrible.", "I am disappointed."));

        EmbeddingModel embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel();

        TextClassifier<Sentiment> classifier = new EmbeddingModelTextClassifier<>(embeddingModel, examples);

        List<Sentiment> sentiments = classifier.classify("Awesome experience!");
        System.out.println(sentiments); // [POSITIVE]
    }
}
```

返される各ラベルの類似度スコアが必要な場合は、`classifyWithScores(...)`も使用できます。分類器は、`maxResults`、`minScore`、および`meanToMaxScoreRatio`の設定に応じて、ゼロ、1つ、または複数のラベルを返すことができます。

---

## **ユースケース**
この感情分類サービスは、次のようなさまざまなアプリケーションで使用できます：

✅ **顧客フィードバック分析**：顧客レビューをポジティブ、ニュートラル、またはネガティブに分類します。  
✅ **ソーシャルメディア監視**：ソーシャルメディアコメントの感情トレンドを分析します。  
✅ **チャットボット応答**：ユーザーの感情を理解して、より良い応答を提供します。


## 例

- [LLMを使用した分類の例](https://github.com/langchain4j/langchain4j-examples/blob/5c5fc14613101a84fe32b39200e30701fec45194/other-examples/src/main/java/OtherServiceExamples.java#L27)
- [埋め込みを使用した分類の例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/embedding/classification/EmbeddingModelTextClassifierExample.java)
