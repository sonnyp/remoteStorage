import HTTPError from "./HTTPError";

export interface DocumentDescription extends Record<string, string> {
  ETag: string;
  "Content-Type": string;
  "Content-Length": string;
  "Last-Modified": string;
}

export interface FolderDescription {
  "@context": "http://remotestorage.io/spec/folder-description";
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

  public onUnauthorized(err: Error): void {
    throw err;
  }

  private async fetch(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers["Authorization"] = `Bearer ${this.token}`;

    const response = await fetch(this.url + path, {
      cache: "no-store",
      ...options,
    });

    if (response.status === 401) {
      this.onUnauthorized(new HTTPError(response));
      return;
    }

    // if (!response.ok) {
    // throw new HTTPError(response);
    // }
    return response;
  }

  public async *createAsyncIterable(
    path: string,
  ): AsyncIterable<[string, Node]> {
    const response = await this._get(path);
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

  public async _get(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    return this.fetch(path, {
      method: "GET",
      ...options,
    });
  }

  public async upload(path: string, file: Blob): Promise<[Node, Response]> {
    await this.put(path, file);
    return this.head(path);
  }

  public async get(
    path: string,
    ifNoneMatch?: string,
    options: RequestInit = {},
  ): Promise<[Node | null, Response]> {
    const headers = {};
    if (ifNoneMatch) {
      headers["If-None-Match"] = ifNoneMatch;
    }

    const res = await this._get(path, {
      headers,
    });
    const { status } = res;

    if (status === 200) {
      const node = createNode(res.headers);

      console.log(path.endsWith("/"));

      if (path.endsWith("/")) {
        const folder: FolderDescription = await res.json();
        node.items = folder.items;
      }

      return [node, res];
    }

    if (status === 304) {
      return [null, res];
    }

    throw new HTTPError(res);
  }

  public async head(
    path: string,
    options: RequestInit = {},
  ): Promise<[Node, Response]> {
    const res = await this.fetch(path, {
      method: "HEAD",
      ...options,
    });
    if (res.status !== 200) {
      throw new HTTPError(res);
    }
    return [createNode(res.headers), res];
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
    ifMatch?: string,
    options: RequestInit = {},
  ): Promise<[Node, Response]> {
    const headers = {};
    if (ifMatch) {
      headers["If-Match"] = ifMatch;
    }

    const res = await this.fetch(path, {
      method: "PUT",
      body: data,
      headers,
      ...options,
    });
    const { status } = res;

    if (status === 412) {
      return [null, res];
    }

    if ([200, 201].includes(status)) {
      return [
        {
          ...createNode(res.headers),
          size: data.size,
          type: data.type || null,
        },
        res,
      ];
    }

    throw new HTTPError(res);
  }
}

// https://tools.ietf.org/html/draft-dejong-remotestorage-15#section-10
export function getRemoteStorageLink(webfinger: any): Record<string, string> {
  return webfinger.links.find((link: Record<string, string>) => {
    return (
      link.rel === "http://tools.ietf.org/id/draft-dejong-remotestorage" ||
      link.rel === "remotestorage"
    );
  });
}

export function buildAuthURL(
  link: any,
  params: Record<string, string> = {},
): URL {
  const authURL =
    link.properties["http://tools.ietf.org/html/rfc6749#section-4.2"];
  // let version = record.properties["http://remotestorage.io/spec/version"];

  const client_id = params.client_id || document.title;
  const redirect_uri = params.redirect_uri || location.href;
  const scope = params.scope || "*:rw";

  const url = new URL(authURL);
  url.searchParams.append("client_id", client_id);
  url.searchParams.append("redirect_uri", redirect_uri);
  url.searchParams.append("response_type", "token");
  url.searchParams.append("scope", scope);

  return url;
}

export function isDocumentPath(path: string): boolean {
  return !isDirectoryPath(path);
}

export function isDirectoryPath(path: string): boolean {
  return path.endsWith("/");
}

export function getParentPath(path: string): string | null {
  if (path === "/") return null;

  const split = path.split("/");
  return split.slice(0, isDirectoryPath(path) ? -2 : -1).join("/") + "/";
}
