---
sidebar_position: 12
toc_max_heading_level: 5
---

import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# ガードレール（Guardrails）

:::note
ガードレールは実験的な機能です。API と動作は将来のバージョンで変更される可能性があります。
:::

ガードレールは、LLM の入力と出力を検証し、期待どおりであることを保証するための仕組みです。ガードレールでは、例えば次のようなことができます：
- ユーザー入力が範囲外でないことを確認する
- LLM を呼び出す前に入力が一定の条件を満たすことを保証する（例：[プロンプトインジェクション攻撃](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) への対策）
- 出力形式が正しいことを保証する（例：正しいスキーマを持つ JSON ドキュメントであること）
- LLM の出力がビジネスルールと制約に整合していることを保証する（例：これが会社 X のチャットボットである場合、応答に競合他社 Y への言及が含まれないこと）
- 幻覚（hallucinations）を検出する

これらはあくまで例です。ガードレールではほかにも多くのことができます。

:::note
ガードレールは [AI Services](/tutorials/ai-services) を使用する場合にのみ利用できます。より高水準の構成要素であり、`ChatModel` や `StreamingChatModel` には適用できません。
:::

<ThemedImage
  alt="Guardrails"
  sources={{
    light: useBaseUrl('/img/guardrails-light-bg.png'),
    dark: useBaseUrl('/img/guardrails-dark-bg.png'),
  }}
/>;

この実装はもともと [Quarkus LangChain4j 拡張](https://docs.quarkiverse.io/quarkus-langchain4j/dev/) で行われ、ここにバックポートされました。

## ガードレールの実装

理想的には、ガードレールの実装は [単一責任の原則](https://en.wikipedia.org/wiki/Single-responsibility_principle) に従うべきです。つまり、各ガードレールクラスは 1 つのことだけを検証します。その後、ガードレールをチェーンして複数の事柄を防ぐようにします。

チェーン内のガードレールの順序は重要です。チェーン内で最初に失敗したガードレールが全体の失敗を引き起こします。最も多くの失敗を捕捉するガードレールをチェーンの前半に置き、失敗頻度が非常に低いより特化したガードレールをチェーンの後半に置くようにしてください。

また、ガードレール自体が他のサービスを呼び出したり、他の LLM 対話を起動したりできることにも留意してください。こうしたガードレールに実行コストや金銭的コストが伴う場合は、それを考慮に入れてください。より「高価」なガードレールはチェーンの末尾に置くとよいでしょう。

:::note
用語 _高価（expensive）_ は、実行に時間がかかること、または金銭的コストが伴うことを意味します。
:::

## 入力ガードレール

入力ガードレールは、LLM が呼び出される前に実行される関数です。入力ガードレールが失敗すると、LLM の呼び出しが防止されます。入力ガードレールは LLM 呼び出し直前の最後のステップです。[RAG](/tutorials/rag) 操作が行われた _後に_ 呼び出されます。

### 入力ガードレールの実装

入力ガードレールは [`InputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/InputGuardrail.java) インターフェースを実装することで実現します。`InputGuardrail` インターフェースには `validate` メソッドの 2 つのバリアントがあり、少なくとも 1 つを実装する必要があります：

```java
InputGuardrailResult validate(UserMessage userMessage);
InputGuardrailResult validate(InputGuardrailRequest params);
```

最初のバリアントは、単純なガードレール、またはガードレールが [`UserMessage`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/data/message/UserMessage.java) へのアクセスだけを必要とする場合に使用します。

2 番目のバリアントは、チャットメモリ/履歴、ユーザーメッセージテンプレート、拡張（augmentation）結果、テンプレートに渡された変数など、より多くの情報を必要とする複雑なガードレール向けです。詳細は [`InputGuardrailRequest`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/InputGuardrailRequest.java) を参照してください。

できることの例：
- 拡張結果に十分なドキュメントがあることを確認する
- ユーザーが同じ質問を何度もしていないことを保証する
- 潜在的なプロンプトインジェクション攻撃を緩和する
- コミュニティの [Prompt Repetition](/integrations/prompt-repetition/) モジュールで、対象となる単一テキスト入力を書き換える

入力ガードレールは、操作が同期でも非同期/ストリーミングでも使用できます。

### 入力ガードレールの結果

入力ガードレールは次の結果を取り得ます。`InputGuardrail` インターフェースには、これらの結果を提供するヘルパーメソッドがあります：

| 結果                             | `InputGuardrail` 上のヘルパーメソッド                 | 説明                                                                                                                                                                |
|:------------------------------------|:--------------------------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **_success_**                       | `success()`                                       | - 入力は有効です。<br/> - チェーン内の次のガードレールが実行されます。<br/> - 最後のガードレールが通過すれば LLM が呼び出されます。                                           |
| **_success with alternate result_** | `successWith(String)`                             | **_success_** と似ていますが、次のステップ（チェーン内の次のガードレールまたは LLM の呼び出し）に進む前にユーザーメッセージが変更されます。                           |
| **_failure_**                       | `failure(String)` または `failure(String, Throwable)` | - 入力は無効ですが、考えられるすべての検証問題を蓄積するため、チェーン内の後続ガードレールは引き続き実行されます。<br/> - LLM は呼び出されません。<br/> - `Throwable` が渡された場合、呼び出し側は `InputGuardrailException` をキャッチして `cause` を確認できます。ここに渡された `Throwable` になります。 |
| **_fatal_**                         | `fatal(String)` または `fatal(String, Throwable)`     | - 入力は無効であり、`InputGuardrailException` で実行が中断されます。<br/> - LLM は呼び出されません。<br/> - `Throwable` が渡された場合、呼び出し側は `InputGuardrailException` をキャッチして `cause` を確認できます。ここに渡された `Throwable` になります。                                                        |

### 入力ガードレールの宣言

入力ガードレールの宣言方法はいくつかあり、優先順位の高い順に次のとおりです：
1. [`AiServices`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/AiServices.java) ビルダーに直接設定された [`InputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/InputGuardrail.java) 実装のクラス名またはインスタンス。
2. 個々の [AI Service](/tutorials/ai-services) メソッドに付けられた [`@InputGuardrails` アノテーション](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/InputGuardrails.java)。
3. [AI Service](/tutorials/ai-services) クラスに付けられた [`@InputGuardrails` アノテーション](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/InputGuardrails.java)。
宣言方法に関係なく、入力ガードレールは常にリストに現れる順序で実行されます。

#### `AiServices` ビルダー

[`AiServices`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/AiServices.java) ビルダーに直接設定された [`InputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/InputGuardrail.java) 実装のクラス名またはインスタンスが最も高い優先順位を持ちます。つまり、他の方法で宣言されていても、ビルダーに直接宣言されたものが使用されます。

```java
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .inputGuardrailClasses(FirstInputGuardrail.class, SecondInputGuardrail.class)
    .build();
```

または

```java
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .inputGuardrails(new FirstInputGuardrail(), new SecondInputGuardrail())
    .build();
```

:::info
プロンプト反復（prompt repetition）を使って対象となる単一テキスト入力を書き換える、既製の実験的入力ガードレールが必要な場合は、コミュニティの [Prompt Repetition](/integrations/prompt-repetition/) モジュールを参照してください。
:::

最初のシナリオでは、`InputGuardrail` を実装するクラスが渡されます。これらのクラスの新しいインスタンスはリフレクションを使って動的に作成されます。

:::info
クラスをインスタンスに変換する方法はカスタマイズできます。例えば、依存性注入を使うフレームワーク（[Quarkus](https://quarkus.io) や [Spring](https://spring.io) など）は、[拡張ポイント](#extension-points) を使って、毎回リフレクションで新しいインスタンスを作成するのではなく、クラスインスタンスの管理方法に基づいてインスタンスを提供できます。
:::

#### 個々の AI Service メソッドへのアノテーション

個々の [AI Service](/tutorials/ai-services) メソッドに付けられた [`@InputGuardrails` アノテーション](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/InputGuardrails.java) が次に高い優先順位を持ちます。

```java
public interface Assistant {
    @InputGuardrails({ FirstInputGuardrail.class, SecondInputGuardrail.class })
    String chat(String question);
    
    String doSomethingElse(String question);
}

var assistant = AiServices.create(Assistant.class, chatModel);
```

この例では、`chat` メソッドだけがガードレールを持ちます。
- `chat` メソッドでは、まず `FirstInputGuardrail` が呼び出されます。
- それが成功した場合にのみ LLM が呼び出されます。
- `FirstInputGuardrail` が **_fatal_** 結果にならなかった場合にのみ、`SecondInputGuardrail` が呼び出されます。
- `FirstInputGuardrail` または `SecondInputGuardrail` のいずれもユーザーメッセージを書き換えられます。
- `FirstInputGuardrail` がユーザーメッセージを書き換えた場合、`SecondInputGuardrail` は新しいユーザーメッセージを入力として受け取ります。

`doSomethingElse` メソッドにはガードレールがありません。

#### AI Service クラスへのアノテーション

[AI Service](/tutorials/ai-services) クラスに付けられた [`@InputGuardrails` アノテーション](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/InputGuardrails.java) が最も低い優先順位を持ちます。

```java
@InputGuardrails({ FirstInputGuardrail.class, SecondInputGuardrail.class })
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.create(Assistant.class, chatModel);
```

この例では、`chat` と `doSomethingElse` の両メソッドがガードレールを持ちます。
- 前の例と同様に、まず `FirstInputGuardrail` が呼び出されます。
- それが成功した場合にのみ LLM が呼び出されます。
- `FirstInputGuardrail` が **_fatal_** 結果にならなかった場合にのみ、`SecondInputGuardrail` が呼び出されます。
- `FirstInputGuardrail` または `SecondInputGuardrail` のいずれもユーザーメッセージを書き換えられます。
- `FirstInputGuardrail` がユーザーメッセージを書き換えた場合、`SecondInputGuardrail` は新しいユーザーメッセージを入力として受け取ります。

### 入力ガードレールのユニットテスト

`langchain4j-test` モジュールには、[AssertJ](https://assertj.github.io/doc/) に基づくユニットテスト用ユーティリティがあります。

<Tabs>
  <TabItem value="maven" label="Maven" default>
    ```xml
    <dependency>
      <groupId>dev.langchain4j</groupId>
      <artifactId>langchain4j-test</artifactId>
      <scope>test</scope>
    </dependency>
    ```
  </TabItem>
  <TabItem value="gradleGroovy" label="Gradle (Groovy)">
    ```groovy
    testImplementation 'dev.langchain4j:langchain4j-test'
    ```
  </TabItem>
  <TabItem value="gradleKotlin" label="Gradle (Kotlin)">
    ```kotlin
    testImplementation("dev.langchain4j:langchain4j-test")
    ```
  </TabItem>
</Tabs>

依存関係を追加したら、次のような検証を行えます：

```java
import static dev.langchain4j.test.guardrail.GuardrailAssertions.assertThat;

import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.guardrail.GuardrailResult.Result;

class Tests { 
    MyInputGuardrail inputGuardrail = new MyInputGuardrail();
    
    @Test 
    void test() {
        var userMessage = UserMessage.from("Some user message");
        var result = inputGuardrail.validate(userMessage);
        
        // These are just some examples of what you can do
        assertThat(result)
                .isSuccessful()
                .hasResult(Result.FATAL)
                .hasFailures()
                .hasSingleFailureWithMessage("Prompt injection detected")
                .assertSingleFailureSatisfied(failure -> assertThat(failure)...)
                .withFailures().....
    }
}
```

:::info
詳細は [`GuardrailAssertions`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-test/src/main/java/dev/langchain4j/test/guardrail/GuardrailAssertions.java) および [`InputGuardrailResultAssert`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-test/src/main/java/dev/langchain4j/test/guardrail/InputGuardrailResultAssert.java) クラスを参照してください。
:::

### 標準提供の入力ガードレール

一般的なユースケース向けに、LangChain4j が入力ガードレールの実装をいくつか提供しています：

| ガードレールクラス                                                                                                                                                                              | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`MessageModeratorInputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-guardrails/src/main/java/dev/langchain4j/guardrails/MessageModeratorInputGuardrail.java) | [`ModerationModel`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/model/moderation/ModerationModel.java) を使ってユーザーメッセージを検証し、有害・不適切・ポリシー違反の可能性のあるコンテンツを検出する入力ガードレールです。<br/> - ヘイトスピーチ、暴力、自傷、性的コンテンツ、またはモデレーションモデルが定義する他のカテゴリについて受信メッセージを確認します。<br/> - メッセージがフラグ付けされた場合、検証は fatal 結果で失敗し、メッセージの以降の処理を防ぎます。<br/> - LLM に送る前にユーザー入力がコンテンツポリシーに準拠していることを保証するのに役立ちます。 |
| [`PatternBasedPromptInjectionGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-guardrails/src/main/java/dev/langchain4j/guardrails/PatternBasedPromptInjectionGuardrail.java) | [OWASP LLM01](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 由来の正規表現を使ってプロンプトインジェクション試行を検出する、パターンベースの入力ガードレールです。<br/> - 指示の上書き、ロールハイジャック、ジェイルブレイク、システムプロンプト漏洩、区切り文字インジェクション、エンコードされたペイロードをカバーします。<br/> - 外部依存ゼロでサブミリ秒のレイテンシがあり、LLM ベースの分類器の前に置くガードレールチェーンの最初（最も安価な）ゲートとして適しています。<br/> - サブクラスでドメイン固有のパターンを追加し、失敗メッセージをカスタマイズできます。 |

## 出力ガードレール

出力ガードレールは、LLM が出力を生成したあとに実行される関数です。出力ガードレールの失敗は、応答を改善するための[再試行（retry）](#retry)や[再プロンプト（reprompt）](#reprompt)といったより高度なシナリオを可能にします。関数/ツール呼び出しを含む他のすべての操作が完了した _後に_ 呼び出されます。

### 出力ガードレールの実装

入力ガードレールと同様に、出力ガードレールは [`OutputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/OutputGuardrail.java) インターフェースを実装することで実現します。`OutputGuardrail` インターフェースには `validate` メソッドの 2 つのバリアントがあり、少なくとも 1 つを実装する必要があります：

```java
OutputGuardrailResult validate(AiMessage responseFromLLM);
OutputGuardrailResult validate(OutputGuardrailRequest params);
```

最初のバリアントは、単純なガードレール、またはガードレールが結果の [`AiMessage`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/data/message/AiMessage.java) へのアクセスだけを必要とする場合に使用します。

2 番目のバリアントは、チャット応答全体、チャットメモリ/履歴、ユーザーメッセージテンプレート、テンプレートに渡された変数など、より多くの情報を必要とする複雑なガードレール向けです。詳細は [`OutputGuardrailRequest`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/OutputGuardrailRequest.java) を参照してください。

できることの例：
- 出力形式が正しいことを保証する（例：正しいスキーマを持つ JSON ドキュメントであること）
- LLM の幻覚を検出する
- LLM 応答に特定の情報が含まれていることを検証する

### 出力ガードレールの結果

出力ガードレールは次の結果を取り得ます。`OutputGuardrail` インターフェースには、これらの結果を提供するヘルパーメソッドがあります：

| 結果                    | `OutputGuardrail` 上のヘルパーメソッド                                  | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|:---------------------------|:--------------------------------------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **_success_**              | `success()`                                                         | - 出力は有効です。<br/> - チェーン内の次のガードレールが実行されます。最後のガードレールが通過すれば、出力が呼び出し側に返されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **_success with rewrite_** | `successWith(String)` または `successWith(String, Object)`              | - **_success_** と似ていますが、出力は元の形式では無効であり、有効になるよう書き換えられています。<br/> - 書き換えられた出力に対して次のガードレールが実行されます。最後のガードレールが通過すれば、出力が呼び出し側に返されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **_failure_**              | `failure(String)` または `failure(String, Throwable)`                   | - 出力は無効ですが、考えられるすべての検証問題を蓄積するため、チェーン内の後続ガードレールは引き続き実行されます。<br/> - 検証失敗は `OutputGuardrailException` としてユーザーに返されます。                                                                                                                                                                                                                                                                                                                                                                                 |
| **_fatal_**                | `fatal(String)` または `fatal(String, Throwable)`                       | 出力は無効であり、呼び出し側に投げられる `OutputGuardrailException` で実行が中断されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **_fatal with retry_**     | `retry(String)` または `retry(String, Throwable)`                       | - **_fatal_** と似ていますが、元の呼び出しと同じプロンプトとチャット履歴で LLM が再度呼び出されます。<br/> - [設定可能な再試行回数](#configuration) のあとも失敗が続く場合、呼び出し側に投げられる `OutputGuardrailException` で実行が中断されます。<br/> - 再試行後にガードレールが通過した場合、ガードレールのチェーン全体が最初から再実行されます。                                                                                                                                                                                                        |
| **_fatal with reprompt_**  | `reprompt(String, String)` または `reprompt(String, Throwable, String)` | - **_fatal with retry_** と似ていますが、ガードレールが提供する新しいプロンプトで LLM が再度呼び出されます。<br/> - この場合、ガードレールは前のユーザーメッセージに追加するメッセージを提供し、新しいユーザーメッセージと元のチャット履歴で LLM に新しいリクエストを送ります。<br/> - [設定可能な再試行回数](#configuration) のあとも失敗が続く場合、呼び出し側に投げられる `OutputGuardrailException` で実行が中断されます。<br/> - 再プロンプト後にガードレールが通過した場合、ガードレールのチェーン全体が最初から再実行されます。 |

### 出力ガードレールの宣言

出力ガードレールの宣言方法はいくつかあり、優先順位の高い順に次のとおりです：
1. [`AiServices`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/AiServices.java) ビルダーに直接設定された [`OutputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/OutputGuardrail.java) 実装のクラス名またはインスタンス。
2. 個々の [AI Service](/tutorials/ai-services) メソッドに付けられた [`@OutputGuardrails` アノテーション](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/OutputGuardrails.java)。
3. [AI Service](/tutorials/ai-services) クラスに付けられた [`@OutputGuardrails` アノテーション](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/OutputGuardrails.java)。

宣言方法に関係なく、出力ガードレールは常にリストに現れる順序で実行されます。

#### `AiServices` ビルダー

[`AiServices`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/AiServices.java) ビルダーに直接設定された [`OutputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/OutputGuardrail.java) 実装のクラス名またはインスタンスが最も高い優先順位を持ちます。つまり、他の方法で宣言されていても、ビルダーに宣言されたものが使用されます。

```java
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .outputGuardrailClasses(FirstOutputGuardrail.class, SecondOutputGuardrail.class)
    .build();
```

または

```java
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .outputGuardrails(new FirstOutputGuardrail(), new SecondOutputGuardrail())
    .build();
```

最初のシナリオでは、`OutputGuardrail` を実装するクラスが渡されます。これらのクラスの新しいインスタンスはリフレクションを使って動的に作成されます。

:::info
クラスをインスタンスに変換する方法はカスタマイズできます。例えば、依存性注入を使うフレームワーク（[Quarkus](https://quarkus.io) や [Spring](https://spring.io) など）は、[拡張ポイント](#extension-points) を使って、毎回リフレクションで新しいインスタンスを作成するのではなく、クラスインスタンスの管理方法に基づいてインスタンスを提供できます。
:::

#### 個々の AI Service メソッドへのアノテーション

個々の [AI Service](/tutorials/ai-services) メソッドに付けられた [`@OutputGuardrails` アノテーション](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/OutputGuardrails.java) が次に高い優先順位を持ちます。

```java
public interface Assistant {
    @OutputGuardrails({ FirstOutputGuardrail.class, SecondOutputGuardrail.class })
    String chat(String question);
    
    String doSomethingElse(String question);
}

var assistant = AiServices.create(Assistant.class, chatModel);
```

この例では、`chat` メソッドだけがガードレールを持ちます。
- `chat` メソッドでは、まず `FirstOutputGuardrail` が呼び出されます。
- それが成功した場合にのみ結果が呼び出し側に返されます。`FirstOutputGuardrail` が **_fatal_**、**_fatal with retry_**、または **_fatal with reprompt_** 結果にならなかった場合にのみ、`SecondOutputGuardrail` が呼び出されます。
- `SecondOutputGuardrail` は `FirstOutputGuardrail` の出力を受け取ります。
- `SecondOutputGuardrail` が再試行または再プロンプトのあとに成功した場合、`FirstOutputGuardrail` と `SecondOutputGuardrail` の両方が再実行されます。

`doSomethingElse` メソッドにはガードレールがありません。

#### AI Service クラスへのアノテーション

[AI Service](/tutorials/ai-services) クラスに付けられた [`@OutputGuardrails` アノテーション](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/OutputGuardrails.java) が最も低い優先順位を持ちます。

```java
@OutputGuardrails({ FirstOutputGuardrail.class, SecondOutputGuardrail.class })
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.create(Assistant.class, chatModel);
```

この例では、`chat` と `doSomethingElse` の両メソッドがガードレールを持ちます。
- 前の例と同様に、まず `FirstOutputGuardrail` が呼び出されます。
- それが成功した場合にのみ結果が呼び出し側に返されます。`FirstOutputGuardrail` が **_fatal_**、**_fatal with retry_**、または **_fatal with reprompt_** 結果にならなかった場合にのみ、`SecondOutputGuardrail` が呼び出されます。
- `SecondOutputGuardrail` は `FirstOutputGuardrail` の出力を受け取ります。
- `SecondOutputGuardrail` が再試行または再プロンプトのあとに成功した場合、`FirstOutputGuardrail` と `SecondOutputGuardrail` の両方が再実行されます。

#### 設定 {#configuration}

出力ガードレールには、次の追加設定を指定できます：

| 設定 | 説明                                                                                                                                                |
|:--------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `maxRetries`  | - 再試行または再プロンプトを行う際の、出力ガードレールの最大再試行回数。<br/> - デフォルトは `2`。<br/> - 再試行を無効にするには `0` に設定します。 |

##### 個々の AI Service メソッドへのアノテーション

```java
public interface MethodLevelAssistant {
    @OutputGuardrails(
            value = { FirstOutputGuardrail.class, SecondOutputGuardrail.class },
            maxRetries = 10
    )
    String chat(String question);
}

var assistant = AiServices.create(MethodLevelAssistant.class, chatModel);
```

##### AI Service クラスへのアノテーション

```java
@OutputGuardrails(
        value = { FirstOutputGuardrail.class, SecondOutputGuardrail.class },
        maxRetries = 10
)
public interface ClassLevelAssistant {
    String chat(String question);
}

var assistant = AiServices.create(ClassLevelAssistant.class, chatModel);
```

##### `AiServices` ビルダー

```java
public interface Assistant {
    String chat(String message);
}

var outputGuardrailsConfig = OutputGuardrailsConfig.builder()
        .maxRetries(10)
        .build();

var assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .outputGuardrailsConfig(outputGuardrailsConfig)
        .outputGuardrailClasss(FirstOutputGuardrail.class, SecondOutputGuardrail.class)
        .build();
```

### ストリーミング応答での出力ガードレール

出力ガードレールは、ストリーミング応答を伴う操作でも機能します：

```java
public interface StreamingAssistant {
    @OutputGuardrails({ FirstOutputGuardrail.class, SecondOutputGuardrail.class })
    TokenStream streamingChat(String message);
}
```

このシナリオでは、ストリーム全体が完了したとき、より具体的には `TokenStream.onCompleteResponse` が呼び出されたときに、出力ガードレールが実行されます。`onPartialResponse` はバッファリングされ、ガードレールが成功したあとに再生されます。

チェーン内の **_retry_** または **_reprompt_** が最終的に成功した場合、チェーン全体が _同期的に_ 再実行されます。各ガードレールは元の順序で 1 つずつ再実行されます。チェーンが完了すると、結果が `TokenStream.onCompleteResponse` に渡されます。

### 標準提供の出力ガードレール

一般的なユースケース向けに、LangChain4j が出力ガードレールの実装をいくつか提供しています：

| ガードレールクラス                                                                                                                                                                         | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`JsonExtractorOutputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-guardrails/src/main/java/dev/langchain4j/guardrails/JsonExtractorOutputGuardrail.java) | 応答が JSON から特定の型のオブジェクトへ正常にデシリアライズできるかどうかを確認する出力ガードレールです。<br/> - [Jackson ObjectMapper](https://github.com/FasterXML/jackson-databind) を使ってオブジェクトのデシリアライズを試みます。<br/> - 応答を期待されるオブジェクト型にデシリアライズできない場合、LLM に再プロンプトします。<br/> - そのまま使用することも、拡張してカスタマイズすることもできます（動作をカスタマイズするためにオーバーライド可能な `protected` メソッドがいくつかあります）。 |

### 出力ガードレールのユニットテスト

`langchain4j-test` モジュールには、[AssertJ](https://assertj.github.io/doc/) に基づくユニットテスト用ユーティリティがあります。

<Tabs>
  <TabItem value="maven" label="Maven" default>
    ```xml
    <dependency>
      <groupId>dev.langchain4j</groupId>
      <artifactId>langchain4j-test</artifactId>
      <scope>test</scope>
    </dependency>
    ```
  </TabItem>
  <TabItem value="gradleGroovy" label="Gradle (Groovy)">
    ```groovy
    testImplementation 'dev.langchain4j:langchain4j-test'
    ```
  </TabItem>
  <TabItem value="gradleKotlin" label="Gradle (Kotlin)">
    ```kotlin
    testImplementation("dev.langchain4j:langchain4j-test")
    ```
  </TabItem>
</Tabs>

依存関係を追加したら、次のような検証を行えます：

```java
import static dev.langchain4j.test.guardrail.GuardrailAssertions.assertThat;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.guardrail.GuardrailResult.Result;

class Tests { 
    MyOutputGuardrail outputGuardrail = new MyOutputGuardrail();
    
    @Test 
    void test() {
        var aiMessage = AiMessage.from("Some output");
        var result = outputGuardrail.validate(aiMessage);
        
        // These are just some examples of what you can do
        assertThat(result)
                .isSuccessful()
                .hasResult(Result.FATAL)
                .hasFailures()
                .hasSingleFailureWithMessage("Hallucination detected!")
                .hasSingleFailureWithMessageAndReprompt("Hallucination detected!", "Please LLM don't hallucinate!")
                .assertSingleFailureSatisfied(failure -> assertThat(failure)...)
                .withFailures().....
    }
}
```

:::info
詳細は [`GuardrailAssertions`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-test/src/main/java/dev/langchain4j/test/guardrail/GuardrailAssertions.java) および [`OutputGuardrailResultAssert`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-test/src/main/java/dev/langchain4j/test/guardrail/OutputGuardrailResultAssert.java) クラスを参照してください。
:::

## 組み合わせ

入力ガードレールと出力ガードレールは、好きなように組み合わせて使えます！

```java
public class MyObjectJsonOutputGuardrail extends JsonExtractorOutputGuardrail<MyObject> {
    public MyObjectJsonOutputGuardrail() {
        super(MyObject.class);
    }
}

@InputGuardrails({ FirstInputGuardrail.class, SecondInputGuardrail.class })
@OutputGuardrails(value = SomeOutputGuardrail.class, maxRetries = 5)
public interface Assistant {
    String chat(String message);
    
    @InputGuardrails(PatternBasedPromptInjectionGuardrail.class)
    @OutputGuardrails(MyObjectJsonOutputGuardrail.class)
    MyObject chatAndReturnJson(String message);
}

var outputGuardrailsConfig = OutputGuardrailsConfig.builder()
        .maxRetries(10)
        .build();

var assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .inputGuardrails(new AnotherInputGuardrail())
        .outputGuardrailsConfig(outputGuardrailsConfig)
        .build();
```

この例では、`AiServices` ビルダー上で設定されているため、`Assistant` のすべてのメソッドが単一の入力ガードレール `AnotherInputGuardrail` を持ちます。さらに、設定も `AiServices` ビルダー上で設定されているため、すべての出力ガードレールの `maxRetries` 値は `10` になります。

`chat` メソッドは単一の出力ガードレール `SomeOutputGuardrail` を持ち、`maxRetries` 値は `10` です。

`chatAndReturnJson` メソッドは単一の出力ガードレール `MyObjectJsonOutputGuardrail` を持ち、`maxRetries` 値は `10` です。

## 拡張ポイント {#extension-points}

ガードレールシステムは、他の下流フレームワーク（[Quarkus](https://quarkus.io) や [Spring Boot](https://spring.io/projects/spring-boot) など）で拡張・再利用できるよう、組み合わせ可能な形で構築されています。このセクションでは、提供されている拡張ポイントまたは「フック」の一部を説明します。

これらの拡張ポイントはすべて [Java Service Provider Interface（Java SPI）](https://www.baeldung.com/java-spi) を利用します。

| 拡張ポイントインターフェース                                                                                                                                                                                    | 目的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`ClassInstanceFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/classloading/ClassInstanceFactory.java)                                     | クラスのインスタンスを提供します。<br/> - インスタンスの作成/取得を他の手段に委譲することを意図しています。<br/> - 提供されない場合、デフォルトコンストラクタを使ってリフレクションでインスタンスを作成します。<br/> - 他のフレームワーク（Quarkus や Spring など）は、独自の bean コンテナを使ってクラスのインスタンスを提供する場合があります。それらのフレームワークが実装を提供します。<br/> - Quarkus の実装は [`CDIClassInstanceFactory`](https://github.com/langchain4j/langchain4j/blob/main/integration-tests/integration-tests-class-instance-loader/integration-tests-class-instance-loader-quarkus/src/main/java/com/example/CDIClassInstanceFactory.java) のようなものになる可能性があります<br/> - Spring の実装は [`ApplicationContextClassInstanceFactory`](https://github.com/langchain4j/langchain4j/blob/main/integration-tests/integration-tests-class-instance-loader/integration-tests-class-instance-loader-spring/src/main/java/com/example/classes/ApplicationContextClassInstanceFactory.java) のようなものになる可能性があります |
| [`ClassMetadataProviderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/classloading/ClassMetadataProviderFactory.java)                     | クラスメタデータへのアクセスを提供します。<br/> - `AiService` インターフェース上のメソッドをスキャンし、`@InputGuardrails`/`@OutputGuardrails` アノテーションを見つけて処理するために使用されます。<br/> - 他の実装が見つからない場合のデフォルト実装は [`ReflectionBasedClassMetadataProviderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/classloading/ReflectionBasedClassMetadataProviderFactory.java) で、リフレクションを使ってクラスメタデータを提供します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
 | [`GuardrailServiceBuilderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/spi/GuardrailServiceBuilderFactory.java)                 | [`GuardrailService`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/GuardrailService.java) インスタンスを構築するためのビルダーインスタンスを提供します。`GuardrailService` インスタンスの構築方法をカスタマイズする必要がある場合、アプリケーションまたはフレームワークがこれを実装します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
 | [`InputGuardrailsConfigBuilderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/guardrail/config/InputGuardrailsConfigBuilderFactory.java)   | - デフォルトの [`InputGuardrailsConfigBuilder`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/config/InputGuardrailsConfigBuilder.java) をオーバーライドおよび/または拡張するための SPI<br/> - 他のフレームワークが、入力ガードレール用の追加設定を持つ独自の実装を提供する場合があります。<br/> - 他のフレームワークが別の仕組み（例：プロパティファイル）経由で入力ガードレール設定を駆動することも可能にします。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| [`OutputGuardrailsConfigBuilderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/guardrail/config/OutputGuardrailsConfigBuilderFactory.java) | - デフォルトの [`OutputGuardrailsConfigBuilder`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/config/OutputGuardrailsConfigBuilder.java) をオーバーライドおよび/または拡張するための SPI<br/> - 他のフレームワークが、出力ガードレール用の追加設定を持つ独自の実装を提供する場合があります。<br/> - 他のフレームワークが別の仕組み（例：プロパティファイル）経由で出力ガードレール設定を駆動することも可能にします。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| [`InputGuardrailExecutorBuilderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/guardrail/InputGuardrailExecutorBuilderFactory.java)        | - デフォルトの `InputGuardrailExecutorBuilder`（[`InputGuardrailExecutor`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/InputGuardrailExecutor.java) インスタンスの構築を担当）をオーバーライドおよび/または拡張するための SPI。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [`OutputGuardrailExecutorBuilderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/guardrail/OutputGuardrailExecutorBuilderFactory.java)      | - デフォルトの `OutputGuardrailExecutorBuilder`（[`OutputGuardrailExecutor`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/OutputGuardrailExecutor.java) インスタンスの構築を担当）をオーバーライドおよび/または拡張するための SPI。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

