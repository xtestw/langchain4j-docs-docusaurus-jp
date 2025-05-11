---
sidebar_position: 2
---

# Google Cloud Storage

ストレージバケットからドキュメントをロードできるGoogle Cloud Storage（GCS）ドキュメントローダーです。

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-document-loader-google-cloud-storage</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

## API

- `GoogleCloudStorageDocumentLoader`

## 認証

認証は以下の場合、透過的に処理されるはずです：
* アプリケーションがGoogle Cloud Platform（Cloud Run、App Engine、Compute Engineなど）で実行されている場合
* ローカルマシンで実行している場合、Googleの`gcloud` SDKを通じて既に認証されている場合

プロジェクトIDのみを指定してローダーを作成するだけです：

```java
GoogleCloudStorageDocumentLoader gcsLoader = GoogleCloudStorageDocumentLoader.builder()
    .project(System.getenv("GCP_PROJECT_ID"))
    .build();
```

あるいは、サービスアカウントキーをダウンロードし、それを指す環境変数をエクスポートした場合、`Credentials`を指定することも可能です：

```java
GoogleCloudStorageDocumentLoader gcsLoader = GoogleCloudStorageDocumentLoader.builder()
    .project(System.getenv("GCP_PROJECT_ID"))
    .credentials(GoogleCredentials.fromStream(new FileInputStream(System.getenv("GOOGLE_APPLICATION_CREDENTIALS"))))
    .build();
```

[認証情報](https://cloud.google.com/docs/authentication/application-default-credentials)についての詳細はこちらをご覧ください。

公開バケットにアクセスする場合、認証は必要ありません。

## 例

### GCSバケットから単一のファイルをロードする

```java
GoogleCloudStorageDocumentLoader gcsLoader = GoogleCloudStorageDocumentLoader.builder()
    .project(System.getenv("GCP_PROJECT_ID"))
    .build();

Document document = gcsLoader.loadDocument("BUCKET_NAME", "FILE_NAME.txt", new TextDocumentParser());
```

### GCSバケットからすべてのファイルをロードする

```java
GoogleCloudStorageDocumentLoader gcsLoader = GoogleCloudStorageDocumentLoader.builder()
    .project(System.getenv("GCP_PROJECT_ID"))
    .build();

List<Document> documents = gcsLoader.loadDocuments("BUCKET_NAME", new TextDocumentParser());
```

### グロブパターンを使用してGCSバケットからすべてのファイルをロードする

```java
GoogleCloudStorageDocumentLoader gcsLoader = GoogleCloudStorageDocumentLoader.builder()
    .project(System.getenv("GCP_PROJECT_ID"))
    .build();

List<Document> documents = gcsLoader.loadDocuments("BUCKET_NAME", "*.txt", new TextDocumentParser());
```

より多くのコードサンプルについては、統合テストクラスをご覧ください：
- [GoogleCloudStorageDocumentLoaderIT](https://github.com/langchain4j/langchain4j/blob/main/document-loaders/langchain4j-document-loader-google-cloud-storage/src/test/java/dev/langchain4j/data/document/loader/gcs/GoogleCloudStorageDocumentLoaderIT.java)
