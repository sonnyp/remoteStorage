import { createRequestHandler, RemoteStorage } from "./RemoteStorage";
import { IncomingMessage, ServerResponse, createServer } from "http";
import superfetch from "./superfetch";
import { RequestInit, Response } from "node-fetch";

class MockRemoteStorage implements RemoteStorage {
  public async load(): Promise<void> {}
  public async unload(): Promise<void> {}
  public async getFolder(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {}
  public async getDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {}
  public async putDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {}
  public async deleteDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {}
  public async headFolder(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {}
  public async headDocument(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {}
}

async function fetch(
  app: any,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!init.headers) {
    init.headers = {};
  }

  if (!init.headers["Authorization"]) {
    init.headers["Authorization"] = "Bearer foobar";
  }

  return superfetch(app, path, init);
}

async function mockAuthorize(token: string, path: string): Promise<boolean> {
  return true;
}

describe("createRequestHandler", () => {
  test("responds with 401 if Auhtorization header is missing", async () => {
    const res = await superfetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/",
    );
    expect(res.status).toBe(401);
  });

  test("responds with 401 if Auhtorization header is invalid", async () => {
    const res = await superfetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/",
      {
        headers: {
          Authorization: "foo",
        },
      },
    );
    expect(res.status).toBe(401);
  });

  test("sends Access-Control-Allow-Origin response header set to *", async () => {
    const res = await fetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/",
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  test("rejects if an operation throws or rejects", (cb) => {
    const storage = new MockRemoteStorage();
    const error = new Error("foobar");

    storage.deleteDocument = jest.fn().mockRejectedValue(error);

    const requestHandler = createRequestHandler({
      storage,
      authorize: mockAuthorize,
    });

    const app = createServer((req, res) => {
      expect(requestHandler(req, res)).rejects.toBe(error).then(cb);
    });

    fetch(app, "/foo/bar", {
      method: "delete",
    });
  });
});

describe("get folder", () => {
  test("sends Access-Control-Expose-Headers", async () => {
    const res = await fetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/",
      { method: "get" },
    );
    expect(res.headers.get("Access-Control-Expose-Headers")).toBe(
      "Content-Length, ETag",
    );
  });

  test("sends Cache-Control header set to no-cache", async () => {
    const res = await fetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/",
      { method: "get" },
    );
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
  });
});

describe("get file", () => {
  test("sends Access-Control-Expose-Headers", async () => {
    const res = await fetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/foo",
      { method: "get" },
    );
    expect(res.headers.get("Access-Control-Expose-Headers")).toBe(
      "Content-Length, ETag",
    );
  });

  test("sends Cache-Control header set to no-cache", async () => {
    const res = await fetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/",
      { method: "get" },
    );
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
  });
});

describe("put folder", () => {
  test("responds with 405", async () => {
    const res = await fetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/foo/",
      {
        method: "put",
      },
    );
    expect(res.status).toBe(405);
  });
});

describe("put file", () => {
  test("sends Access-Control-Expose-Headers", async () => {
    const res = await fetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/foo",
      { method: "put" },
    );
    expect(res.headers.get("Access-Control-Expose-Headers")).toBe("ETag");
  });
});

describe("delete folder", () => {
  test("responds with 405", async () => {
    const res = await fetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/foo/",
      {
        method: "delete",
      },
    );
    expect(res.status).toBe(405);
  });
});

describe("delete file", () => {
  test("sends Access-Control-Expose-Headers", async () => {
    const res = await fetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/foo",
      { method: "delete" },
    );
    expect(res.headers.get("Access-Control-Expose-Headers")).toBe("ETag");
  });
});

describe("head folder", () => {
  test("sends Access-Control-Expose-Headers", async () => {
    const res = await fetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/",
      { method: "head" },
    );
    expect(res.headers.get("Access-Control-Expose-Headers")).toBe(
      "Content-Length, ETag",
    );
  });
});

describe("head file", () => {
  test("sends Access-Control-Expose-Headers", async () => {
    const res = await fetch(
      createRequestHandler({
        storage: new MockRemoteStorage(),
        authorize: mockAuthorize,
      }),
      "/foo",
      { method: "head" },
    );
    expect(res.headers.get("Access-Control-Expose-Headers")).toBe(
      "Content-Length, ETag",
    );
  });
});

describe("OPTIONS", () => {
  describe("file", () => {
    test("sends Access-Control-Allow-Methods", async () => {
      const req = await fetch(
        createRequestHandler({
          storage: new MockRemoteStorage(),
          authorize: mockAuthorize,
        }),
        "/foo",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Allow-Methods")).toBe(
        "OPTIONS, HEAD, GET, PUT, DELETE",
      );
    });

    test("sends Access-Control-Allow-Headers", async () => {
      const req = await fetch(
        createRequestHandler({
          storage: new MockRemoteStorage(),
          authorize: mockAuthorize,
        }),
        "/foo",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Allow-Headers")).toBe(
        "Authorization, Origin, If-Match, If-None-Match, Content-Length, Content-Type",
      );
    });

    test("sends Access-Control-Max-Age", async () => {
      const req = await fetch(
        createRequestHandler({
          storage: new MockRemoteStorage(),
          authorize: mockAuthorize,
        }),
        "/foo",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Max-Age")).toBe("600");
    });
  });

  describe("folder", () => {
    test("sends Access-Control-Allow-Methods", async () => {
      const req = await fetch(
        createRequestHandler({
          storage: new MockRemoteStorage(),
          authorize: mockAuthorize,
        }),
        "/foo/bar/",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Allow-Methods")).toBe(
        "OPTIONS, HEAD, GET",
      );
    });

    test("sends Access-Control-Allow-Headers", async () => {
      const req = await fetch(
        createRequestHandler({
          storage: new MockRemoteStorage(),
          authorize: mockAuthorize,
        }),
        "/foo/bar/",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Allow-Headers")).toBe(
        "Authorization, Origin, If-Match, If-None-Match",
      );
    });

    test("sends Access-Control-Max-Age", async () => {
      const req = await fetch(
        createRequestHandler({
          storage: new MockRemoteStorage(),
          authorize: mockAuthorize,
        }),
        "/foo/bar/",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Max-Age")).toBe("600");
    });
  });
});
