---
sidebar_position: 5
---

# 使い始める

:::note
Quarkusをご使用の場合は、[Quarkus統合](/tutorials/quarkus-integration/)をご参照ください。

Spring Bootをご使用の場合は、[Spring Boot統合](/tutorials/spring-boot-integration)をご参照ください。
:::

LangChain4jは[多様なLLMプロバイダーとの統合](/integrations/language-models/)を提供しています。
各統合には独自のMaven依存関係があります。
最も簡単な始め方はOpenAI統合を使用することです：

- Mavenの場合、`pom.xml`に：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>1.0.0-beta3</version>
</dependency>
```

高度な[AIサービス](/tutorials/ai-services) APIを使用したい場合は、以下の依存関係も追加する必要があります：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.0.0-beta3</version>
</dependency>
```

- Gradleの場合、`build.gradle`に：
```groovy
implementation 'dev.langchain4j:langchain4j-open-ai:1.0.0-beta3'
implementation 'dev.langchain4j:langchain4j:1.0.0-beta3'
```

<details>
<summary>Bill of Materials (BOM)</summary>

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-bom</artifactId>
            <version>1.0.0-beta3</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```
</details>

<details>
<summary>SNAPSHOT依存関係（最新機能）</summary>

公式リリース前に最新機能をテストしたい場合は、
最新のSNAPSHOT依存関係を使用できます：
```xml
<repositories>
    <repository>
        <id>snapshots-repo</id>
        <url>https://s01.oss.sonatype.org/content/repositories/snapshots</url>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
    </repository>
</repositories>

<dependencies>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j</artifactId>
        <version>1.0.0-beta4-SNAPSHOT</version>
    </dependency>
</dependencies>
```
</details>

次に、OpenAI APIキーをインポートします。
APIキーを環境変数に保存することで、公開露出のリスクを減らすことをお勧めします。
```java
String apiKey = System.getenv("OPENAI_API_KEY");
```

<details>
<summary>APIキーを持っていない場合はどうすればよいですか？</summary>

OpenAI APIキーをお持ちでなくても心配いりません。
デモ目的で、私たちが無料で提供する`demo`キーを一時的に使用できます。
`demo`キーを使用する場合、OpenAI APIへのすべてのリクエストは私たちのプロキシを経由する必要があり、
このプロキシはOpenAI APIに転送する前に実際のキーを挿入します。
私たちはいかなる方法でもあなたのデータを収集または使用しません。
`demo`キーには割当制限があり、`gpt-4o-mini`モデルの使用に限定されており、デモ目的でのみ使用すべきです。

```java
OpenAiChatModel model = OpenAiChatModel.builder()
    .baseUrl("http://langchain4j.dev/demo/openai/v1")
    .apiKey("demo")
    .modelName("gpt-4o-mini")
    .build();
```
</details>

キーを設定したら、`OpenAiChatModel`インスタンスを作成しましょう：
```java
OpenAiChatModel model = OpenAiChatModel.builder()
    .apiKey(apiKey)
    .modelName("gpt-4o-mini")
    .build();
```
さあ、チャットを始める時間です！
```java
String answer = model.chat("Say 'Hello World'");
System.out.println(answer); // Hello World
```
