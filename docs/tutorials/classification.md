---
sidebar_position: 12
---

# 分類

## **概要**
このドキュメントでは、Javaで**LangChain4j**を使用した分類システムの実装を提供します。分類は、**感情分析、意図検出、**および**エンティティ認識**などの、テキストを事前定義されたラベルに分類するために不可欠です。

この例では、LangChain4jのAI駆動サービスを使用した**感情分類**を示しています。

---

## **感情分類サービス**
感情分類システムは、入力テキストを以下の**感情カテゴリ**のいずれかに分類します：
- **POSITIVE**（ポジティブ）
- **NEUTRAL**（中立）
- **NEGATIVE**（ネガティブ）

### **実装**
```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.UserMessage;

public class SentimentClassification {

    // OpenAIを使用してチャットモデルを初期化
    static ChatModel chatModel = OpenAiChatModel.withApiKey("YOUR_OPENAI_API_KEY");

    // 感情を表すenumを定義
    enum Sentiment {
        POSITIVE, NEUTRAL, NEGATIVE
    }

    // AI駆動の感情分析インターフェースを定義
    interface SentimentAnalyzer {

        @UserMessage("Analyze sentiment of {{it}}")
        Sentiment analyzeSentimentOf(String text);

        @UserMessage("Does {{it}} have a positive sentiment?")
        boolean isPositive(String text);
    }

    public static void main(String[] args) {

        // AI駆動の感情分析インスタンスを作成
        SentimentAnalyzer sentimentAnalyzer = AiServices.create(SentimentAnalyzer.class, chatModel);

        // 感情分析の例
        Sentiment sentiment = sentimentAnalyzer.analyzeSentimentOf("I love this product!");
        System.out.println(sentiment); // 期待される出力: POSITIVE

        boolean positive = sentimentAnalyzer.isPositive("This is a terrible experience.");
        System.out.println(positive); // 期待される出力: false
    }
}
```

---

## **コンポーネントの説明**

### **1. チャットモデルの初期化**
```java
static ChatModel chatModel = OpenAiChatModel.withApiKey("YOUR_OPENAI_API_KEY");
```
- 自然言語テキストを処理するための**OpenAIチャットモデル**を初期化します。
- `"YOUR_OPENAI_API_KEY"`を実際のOpenAI APIキーに置き換えてください。

### **2. 感情カテゴリの定義**
```java
enum Sentiment {
    POSITIVE, NEUTRAL, NEGATIVE
}
```
- `Sentiment` enumは、可能な感情分類を表します。

### **3. AI駆動の感情分析器の作成**
```java
interface SentimentAnalyzer {
    
    @UserMessage("Analyze sentiment of {{it}}")
    Sentiment analyzeSentimentOf(String text);

    @UserMessage("Does {{it}} have a positive sentiment?")
    boolean isPositive(String text);
}
```
- このインターフェースは2つのAI駆動メソッドを定義します：
    - `analyzeSentimentOf(String text)`：与えられたテキストを**POSITIVE、NEUTRAL、**または**NEGATIVE**に分類します。
    - `isPositive(String text)`：テキストがポジティブな感情を持つ場合は`true`を返し、そうでない場合は`false`を返します。

### **4. AIサービスインスタンスの作成**
```java
SentimentAnalyzer sentimentAnalyzer = AiServices.create(SentimentAnalyzer.class, chatModel);
```
- `AiServices.create()`は、AIモデルを使用して`SentimentAnalyzer`インターフェースを動的に実装します。

### **5. 感情分析の実行**
```java
Sentiment sentiment = sentimentAnalyzer.analyzeSentimentOf("I love this product!");
System.out.println(sentiment); // 出力: POSITIVE

boolean positive = sentimentAnalyzer.isPositive("This is a terrible experience.");
System.out.println(positive); // 出力: false
```
- AIモデルは、与えられたテキストを事前定義された感情カテゴリのいずれかに分類します。
- `isPositive()`メソッドはブール値の結果を提供します。

---

## **ユースケース**
この感情分類サービスは、以下を含む様々なアプリケーションで使用できます：

✅ **顧客フィードバック分析**：顧客レビューをポジティブ、中立、またはネガティブに分類します。  
✅ **ソーシャルメディアモニタリング**：ソーシャルメディアコメントの感情傾向を分析します。  
✅ **チャットボットレスポンス**：ユーザーの感情を理解して、より良いレスポンスを提供します。


## 例

- [LLMを使用した分類の例](https://github.com/langchain4j/langchain4j-examples/blob/5c5fc14613101a84fe32b39200e30701fec45194/other-examples/src/main/java/OtherServiceExamples.java#L27)
- [埋め込みを使用した分類の例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/embedding/classification/EmbeddingModelTextClassifierExample.java)
