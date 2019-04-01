import { createRequestHandler, RemoteStorage } from "./RemoteStorage";
import { IncomingMessage, ServerResponse, createServer } from "http";
import fetch from "./superfetch";

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

describe("createRequestHandler", () => {
  test("sends Access-Control-Allow-Origin response header set to *", async () => {
    const res = await fetch(createRequestHandler(new MockRemoteStorage()), "/");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  test("throws and responds with 500 if an operation fails", async () => {
    const storage = new MockRemoteStorage();
    const error = new Error("foobar");

    storage.deleteDocument = jest.fn().mockRejectedValue(error);

    const requestHandler = createRequestHandler(storage);

    const app = createServer(async (req, res) => {
      try {
        await requestHandler(req, res);
      } catch (err) {
        expect(err).toBe(error);
      }
    });

    expect(
      (await fetch(app, "/foo/bar", {
        method: "delete",
      })).status,
    ).toBe(500);
  });
});

describe("get folder", () => {
  test("sends Access-Control-Expose-Headers", async () => {
    const res = await fetch(
      createRequestHandler(new MockRemoteStorage()),
      "/",
      { method: "get" },
    );
    expect(res.headers.get("Access-Control-Expose-Headers")).toBe(
      "Content-Length, ETag",
    );
  });

  test("sends Cache-Control header set to no-cache", async () => {
    const res = await fetch(
      createRequestHandler(new MockRemoteStorage()),
      "/",
      { method: "get" },
    );
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
  });
});

describe("get file", () => {
  test("sends Access-Control-Expose-Headers", async () => {
    const res = await fetch(
      createRequestHandler(new MockRemoteStorage()),
      "/foo",
      { method: "get" },
    );
    expect(res.headers.get("Access-Control-Expose-Headers")).toBe(
      "Content-Length, ETag",
    );
  });

  test("sends Cache-Control header set to no-cache", async () => {
    const res = await fetch(
      createRequestHandler(new MockRemoteStorage()),
      "/",
      { method: "get" },
    );
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
  });
});

describe("put folder", () => {
  test("responds with 405", async () => {
    const res = await fetch(
      createRequestHandler(new MockRemoteStorage()),
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
      createRequestHandler(new MockRemoteStorage()),
      "/foo",
      { method: "put" },
    );
    expect(res.headers.get("Access-Control-Expose-Headers")).toBe("ETag");
  });
});

describe("delete folder", () => {
  test("responds with 405", async () => {
    const res = await fetch(
      createRequestHandler(new MockRemoteStorage()),
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
      createRequestHandler(new MockRemoteStorage()),
      "/foo",
      { method: "delete" },
    );
    expect(res.headers.get("Access-Control-Expose-Headers")).toBe("ETag");
  });
});

describe("head folder", () => {
  test("sends Access-Control-Expose-Headers", async () => {
    const res = await fetch(
      createRequestHandler(new MockRemoteStorage()),
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
      createRequestHandler(new MockRemoteStorage()),
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
        createRequestHandler(new MockRemoteStorage()),
        "/foo",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Allow-Methods")).toBe(
        "OPTIONS, HEAD, GET, PUT, DELETE",
      );
    });

    test("sends Access-Control-Allow-Headers", async () => {
      const req = await fetch(
        createRequestHandler(new MockRemoteStorage()),
        "/foo",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Allow-Headers")).toBe(
        "Authorization, Origin, If-Match, If-None-Match, Content-Length, Content-Type",
      );
    });

    test("sends Access-Control-Max-Age", async () => {
      const req = await fetch(
        createRequestHandler(new MockRemoteStorage()),
        "/foo",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Max-Age")).toBe("600");
    });
  });

  describe("folder", () => {
    test("sends Access-Control-Allow-Methods", async () => {
      const req = await fetch(
        createRequestHandler(new MockRemoteStorage()),
        "/foo/bar/",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Allow-Methods")).toBe(
        "OPTIONS, HEAD, GET",
      );
    });

    test("sends Access-Control-Allow-Headers", async () => {
      const req = await fetch(
        createRequestHandler(new MockRemoteStorage()),
        "/foo/bar/",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Allow-Headers")).toBe(
        "Authorization, Origin, If-Match, If-None-Match",
      );
    });

    test("sends Access-Control-Max-Age", async () => {
      const req = await fetch(
        createRequestHandler(new MockRemoteStorage()),
        "/foo/bar/",
        { method: "OPTIONS" },
      );
      expect(req.headers.get("Access-Control-Max-Age")).toBe("600");
    });
  });
});
