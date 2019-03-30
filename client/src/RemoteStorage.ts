export interface DocumentDescription extends Record<string, string> {
  ETag: string;
  "Content-Type": string;
  "Content-Length": string;
  "Last-Modified": string;
}

export interface FolderDescription {
  "@context": "foobar";
  items: { string: DocumentDescription };
}

export interface Node {
  size?: number;
  type?: string;
  version?: string;
  date?: Date;
  items?: { string: DocumentDescription };
}

function createNode(headers: Headers): Node {
  const node: Node = {};

  const contentLength = headers.get("content-length");
  if (contentLength !== null) {
    node.size = +contentLength;
  }

  const contentType = headers.get("content-type");
  if (contentType !== null) {
    node.type = contentType;
  }

  const etag = headers.get("etag");
  if (etag !== null) {
    node.version = etag;
  }

  const lastModified = headers.get("last-modified");
  if (lastModified !== null) {
    node.date = new Date(lastModified);
  }

  return node;
}

export default class RS implements AsyncIterable<[string, Node]> {
  public url: string;
  public token: string;

  public constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  private async fetch(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    if (!options.headers) {
      options.headers = {};
    }
    // @ts-ignore
    options.headers["Authorization"] = `Bearer ${this.token}`;

    const response = await fetch(this.url + path, options);
    if (!response.ok) {
      const error = Error(response.statusText);
      // @ts-ignore Property 'response' does not exist on type 'Error'.
      error.response = response.status;
      // @ts-ignore Property 'status' does not exist on type 'Error'.
      error.status = response.status;
      throw error;
    }
    return response;
  }

  public async *createAsyncIterable(
    path: string,
  ): AsyncIterable<[string, Node]> {
    const response = await this.get(path);
    const folder: FolderDescription = await response.json();
    const node = {
      ...createNode(response.headers),
      items: folder.items,
    };

    yield [path, node];

    const { items } = folder;

    for (const [name, item] of Object.entries(items)) {
      if (name.endsWith("/")) {
        yield* this.createAsyncIterable(path + name);
      } else {
        const leafNode: Node = {
          ...createNode(new Headers(item)),
        };

        yield [path + name, leafNode];
      }
    }
  }

  public async *[Symbol.asyncIterator](): AsyncIterator<[string, Node]> {
    yield* this.createAsyncIterable("/");
  }

  public async get(path: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(path, {
      method: "GET",
      ...options,
    });
  }

  public async head(path: string, options: RequestInit = {}): Promise<Node> {
    const res = await this.fetch(path, {
      method: "HEAD",
      ...options,
    });
    return createNode(res.headers);
  }

  public async delete(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    return this.fetch(path, {
      method: "DELETE",
      ...options,
    });
  }

  public async put(
    path: string,
    data: Blob,
    options: RequestInit = {},
  ): Promise<Node> {
    const res = await this.fetch(path, {
      method: "PUT",
      body: data,
      ...options,
    });

    return {
      ...createNode(res.headers),
      size: data.size,
      type: data.type || null,
    };
  }

  // https://tools.ietf.org/html/draft-dejong-remotestorage-12#section-10
  public static getRemoteStorageRecord(webfinger: any): Record<string, string> {
    return webfinger.links.find((link: Record<string, string>) => {
      return (
        link.rel === "http://tools.ietf.org/id/draft-dejong-remotestorage" ||
        link.rel === "remotestorage"
      );
    });
  }

  public static buildAuthURL(
    record: any,
    params: Record<string, string> = {},
  ): URL {
    let authURL =
      record.properties["http://tools.ietf.org/html/rfc6749#section-4.2"];
    // let version = record.properties["http://remotestorage.io/spec/version"];

    const clientId = params.client_id || document.title;
    const redirectUri = params.redirect_uri || location.href;

    const url = new URL(authURL);
    url.searchParams.append("client_id", clientId);
    url.searchParams.append("redirect_uri", redirectUri);
    url.searchParams.append("response_type", "token");
    url.searchParams.append("scope", "*:rw");

    return url;
  }
}
