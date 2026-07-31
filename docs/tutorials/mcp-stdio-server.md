---
sidebar_position: 17
---

# Java MCP stdio サーバーの構築

LangChain4j は MCP サーバーに接続するための MCP **クライアント**（`langchain4j-mcp`）を提供します。
Java ベースの MCP **stdio サーバー**（MCP クライアントが起動するローカルサブプロセス）を構築したい場合は、
コミュニティモジュール `langchain4j-community-mcp-server` を使用してください。

このガイドでは、既存の `@Tool` アノテーション付きメソッドを stdio 経由で MCP（JSON-RPC）として公開する最小構成を示します。

## 依存関係の追加

BOM を追加します（推奨）：

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-bom</artifactId>
            <version>${latest version here}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-community-bom</artifactId>
            <version>${latest version here}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

次にコミュニティ MCP サーバー依存関係を追加します：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-mcp-server</artifactId>
</dependency>
```

## ツールの実装

`@Tool` を使って機能を公開します：

```java
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;

class Calculator {

    @Tool
    long add(@P("a") long a, @P("b") long b) {
        return a + b;
    }
}
```

## stdio サーバーの起動

```java
import dev.langchain4j.community.mcp.server.McpServer;
import dev.langchain4j.community.mcp.server.transport.StdioMcpServerTransport;
import dev.langchain4j.mcp.protocol.McpImplementation;
import java.util.List;

public class McpServerMain {

    public static void main(String[] args) throws Exception {
        McpImplementation serverInfo = new McpImplementation();
        serverInfo.setName("my-java-mcp-server");
        serverInfo.setVersion("1.0.0");

        McpServer server = new McpServer(List.of(new Calculator()), serverInfo);
        new StdioMcpServerTransport(System.in, System.out, server);

        // Keep the process alive while stdio is open
        Thread.currentThread().join();
    }
}
```

:::caution
`StdioMcpServerTransport` は JSON-RPC プロトコルを `System.out` に書き込みます。
ログは `System.err` に出力するよう設定してください（そうしないとプロトコルストリームが壊れ、クライアントが切断します）。
:::

## 実行可能な JAR としてパッケージ化

MCP クライアント（Claude Desktop など）は通常、ローカルサーバープロセスの起動を期待します。
サーバーを実行可能（fat）JAR としてパッケージ化するのが一般的ですが、実行可能なプロセスであれば何でも構いません。

## MCP クライアントの設定

### Claude Desktop

`claude_desktop_config.json` にサーバーエントリを追加します：

```json
{
  "mcpServers": {
    "my-java-tool": {
      "command": "java",
      "args": ["-jar", "/absolute/path/to/my-java-mcp-server.jar"]
    }
  }
}
```

絶対パスを使用してください。Windows ではバックスラッシュをエスケープします。
