# モデルコンテキストプロトコル（MCP）

LangChain4j はモデルコンテキストプロトコル（MCP）をサポートしており、ツールを提供・実行できる
MCP 準拠サーバーと通信できます。プロトコルの一般情報については
[MCP 公式サイト](https://modelcontextprotocol.io/) を参照してください。

:::note
Java で MCP **stdio サーバー**を構築したい場合は？
サーバー実装は LangChain4j Community にあります。[Java MCP stdio サーバーの構築](./mcp-stdio-server) を参照してください。
:::

プロトコルは 2 種類のトランスポートを規定しており、いずれもサポートされています。

- [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http):
  クライアントが HTTP リクエストを送信し、サーバーは通常のレスポンスで応答するか、
  時間をかけて複数のレスポンスを送る必要がある場合は SSE ストリームを開きます。
- [stdio](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#stdio): クライアントは
  MCP サーバーをローカルのサブプロセスとして実行し、
  標準入出力経由で直接通信できます。

仕様に加え、LangChain4j は `WebSocket` トランスポートも実装しています。このトランスポートは
標準化されておらず、現時点ではクライアント側が
[Quarkus MCP Server 拡張](https://docs.quarkiverse.io/quarkus-mcp-server/dev) の WebSocket トランスポートと
互換になるよう実装されています。WebSocket を公開していても
他のフレームワークで構築された MCP サーバーとの互換性は保証されません。

さらに LangChain4j は、コンテナイメージとして配布される stdio MCP サーバーを利用できる
Docker stdio トランスポートもサポートしています。

LangChain4j はレガシーの
[HTTP/SSE トランスポート](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse)
もサポートしていますが、これは非推奨であり、将来削除される予定です。

チャットモデルや AI サービスに MCP サーバーが提供するツールを実行させるには、
MCP ツールプロバイダーのインスタンスを作成する必要があります。

## MCP ツールプロバイダーの作成

### MCP トランスポート

まず、MCP トランスポートのインスタンスが必要です。

stdio の場合 — 次の例は NPM パッケージからサーバーをサブプロセスとして起動する方法を示します。

```java
McpTransport transport = StdioMcpTransport.builder()
    .command(List.of("/usr/bin/npm", "exec", "@modelcontextprotocol/server-everything@0.6.2"))
    .logEvents(true) // only if you want to see the traffic in the log
    .build();
```

Streamable HTTP トランスポートでは、サーバーの `POST` エンドポイントの URL を指定します。

```java
McpTransport transport = StreamableHttpMcpTransport.builder()
        .url("http://localhost:3001/mcp")
        .logRequests(true) // if you want to see the traffic in the log
        .logResponses(true)
        .build();
```

**_NOTE:_** Streamable HTTP トランスポートは、サーバー起点の通知やリクエストを受信するために、
オプションで補助的な
[GET ベースの SSE ストリーム](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#listening-for-messages-from-the-server)
を開けます。ビルダーで `.subsidiaryChannel(true)` を指定して有効にします。
デフォルトでは無効です。サーバーがサポートしていない場合、トランスポートは警告をログに出し、なしで続行します。
確立後にストリームが切れた場合、トランスポートは自動で再接続します（サーバーの `retry` 値を尊重し、デフォルトは 5 秒）。

WebSocket トランスポートの場合:
```java
McpTransport transport = WebSocketMcpTransport.builder()
        .url("ws://localhost:3001/mcp/ws")
        .logResponses(true)
        .logRequests(true)
        .build();
```

レガシー HTTP トランスポートでは URL が 2 つあります。1 つは SSE チャネルの開始用、もう 1 つは `POST` によるコマンド送信用です。
後者はサーバーから動的に提供され、前者は `sseUrl` メソッドで指定する必要があります。

```java
McpTransport transport = HttpMcpTransport.builder()
    .sseUrl("http://localhost:3001/sse")
    .logRequests(true) // if you want to see the traffic in the log
    .logResponses(true)
    .build();
```

Docker stdio トランスポートでは、まず pom.xml にモジュールを追加します。

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-mcp-docker</artifactId>
</dependency>
```

次に Docker トランスポートを作成します。

```java
McpTransport transport = DockerMcpTransport.builder()
    .image("mcp/time")
    .dockerHost("unix:///var/run/docker.sock")
    .logEvents(true) // if you want to see the traffic in the log
    .build();
```

### MCP クライアント

トランスポートから MCP クライアントを作成するには:

```java
McpClient mcpClient = DefaultMcpClient.builder()
    .key("MyMCPClient")
    .transport(transport)
    .build();
```

クライアントのキーは任意ですが、特に MCP クライアントが複数ある場合や
それらを区別する必要がある場合は設定することを推奨します。

### MCP ツールプロバイダー

最後に、クライアントから MCP ツールプロバイダーを作成します。

```java
McpToolProvider toolProvider = McpToolProvider.builder()
    .mcpClients(mcpClient)
    .build();
```

1 つの MCP ツールプロバイダーは同時に複数のクライアントを利用できます。
その場合、特定のサーバーからのツール取得に失敗したときの挙動も指定できます。
これは `builder.failIfOneServerFails(boolean)` メソッドで行います。デフォルトは `false` で、
あるサーバーからのエラーを無視して他のサーバーで続行します。`true` に設定すると、
いずれかのサーバーの失敗でツールプロバイダーが例外をスローします。

また、MCP サーバーはしばしば数十のツールを提供しますが、ある AI サービスが
必要とするのはその一部だけということがあります。不要なツールの利用を防ぎ、
幻覚の可能性を減らすためです。`McpToolProvider` では次のように名前でツールを
フィルタリングできます。

```java
McpToolProvider toolProvider = McpToolProvider.builder()
    .mcpClients(mcpClient)
    .filterToolNames("get_issue", "get_issue_comments", "list_issues")
    .build();
```

このように設定した `ToolProvider` を持つ AI サービスは、挙げた 3 つのツールだけを使え、
既存の issue の読み取りはできても新規作成はできません。より一般には、`ToolProvider` は
`BiPredicate<McpClient, ToolSpecification>` でツールをフィルタできます。これは複数の
MCP クライアントが同名で衝突するツールを公開している場合にも有用です。
例えば次の `ToolProvider` は 2 つの MCP クライアントからツールを取りますが、
どちらも `echoInteger` というツールを持つため、キー `numeric-mcp` の
MCP クライアントのものだけを取ります。

```java
McpToolProvider toolProvider = McpToolProvider.builder()
    .mcpClients(mcpClient1, mcpClient2)
    .filter((mcpClient, tool) ->
            !tool.name().startsWith("echoInteger") || 
            mcpClient.key().equals("numeric-mcp"))
    .build();
```

同じ `McpToolProvider` ビルダーで `filter` メソッドを複数回呼ぶと、
それらのフィルタの論理積（AND）になります。

実行時にアプリケーションが MCP サーバーへ接続・切断できるように、
既存の `McpToolProvider` インスタンスへクライアントやフィルタを動的に追加・削除することもできます。

ツールプロバイダーを AI サービスにバインドするには、AI サービスビルダーの
`toolProvider` メソッドを使います。

```java
Bot bot = AiServices.builder(Bot.class)
    .chatModel(model)
    .toolProvider(toolProvider)
    .build();
```

あるいは、`Map<ToolSpecification, ToolExecutor>` でツールを提供することもできます。

```java
Map<ToolSpecification, ToolExecutor> tools = mcpClient.listTools().stream().collect(Collectors.toMap(
        tool -> tool, 
        tool -> new McpToolExecutor(mcpClient)
));
```

ツールを AI サービスにバインドするには、AI サービスビルダーの `tools` メソッドを使います。

```java
Bot bot = AiServices.builder(Bot.class)
    .chatModel(model)
    .tools(tools)
    .build();
```

LangChain4j のツールサポートの詳細は [こちら](/tutorials/tools) を参照してください。

### MCP ツール名のマッピング

複数の MCP サーバーを使い、それらが衝突する名前のツールを公開している場合（または
不適切な名前を調整したい場合）、ツール名マッピング関数を適用すると便利です。
これは `McpToolProvider` 作成時に `BiFunction<McpClient, ToolSpecification, String>` を指定することで行えます。

例:
```java
McpToolProvider toolProvider = McpToolProvider.builder()
        .mcpClients(mcpClient1, mcpClient2)
        .toolNameMapper((client, toolSpec) -> {
            // Prefix all tool names with the name of the MCP client and an underscore
            return client.key() + "_" + toolSpec.name();
        })
        .build();
```

この後、ツールプロバイダーが返す `ToolSpecification` オブジェクトにはマッピング後の（論理）名が含まれますが、
生成される `ToolExecutor` オブジェクトはツール呼び出し時にサーバーへ元の（物理）名を渡すよう固定されます。

### MCP ツール仕様のマッピング

上記の MCP ツールマッピングと同様に、完全な `ToolSpecification` をマッピングすることもできます。
```java
McpToolProvider toolProvider = McpToolProvider.builder()
        .mcpClients(mcpClient)
        .toolSpecificationMapper((client, toolSpec) -> {
            // Prefix all tool names with "myprefix_" and convert the description to uppercase
            return toolSpec.toBuilder()
                .name("myprefix_" + toolSpec.name())
                .description(toolSpec.description().toUpperCase())
                .build();
        })
        .build();
```

### MCP ツールのメタデータ

MCP プロトコルでは、サーバーが各ツールにアノテーションの形、またはツール定義の `_meta` フィールドで
追加のメタデータを提供できます。
LangChain4j はこのメタデータすべてを `ToolSpecification.metadata()` メソッド内のマップ経由で公開します。
アノテーションは `dev.langchain4j.mcp.client.McpToolMetadataKeys` クラスの定数として
見つかるキーでマップに格納されます。
`_meta` フィールドの内容は元のキーで格納され、JSON 値はネストしたマップとしてシリアライズされます。

MCP ツール定義に直接存在する `title` フィールドは、メタデータマップの
`McpToolMetadataKeys.TITLE` キーの下に公開され、アノテーションから取得される title と区別します。
後者は `McpToolMetadataKeys.ANNOTATION_TITLE` キーの下に公開されます。

ツールにアイコンがある場合、それらはメタデータマップの `McpToolMetadataKeys.ICONS` キーの下に公開されます。

## `_meta` フィールドの提供

MCP プロトコルでは、クライアントがサーバーへ送るすべてのリクエストおよび通知の `params` に
`_meta` オブジェクトを付与できます。これは OpenTelemetry のトレースコンテキスト、
カスタムアプリケーションメタデータ、その他サーバーが必要とする帯域外情報の受け渡しに使えます。

`_meta` フィールドを供給するには、クライアントビルダーに `McpMetaSupplier` を登録します。
サプライヤーは各リクエストまたは通知の前に呼び出され、返されたマップが `params._meta` に置かれます。
HTTP ヘッダーとは異なり、すべてのトランスポート（stdio、HTTP、WebSocket）で動作します。

```java
McpClient mcpClient = DefaultMcpClient.builder()
    .transport(transport)
    .metaSupplier(context -> Map.of(
        "traceparent", "00-0af7651916cd43dd8448eb211c80319c-00f067aa0ba902b7-01",
        "custom-key", "custom-value"))
    .build();
```

サプライヤーは、送信中のメッセージと、該当する場合はそれを起動した AI サービス呼び出しの
`InvocationContext` を含む `McpCallContext`（nullable）を受け取ります。これにより、
実行中の操作に応じてメタデータを変えることができます。

## ロギング

MCP プロトコルは、サーバーがクライアントへログメッセージを送る方法も定義しています。
デフォルトでは、クライアントはこれらのログメッセージを変換し、SLF4J ロガーで記録します。
この挙動を変えたい場合は、受信したログメッセージのコールバックとなる
`dev.langchain4j.mcp.client.logging.McpLogMessageHandler` というインタフェースがあります。
独自の `McpLogMessageHandler` 実装を作成したら、MCP クライアントビルダーに渡します。

```java
McpClient mcpClient = new DefaultMcpClient.Builder()
    .transport(transport)
    .logMessageHandler(new MyLogMessageHandler())
    .build();
```

## MCP リスナー

MCP クライアントは、クライアントの生存期間中に起こるイベントをリッスンできるリスナーをサポートします。
`dev.langchain4j.mcp.client.McpClientListener` インタフェースがリスナー実装の基底です。
1 つのクライアントに複数のリスナーを登録でき、すべてのツール呼び出し、プロンプト描画、
リソースアクセスの前後にそれぞれ呼び出されます。リスナー呼び出し時には対応する
`McpCallContext` が注入されます。このオブジェクトにはサーバーへ送られる実際の MCP メッセージと、
該当する場合（この呼び出しが AI サービス呼び出しの一部である場合のみ）の
`InvocationContext` インスタンスが含まれます。

リスナーは 1 つずつ、または一括で追加できます。

```java
McpClient mcpClient = DefaultMcpClient.builder()
    .transport(transport)
    .addListener(new MyFirstListener())
    .addListener(new MySecondListener())
    .addListeners(List.of(new MyThirdListener(), new MyFourthListener()))
    .build();
```

## リソース

リソースの扱い方は 2 通りあります。アプリケーションが MCP クライアントのリソース関連メソッドを
呼び出してプログラム的にアクセスするか、合成ツール（リソース一覧取得用とリソース内容取得用）経由で
LLM 呼び出しにリソースを自動公開し、チャットモデルが自らリソースを参照できるようにする方法です。

### プログラムによるリソースアクセス

サーバー上の [MCP リソース](https://modelcontextprotocol.io/docs/concepts/resources) の一覧を取得するには
`client.listResources()` を使います。リソーステンプレートの場合は `client.listResourceTemplates()` です。
これは `McpResource` オブジェクト（またはそれぞれ `McpResourceTemplate`）のリストを返します。
これらにはリソースのメタデータ、特に重要な URI が含まれます。

リソースの実際の内容を取得するには、リソースの URI を渡して `client.readResource(uri)` を使います。
これは `McpReadResourceResult` を返し、その中に `McpResourceContents` オブジェクトのリストがあります
（1 つの URI に複数のリソース内容がある場合もあります。例えば URI がディレクトリを表す場合）。
各 `McpResourceContents` オブジェクトはバイナリブロブ（`McpBlobResourceContents`）か
テキスト（`McpTextResourceContents`）のどちらかを表します。

### 合成ツールによるリソースの自動公開

`McpToolProvider` を構築する際にビルダーで `McpResourcesAsToolsPresenter` インスタンスを設定すると、
MCP ツールプロバイダーは裏側の MCP サーバーがサポートする「通常の」ツールに加え、
`provideTools` メソッドの結果に 2 つの合成ツールを自動追加します。一方はリソース一覧の取得用、
もう一方は特定リソースの取得用です。LangChain4j はこれら 2 つのツールを追加する
`DefaultMcpResourcesAsToolsPresenter` というデフォルト実装を提供します。

**_NOTE:_** 本節の残りは `DefaultMcpResourcesAsToolsPresenter` について説明します。挙動の異なる
独自実装を差し込むこともできます。

- `list_resources`: 裏側の MCP サーバーが公開するすべてのリソースを一覧します。このツールは引数を取りません。
- `get_resource`: リソースの内容を読み取ります。このツールはリソースを識別する 2 つの引数を取ります。
MCP サーバー名と URI です。

`list_resources` の出力は次のような JSON 配列です。

```json
[ {
  "mcpServer" : "alice",
  "uri" : "file:///info",
  "uriTemplate" : null,
  "name" : "basicInfo",
  "description" : "Basic information about Alice",
  "mimeType" : "text/plain"
}, {
  "mcpServer" : "bob",
  "uri" : "file:///info",
  "uriTemplate" : null,
  "name" : "basicInfo",
  "description" : "Basic information about Bob",
  "mimeType" : "text/plain"
} ]
```

この配列の各ドキュメントは 1 つのリソースを表します。各リソースは `uri` と `mcpServer` の組み合わせで識別され、
`mcpServer` は作成時に MCP クライアントへ割り当てた `key` の値です（`DefaultMcpClient.Builder#key` を参照）。
チャットモデルが `list_resources` ツールを呼び出すと、このリソース一覧を受け取り、次に
`read_resource` を呼び出すかを決められます。`list_resources` と `get_resource` ツールのデフォルト説明は、
ほとんどの状況で LLM に使い方を説明するのに十分です。ただし、これらのツールや引数の説明を
カスタマイズする必要がある場合は、`DefaultMcpResourcesAsToolsPresenter.Builder` のメソッドで上書きします。

### リソースのサブスクリプション

MCP プロトコルは [リソースのサブスクリプション](https://modelcontextprotocol.io/specification/2025-11-25/server/resources#subscriptions)
をサポートしており、サーバー上のリソースが変更されたときにクライアントへ通知できます。

特定リソースの更新を購読するには `client.subscribeToResource(uri)` を使います。
サーバーがリソースを更新すると、`notifications/resources/updated` 通知を送ります。
これらの通知を処理するには、`onResourceUpdated` ビルダーメソッドでコールバックを登録します。

```java
McpClient mcpClient = DefaultMcpClient.builder()
    .transport(transport)
    .onResourceUpdated((client, uri) -> {
        // re-read the updated resource
        McpReadResourceResult result = client.readResource(uri);
        // process the updated contents...
    })
    .build();

// subscribe to a resource
mcpClient.subscribeToResource("file:///status");

// later, unsubscribe
mcpClient.unsubscribeFromResource("file:///status");
```

## プロンプト

サーバーから [MCP プロンプト](https://modelcontextprotocol.io/docs/concepts/prompts) の一覧を取得するには
`client.listPrompts()` を使います。このメソッドは `McpPrompt` の List を返します。`McpPrompt` には
プロンプトの名前と引数に関する情報が含まれます。

プロンプトの実際の内容を描画するには `client.getPrompt(name, arguments)` を使います。描画されたプロンプトは
1 つ以上のメッセージを含むことができ、これらは `McpPromptMessage` オブジェクトとして表されます。
各 `McpPromptMessage` にはメッセージのロール（`user`、`assistant`、...）と実際の内容が含まれます。
現時点でサポートされるメッセージ内容タイプは `McpTextContent`、`McpImageContent`、
`McpEmbeddedResource` です。

`McpPromptMessage.toChatMessage()` を使って、LangChain4j コア API の汎用
`dev.langchain4j.data.message.ChatMessage` に変換できます。ただしすべての場合で可能なわけではありません。
例えば、プロンプトメッセージの `role` が `assistant` でテキスト以外の内容を含む場合は例外をスローします。
バイナリブロブ内容のメッセージを `ChatMessage` に変換することは、ロールに関係なくサポートされません。

## Docker 経由での GitHub MCP サーバーの利用

ここでは、モデルコンテキストプロトコル（MCP）を使って AI モデルと外部ツールを標準化された方法で橋渡しする例を見ていきます。
次の例では、LangChain4j MCP クライアント経由で GitHub と対話し、公開 GitHub リポジトリの最新コミットを取得して要約します。
車輪の再発明は不要で、[MCP GitHub リポジトリ](https://github.com/modelcontextprotocol) にある既存の
[GitHub MCP サーバー実装](https://github.com/github/github-mcp-server) を利用できます。

アイデアは、Docker でローカル実行中の GitHub MCP サーバーに接続する Java アプリケーションを構築し、
最新コミットを取得して要約することです。この例では MCP の stdio トランスポート機構を使い、
Java アプリケーションと GitHub MCP サーバー間で通信します。

## Docker での GitHub MCP サーバーのパッケージングと実行

GitHub と対話するには、まず Docker で GitHub MCP サーバーをセットアップする必要があります。
GitHub MCP サーバーは、モデルコンテキストプロトコル経由で GitHub と対話するための標準化されたインタフェースを提供します。
ファイル操作、リポジトリ管理、検索機能が可能です。

GitHub MCP サーバー用の Docker イメージをビルドするには、[MCP servers GitHub リポジトリ](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
からコードをクローンするかダウンロードして取得します。
次にルートディレクトリに移動し、次の Docker コマンドを実行します。

```bash
docker build -t mcp/github -f src/github/Dockerfile .
```
`Dockerfile` は必要な環境をセットアップし、GitHub MCP サーバー実装をインストールします。
ビルド後、イメージはローカルで `mcp/github` として利用可能になります。

```bash
docker image ls

REPOSITORY   TAG         IMAGE ID        SIZE
mcp/github   latest      b141704170b1    173MB
```

## ツールプロバイダーの開発

LangChain4j を使って GitHub MCP サーバーに接続する `McpGithubToolsExample` という Java クラスを作成しましょう。このクラスは次を行います。

* Docker コンテナで GitHub MCP サーバーを起動する（`docker` コマンドは `/usr/local/bin/docker` で利用可能）
* stdio トランスポートで接続を確立する
* LLM を使って LangChain4j GitHub リポジトリの直近 3 コミットを要約する

> **Note**: 下記のコードでは環境変数 `GITHUB_PERSONAL_ACCESS_TOKEN` に GitHub トークンを渡しています。ただし、認証が不要な公開リポジトリ上の一部操作では任意です。

実装は次のとおりです。

```java
public static void main(String[] args) throws Exception {

    ChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .logRequests(true)
        .logResponses(true)
        .build();

    McpTransport transport = new StdioMcpTransport.Builder()
        .command(List.of("/usr/local/bin/docker", "run", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "-i", "mcp/github"))
        .logEvents(true)
        .build();

    McpClient mcpClient = new DefaultMcpClient.Builder()
        .transport(transport)
        .build();

    ToolProvider toolProvider = McpToolProvider.builder()
        .mcpClients(List.of(mcpClient))
        .build();

    Bot bot = AiServices.builder(Bot.class)
        .chatModel(model)
        .toolProvider(toolProvider)
        .build();

    try {
        String response = bot.chat("Summarize the last 3 commits of the LangChain4j GitHub repository");
        System.out.println("RESPONSE: " + response);
    } finally {
        mcpClient.close();
    }
}
```

:::note
すべての LLM がツールを同程度にうまくサポートするわけではありません。
ツールを理解し、選択し、正しく使う能力は、特定のモデルとその能力に大きく依存します。
一部のモデルはツールをまったくサポートせず、他のモデルでは丁寧なプロンプトエンジニアリングや
追加のシステム指示が必要になる場合があります。
:::

> **Note**: この例は Docker を使うため、`/usr/local/bin/docker` で利用可能な Docker コマンドを実行します（OS に合わせてパスを変更してください）。Docker の代わりに Podman を使う場合は、コマンドをそれに合わせて変更してください。

## コードの実行

例を実行するには、システム上で Docker が起動していることを確認してください。
また、環境変数 `OPENAI_API_KEY` に OpenAI API キーを設定してください。

その後 Java アプリケーションを実行します。LangChain4j GitHub リポジトリの直近 3 コミットを要約するレスポンスが得られるはずです。例えば次のようなものです。

```
Here are the summaries of the last three commits in the LangChain4j GitHub repository:

1. **Commit [36951f9](https://github.com/langchain4j/langchain4j/commit/36951f9649c1beacd8b9fc2d910a2e23223e0d93)** (Date: 2025-02-05)
   - **Author:** Dmytro Liubarskyi
   - **Message:** Updated to `upload-pages-artifact@v3`.
   - **Details:** This commit updates the GitHub Action used for uploading pages artifacts to version 3.

2. **Commit [6fcd19f](https://github.com/langchain4j/langchain4j/commit/6fcd19f50c8393729a0878d6125b0bb1967ac055)** (Date: 2025-02-05)
   - **Author:** Dmytro Liubarskyi
   - **Message:** Updated to `checkout@v4`, `deploy-pages@v4`, and `upload-pages-artifact@v4`.
   - **Details:** This commit updates multiple GitHub Actions to their version 4.

3. **Commit [2e74049](https://github.com/langchain4j/langchain4j/commit/2e740495d2aa0f16ef1c05cfcc76f91aef6f6599)** (Date: 2025-02-05)
   - **Author:** Dmytro Liubarskyi
   - **Message:** Updated to `setup-node@v4` and `configure-pages@v4`.
   - **Details:** This commit updates the `setup-node` and `configure-pages` GitHub Actions to version 4.

All commits were made by the same author, Dmytro Liubarskyi, on the same day, focusing on updating various GitHub Actions to newer versions.
```

## AI サービスなしでの MCP の利用

これまでの例では高レベルの AI Services API で MCP を使う方法を示しました。ただし、低レベル API 経由で MCP を使うことも可能です。
構築した `DefaultMcpClient` インスタンスを手動で使い、サーバーに対してコマンドを実行できます。いくつかの例:

```java
// obtain a list of tools from the server
List<ToolSpecification> toolSpecifications = mcpClient.listTools();

// build and execute a ChatRequest that has access to the MCP tools
ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("What will the weather be like in London tomorrow?"))
        .toolSpecifications(toolSpecifications)
        .build();
ChatResponse response = chatModel.chat(chatRequest);
AiMessage aiMessage = response.aiMessage();

// if the LLM requested to invoke a tool, forward it to the MCP server
if(aiMessage.hasToolExecutionRequests()) {
    for (ToolExecutionRequest req : aiMessage.toolExecutionRequests()) {
        String resultString = mcpClient.executeTool(req);
        // prepare the result for adding it to the memory for the next ChatRequest...
        ToolExecutionResultMessage resultMessage = ToolExecutionResultMessage.from(req.id(), req.name(), resultString);
    }
}
```

チャットの外で MCP クライアントを使いツールを直接プログラム的に実行したい場合は、
`ToolExecutionRequest` インスタンスを手動で構築する必要があります。

```java
// to execute a tool named "tool1" with argument "a=b"
ToolExecutionRequest request = ToolExecutionRequest.builder()
                .name("tool1")
                .arguments("{\"a\": \"b\"}")
                .build();
String toolResult = mcpClient.executeTool(request);
```

## ツールキャッシュに関する注意

`DefaultMcpClient` は MCP ツールの内部キャッシュを保持します。一度取得すると、
サーバーがリスト更新の通知を送らない限り、ツールリストは MCP サーバーへ再要求されません。
このキャッシュは `DefaultMcpClient.evictToolListCache()` を呼び出して手動でクリアできます。
キャッシュを完全に無効にしたい場合は、次のようにクライアントを設定します。

```java
McpClient mcpClient = new DefaultMcpClient.Builder()
    .key("MyMCPClient")
    .transport(transport)
    .cacheToolList(false)
    .build();
```

## MCP レジストリクライアント

LangChain4j は [MCP レジストリ](https://registry.modelcontextprotocol.io/docs#/) と通信できる
別のクライアント実装も提供しています。現時点では読み取り専用操作のみ実装されています
（MCP サーバーの検索はできますが、管理や追加はサポートされていません。それには
[公式ツール](https://github.com/modelcontextprotocol/registry/blob/main/docs/guides/publishing/publish-server.md) を使ってください）。

**_WARNING:_** MCP サーバーを発見して利用する（特にローカル実行する）ことには深刻なセキュリティリスクが伴う場合があります。
公開レジストリで見つけた MCP サーバーを実行する前に、信頼できることを確認してください。

レジストリクライアントは `dev.langchain4j.mcp.registryclient` パッケージにあり、次のように初期化できます。

```java
McpRegistryClient client = DefaultMcpRegistryClient.builder()
        .baseUrl("URL-OF-THE-REGISTRY")
        .build();
```

ベース URL を指定しない場合、公式レジストリがデフォルトとして使われます（https://registry.modelcontextprotocol.io）。
MCP サーバーを検索するには `registry.listServers(McpServerListRequest)` メソッドを使います。
`McpServerListRequest` オブジェクトは `McpServerListRequest.Builder` クラスで構築できます。
LangChain4j の Java API は、公式の
[MCP Registry Reference](https://registry.modelcontextprotocol.io/docs) に記載された MCP レジストリの REST API と
密接に対応しています。
