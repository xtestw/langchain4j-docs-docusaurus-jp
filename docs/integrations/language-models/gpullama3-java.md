---
sidebar_position: 22
---
# GPULlama3.java
[GPULlama3.java](https://github.com/beehive-lab/GPULlama3.java)

GPULlama3.java は [TornadoVM](https://github.com/beehive-lab/TornadoVM) 上に構築され、GPU とヘテロジニアスコンピューティングを活用して、Java から直接より高速な LLM 推論を実現します。
現在、GPULlama3.java は PTX および OPENCL バックエンドを通じて、NVIDIA、AMD GPU、および Apple Silicon 上での推論をサポートします。

----
## プロジェクトセットアップ

プロジェクトに langchain4j をインストールするには、次の依存関係を追加します：

Maven プロジェクトの `pom.xml` 向け

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.18.1</version>
</dependency>

<dependency>
<groupId>dev.langchain4j</groupId>
<artifactId>langchain4j-gpu-llama3</artifactId>
<version>1.18.1-beta28</version>
</dependency>

```

Gradle プロジェクトの `build.gradle` 向け

```groovy
implementation 'dev.langchain4j:langchain4j:1.18.1'
implementation 'dev.langchain4j:langchain4j-gpu-llama3:1.18.1-beta28'
```
---
## モデル互換性

現在、GPULlama3.java は次の GGUF 形式モデルを FP16、Q8、Q4 形式でサポートします：
なお、Q8 および Q4 モデルは読み込み時に FP16 へデクオンタイズされます。
テスト済みモデルのコレクションは [HuggingFace](https://huggingface.co/beehive-lab/collections) リポジトリで維持しています。

* Llama3
* Mistral
* Qwen2.5
* Qwen3.0
* Phi-3
* DeepSeek-R1-Distill-Qwen-1.5B-GGUF
----
## チャット補完
チャットモデルは、会話データでファインチューニングされたモデルを使って、人間らしい応答を生成できます。

### 同期
クラスを作成し、次のコードを追加します。

```java
prompt = "What is the capital of France?";
ChatRequest request = ChatRequest.builder().messages(
    UserMessage.from(prompt),
    SystemMessage.from("reply with extensive sarcasm"))
    .build();

Path modelPath = Paths.get("beehive-llama-3.2-1b-instruct-fp16.gguf");

GPULlama3ChatModel model = GPULlama3ChatModel.builder()
        .modelPath(modelPath)
        .onGPU(Boolean.TRUE) //if false, runs on CPU though a lightweight implementation of llama3.java
        .build();
ChatResponse response = model.chat(request);
System.out.println("\n" + response.aiMessage().text());
```

### ストリーミング

クラスを作成し、次のコードを追加します。

```java
public static void main(String[] args) {
    CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();

    String prompt;

    if (args.length > 0) {
        prompt = args[0];
        System.out.println("User Prompt: " + prompt);
    } else {
        prompt = "What is the capital of France?";
        System.out.println("Example Prompt: " + prompt);
    }

    ChatRequest request = ChatRequest.builder().messages(
                    UserMessage.from(prompt),
                    SystemMessage.from("reply with extensive sarcasm"))
            .build();

    Path modelPath = Paths.get("beehive-llama-3.2-1b-instruct-fp16.gguf");


    GPULlama3StreamingChatModel model = GPULlama3StreamingChatModel.builder()
            .onGPU(Boolean.TRUE) // if false, runs on CPU though a lightweight implementation of llama3.java
            .modelPath(modelPath)
            .build();

    model.chat(request, new StreamingChatResponseHandler() {

        @Override
        public void onPartialResponse(String partialResponse) {
            System.out.print(partialResponse);
        }

        @Override
        public void onCompleteResponse(ChatResponse completeResponse) {
            futureResponse.complete(completeResponse);
            model.printLastMetrics();
        }

        @Override
        public void onError(Throwable error) {
            futureResponse.completeExceptionally(error);
        }
    });

    futureResponse.join();
}
```

## 実行方法：

例を実行するには TornadoVM の設定が必要です
詳細な手順は **[Setup & Configure](https://github.com/beehive-lab/GPULlama3.java?tab=readme-ov-file#prerequisites)** を参照してください
#### **ステップ 1 — Tornado JVM フラグを取得**

次のコマンドを実行します（Tornado のインストールが必要です）：

```bash
tornado --printJavaFlags
```

出力例：

```bash
/home/mikepapadim/.sdkman/candidates/java/current/bin/java -server \
 -XX:+UnlockExperimentalVMOptions -XX:+EnableJVMCI \
-XX:-UseCompressedClassPointers --enable-preview \
-Djava.library.path=/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/lib \
--module-path .:/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/share/java/tornado \
-Dtornado.load.api.implementation=uk.ac.manchester.tornado.runtime.tasks.TornadoTaskGraph \
-Dtornado.load.runtime.implementation=uk.ac.manchester.tornado.runtime.TornadoCoreRuntime \
-Dtornado.load.tornado.implementation=uk.ac.manchester.tornado.runtime.common.Tornado \
-Dtornado.load.annotation.implementation=uk.ac.manchester.tornado.annotation.ASMClassVisitor \
-Dtornado.load.annotation.parallel=uk.ac.manchester.tornado.api.annotations.Parallel \
--upgrade-module-path /home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/share/java/graalJars \
-XX:+UseParallelGC \
@/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/etc/exportLists/common-exports \
@/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/etc/exportLists/opencl-exports \
--add-modules ALL-SYSTEM,tornado.runtime,tornado.annotation,tornado.drivers.common,tornado.drivers.opencl
```

#### **ステップ 2 — Maven classpath を構築**

プロジェクトルートから実行します：

```bash
mvn dependency:build-classpath -Dmdep.outputFile=cp.txt
```

#### **ステップ 3 — Maven classpath を構築**

```bash
mvn clean package
```

メイン JAR の場所：
```bash
target/gpullama3.java-example-1.18.1-beta28.jar
```

#### **ステップ 4 — Java で直接プログラムを実行**
これですべての JVM および Tornado フラグを付けて例を実行できます：

```bash
JAVA_BIN=/home/mikepapadim/.sdkman/candidates/java/current/bin/java
CP="target/gpullama3.java-example-1.18.1-beta28.jar:$(cat cp.txt)"

$JAVA_BIN \
  -server \
  -XX:+UnlockExperimentalVMOptions \
  -XX:+EnableJVMCI \
  --enable-preview \
  -Djava.library.path=/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/lib \
  --module-path .:/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/share/java/tornado \
  -Dtornado.load.api.implementation=uk.ac.manchester.tornado.runtime.tasks.TornadoTaskGraph \
  -Dtornado.load.runtime.implementation=uk.ac.manchester.tornado.runtime.TornadoCoreRuntime \
  -Dtornado.load.tornado.implementation=uk.ac.manchester.tornado.runtime.common.Tornado \
  -Dtornado.load.annotation.implementation=uk.ac.manchester.tornado.annotation.ASMClassVisitor \
  -Dtornado.load.annotation.parallel=uk.ac.manchester.tornado.api.annotations.Parallel \
  --upgrade-module-path /home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/share/java/graalJars \
  -XX:+UseParallelGC \
  @/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/etc/exportLists/common-exports \
  @/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/etc/exportLists/opencl-exports \
  --add-modules ALL-SYSTEM,tornado.runtime,tornado.annotation,tornado.drivers.common,tornado.drivers.opencl \
  -Xms6g -Xmx6g \
  -Dtornado.device.memory=6GB \
  -cp "$CP" \
  GPULlama3ChatModelExamples
```

## 期待される出力：

```bash
WARNING: Using incubator modules: jdk.incubator.vector
Example Prompt: What is the capital of France?
SLF4J(W): No SLF4J providers were found.
SLF4J(W): Defaulting to no-operation (NOP) logger implementation
SLF4J(W): See https://www.slf4j.org/codes.html#noProviders for further details.
Wow, I'm so glad you asked. I've been waiting for someone to finally ask me this question. It's not like I have better things to do, like take a nap or something. So, yes, the capital of France is... (dramatic pause) ...Paris!

achieved tok/s: 48.86. Tokens: 87, seconds: 1.78
```

## 注意：

* GPU 利用率は、NVIDIA GPU では `nvidia-smi`、AMD/Apple Silicon では 'nvtop' などの適切なツールで監視できます。
