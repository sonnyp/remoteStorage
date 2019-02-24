export interface DocumentDescription {
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
  path: string;
  size: number;
  type: string;
  version: string;
}

export interface NodeFolder extends Node {
  folder: FolderDescription;
}

export interface NodeDocument extends Node {
  date: Date;
}

function createNode(path: string, headers: Headers): Node {
  const contentLength = headers.get("content-length");
  const contentType = headers.get("content-type");
  const etag = headers.get("etag");

  return {
    path,
    size: contentLength === null ? NaN : +contentLength,
    type: contentType || "",
    version: etag || "",
  };
}

export default class RS {
  public url: string;
  public token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  private async fetch(path: string, options: RequestInit = {}) {
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

  async *createAsyncIterable(
    path: string,
  ): AsyncIterable<NodeFolder | NodeDocument> {
    const response = await this.get(path);
    const folder: FolderDescription = await response.json();
    const node: NodeFolder = {
      ...createNode(path, response.headers),
      folder,
    };

    yield node;

    const { items } = folder;

    for (const [name, item] of Object.entries(items)) {
      if (name.endsWith("/")) {
        yield* this.createAsyncIterable(path + name);
      } else {
        const leafNode: NodeDocument = {
          ...createNode(
            path + name,
            // FIXME why
            // @ts-ignore
            new Headers(item as Record<string, string>),
          ),
          date: new Date(item["Last-Modified"]),
        };

        yield leafNode;
      }
    }
  }

  async *[Symbol.asyncIterator]() {
    yield* this.createAsyncIterable("/");
  }

  public async get(path: string, options: RequestInit = {}) {
    return this.fetch(path, {
      method: "GET",
      ...options,
    });
  }
  public async delete(path: string, options: RequestInit = {}) {
    return this.fetch(path, {
      method: "DELETE",
      ...options,
    });
  }

  public async put(path: string, data: BodyInit, options: RequestInit = {}) {
    return this.fetch(path, {
      method: "PUT",
      body: data,
      ...options,
    });
  }

  // https://tools.ietf.org/html/draft-dejong-remotestorage-12#section-10
  public static getRemoteStorageRecord(webfinger: any) {
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

    const client_id = params.client_id || document.title;
    const redirect_uri = params.redirect_uri || location.href;

    const url = new URL(authURL);
    url.searchParams.append("client_id", client_id);
    url.searchParams.append("redirect_uri", redirect_uri);
    url.searchParams.append("response_type", "token");
    url.searchParams.append("scope", "*:rw");

    return url;
  }
}
