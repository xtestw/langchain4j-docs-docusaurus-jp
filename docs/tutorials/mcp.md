# モデルコンテキストプロトコル（MCP）

LangChain4jはモデルコンテキストプロトコル（MCP）をサポートしており、ツールを提供および実行できるMCP準拠サーバーと通信できます。プロトコルに関する一般的な情報は[MCPウェブサイト](https://modelcontextprotocol.io/)で確認できます。

このプロトコルは2種類のトランスポートを指定しており、どちらもサポートされています：

- `HTTP`：クライアントはサーバーからイベントを受信するためのSSEチャネルをリクエストし、HTTPのPOSTリクエストを通じてコマンドを送信します。
- `stdio`：クライアントはMCPサーバーをローカルサブプロセスとして実行し、標準入出力を通じて直接通信できます。

チャットモデルやAIサービスにMCPサーバーが提供するツールを実行させるには、MCPツールプロバイダーのインスタンスを作成する必要があります。

## MCPツールプロバイダーの作成

### MCPトランスポート

まず、MCPトランスポートのインスタンスが必要です。

stdioの場合 - この例ではNPMパッケージからサーバーをサブプロセスとして起動する方法を示しています：

```java
McpTransport transport = new StdioMcpTransport.Builder()
    .command(List.of("/usr/bin/npm", "exec", "@modelcontextprotocol/server-everything@0.6.2"))
    .logEvents(true) // ログにトラフィックを表示したい場合のみ
    .build();
```

HTTPの場合、SSEチャネルを開始するためのURLと、`POST`でコマンドを送信するためのURLの2つが必要です：

```java
McpTransport transport = new HttpMcpTransport.Builder()
    .sseUrl("http://localhost:3001/sse")
    .logRequests(true) // ログにトラフィックを表示したい場合
    .logResponses(true)
    .build();
```

### MCPクライアント

トランスポートからMCPクライアントを作成するには：

```java
McpClient mcpClient = new DefaultMcpClient.Builder()
    .transport(transport)
    .build();
```

### MCPツールプロバイダー

最後に、クライアントからMCPツールプロバイダーを作成します：

```java
ToolProvider toolProvider = McpToolProvider.builder()
    .mcpClients(List.of(mcpClient))
    .build();
```

1つのMCPツールプロバイダーが同時に複数のクライアントを使用できることに注意してください。
これを利用する場合、特定のサーバーからツールの取得に失敗した場合のツールプロバイダーの動作を指定することもできます。
これは`builder.failIfOneServerFails(boolean)`メソッドで行います。デフォルトは`false`で、
これはツールプロバイダーが1つのサーバーからのエラーを無視し、他のサーバーと続行することを意味します。
`true`に設定すると、いずれかのサーバーからの失敗によりツールプロバイダーは例外をスローします。

ツールプロバイダーをAIサービスにバインドするには、AIサービスビルダーの`toolProvider`メソッドを使用するだけです：

```java
Bot bot = AiServices.builder(Bot.class)
    .chatModel(model)
    .toolProvider(toolProvider)
    .build();
```

LangChain4jのツールサポートに関する詳細は[こちら](/tutorials/tools)で確認できます。

## ロギング

MCPプロトコルは、サーバーがクライアントにログメッセージを送信する方法も定義しています。
デフォルトでは、クライアントの動作はこれらのログメッセージを変換し、SLF4Jロガーを使用してログに記録することです。
この動作を変更したい場合は、受信したログメッセージのコールバックとして機能する
`dev.langchain4j.mcp.client.logging.McpLogMessageHandler`というインターフェースがあります。
`McpLogMessageHandler`の独自の実装を作成した場合は、MCPクライアントビルダーに渡します：

```java
McpClient mcpClient = new DefaultMcpClient.Builder()
    .transport(transport)
    .logMessageHandler(new MyLogMessageHandler())
    .build();
```

## リソース

サーバー上の[MCPリソース](https://modelcontextprotocol.io/docs/concepts/resources)のリストを取得するには、
`client.listResources()`を使用するか、リソーステンプレートの場合は`client.listResourceTemplates()`を使用します。
これにより`McpResource`オブジェクト（またはそれぞれ`McpResourceTemplate`）のリストが返されます。
これらにはリソースのメタデータが含まれており、最も重要なのはURIです。

リソースの実際の内容を取得するには、リソースのURIを指定して`client.readResource(uri)`を使用します。
これは`McpReadResourceResult`を返し、`McpResourceContents`オブジェクトのリストが含まれています
（1つのURIに複数のリソースコンテンツが存在する場合があります。例えばURIがディレクトリを表す場合など）。
各`McpResourceContents`オブジェクトはバイナリブロブ（`McpBlobResourceContents`）または
テキスト（`McpTextResourceContents`）のいずれかを表します。

## プロンプト

サーバーから[MCPプロンプト](https://modelcontextprotocol.io/docs/concepts/prompts)のリストを取得するには、
`client.listPrompts()`を使用します。このメソッドは`McpPrompt`のリストを返します。
`McpPrompt`にはプロンプトの名前と引数に関する情報が含まれています。

プロンプトの実際の内容をレンダリングするには、`client.getPrompt(name, arguments)`を使用します。
レンダリングされたプロンプトには1つから複数のメッセージが含まれ、これらは`McpPromptMessage`オブジェクトとして表されます。
各`McpPromptMessage`にはメッセージの役割（`user`、`assistant`など）と実際のメッセージの内容が含まれています。
現在サポートされているメッセージコンテンツタイプは：`McpTextContent`、`McpImageContent`、`McpEmbeddedResource`です。

`McpPromptMessage.toChatMessage()`を使用して、LangChain4jコアAPIの一般的な`dev.langchain4j.data.message.ChatMessage`に変換できます。
ただし、これはすべての場合に可能というわけではありません。例えば、プロンプトメッセージの`role`が`assistant`で、
テキスト以外のコンテンツが含まれている場合、例外がスローされます。
役割に関係なく、バイナリブロブコンテンツを持つメッセージを`ChatMessage`に変換することはサポートされていません。

## DockerでGitHub MCPサーバーを使用する

それでは、モデルコンテキストプロトコル（MCP）を使用して、AIモデルと外部ツールを標準化された方法で橋渡しする方法を見てみましょう。
次の例では、LangChain4j MCPクライアントを通じてGitHubと対話し、公開GitHubリポジトリから最新のコミットを取得して要約します。
そのために、車輪の再発明は必要なく、[MCP GitHubリポジトリ](https://github.com/modelcontextprotocol)にある既存の[GitHub MCP サーバー実装](https://github.com/modelcontextprotocol/servers/tree/main/src/github)を使用できます。

アイデアは、Dockerでローカルに実行されているGitHub MCPサーバーに接続して、最新のコミットを取得し要約するJavaアプリケーションを構築することです。
この例では、MCPのstdioトランスポートメカニズムを使用して、JavaアプリケーションとGitHub MCPサーバー間で通信します。

## GitHub MCPサーバーのDockerでのパッケージ化と実行

GitHubと対話するには、まずDockerでGitHub MCPサーバーをセットアップする必要があります。
GitHub MCPサーバーは、モデルコンテキストプロトコルを通じてGitHubと対話するための標準化されたインターフェースを提供します。
これにより、ファイル操作、リポジトリ管理、検索機能が可能になります。

GitHub MCPサーバー用のDockerイメージをビルドするには、[MCP serversのGitHubリポジトリ](https://github.com/modelcontextprotocol/servers/tree/main/src/github)からコードを取得する必要があります。リポジトリをクローンするか、コードをダウンロードしてください。
次に、ルートディレクトリに移動し、次のDockerコマンドを実行します：

```bash
docker build -t mcp/github -f src/github/Dockerfile .
```
`Dockerfile`は必要な環境をセットアップし、GitHub MCP サーバー実装をインストールします。
ビルドが完了すると、イメージはローカルで`mcp/github`として利用可能になります。

```bash
docker image ls

REPOSITORY   TAG         IMAGE ID        SIZE
mcp/github   latest      b141704170b1    173MB
```

## ツールプロバイダーの開発

LangChain4jを使用してGitHub MCPサーバーに接続する`McpGithubToolsExample`というJavaクラスを作成しましょう。このクラスは：

* GitHub MCPサーバーをDockerコンテナで起動します（`docker`コマンドは`/usr/local/bin/docker`で利用可能）
* stdioトランスポートを使用して接続を確立します
* LLMを使用してLangChain4j GitHubリポジトリの最後の3つのコミットを要約します

> **注意**：以下のコードでは、環境変数`GITHUB_PERSONAL_ACCESS_TOKEN`でGitHubトークンを渡しています。ただし、認証が不要な公開リポジトリの一部のアクションについてはこれはオプションです。

実装は次のとおりです：

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
        String response = bot.chat("LangChain4j GitHubリポジトリの最後の3つのコミットを要約してください");
        System.out.println("RESPONSE: " + response);
    } finally {
        mcpClient.close();
    }
}
```

:::note
すべてのLLMが同じようにツールをサポートしているわけではありません。
ツールを理解し、選択し、正しく使用する能力は、特定のモデルとその機能に大きく依存します。
一部のモデルはツールをまったくサポートしていない場合もあれば、慎重なプロンプトエンジニアリングや
追加のシステム指示が必要な場合もあります。
:::

> **注意**：この例ではDockerを使用しているため、`/usr/local/bin/docker`で利用可能なDockerコマンドを実行します（オペレーティングシステムに応じてパスを変更してください）。Dockerの代わりにPodmanを使用したい場合は、コマンドを適宜変更してください。

## コードの実行

この例を実行するには、システム上でDockerが起動して実行されていることを確認してください。
また、環境変数`OPENAI_API_KEY`にOpenAI APIキーを設定してください。

次に、Javaアプリケーションを実行します。LangChain4j GitHubリポジトリの最後の3つのコミットを要約するレスポンスが得られるはずです：

```
LangChain4j GitHubリポジトリの最後の3つのコミットの要約：

1. **コミット [36951f9](https://github.com/langchain4j/langchain4j/commit/36951f9649c1beacd8b9fc2d910a2e23223e0d93)** (日付: 2025-02-05)
   - **作者:** Dmytro Liubarskyi
   - **メッセージ:** `upload-pages-artifact@v3`に更新。
   - **詳細:** このコミットは、ページアーティファクトのアップロードに使用されるGitHub Actionをバージョン3に更新しています。

2. **コミット [6fcd19f](https://github.com/langchain4j/langchain4j/commit/6fcd19f50c8393729a0878d6125b0bb1967ac055)** (日付: 2025-02-05)
   - **作者:** Dmytro Liubarskyi
   - **メッセージ:** `checkout@v4`、`deploy-pages@v4`、`upload-pages-artifact@v4`に更新。
   - **詳細:** このコミットは、複数のGitHub Actionをバージョン4に更新しています。

3. **コミット [2e74049](https://github.com/langchain4j/langchain4j/commit/2e740495d2aa0f16ef1c05cfcc76f91aef6f6599)** (日付: 2025-02-05)
   - **作者:** Dmytro Liubarskyi
   - **メッセージ:** `setup-node@v4`と`configure-pages@v4`に更新。
   - **詳細:** このコミットは、`setup-node`と`configure-pages`のGitHub Actionをバージョン4に更新しています。

すべてのコミットは同じ作者（Dmytro Liubarskyi）によって同じ日に行われ、様々なGitHub Actionを新しいバージョンに更新することに焦点を当てています。
```
