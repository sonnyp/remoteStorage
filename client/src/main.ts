import RemoteStorage from "./RemoteStorage.js";
import { AsyncStorage } from "./AsyncStorage.js";
import { lookup } from "./WebFinger.js";

// import {
//   createStringStreamFromBlob,
//   createAsyncIteratorFromStream,
// } from "./stream.js";

// const token = "5ad04ac40a6a091ca4bafa8019deae78";

// dev
// const resource = "acct:sonny@localhost";
// const uri = "http://localhost:8000/.well-known/webfinger";

// prod
const resource = "acct:sonny@5apps.com";
const uri = undefined;

async function main() {
  const url = new URL(window.location.href);

  // Use url searchParams to parse hash
  url.search = url.hash.substr(1);
  const token = url.searchParams.get("access_token");

  if (token) {
    localStorage.setItem("token", token);
    // Remove hash from current url
    history.replaceState({}, "", url.pathname);
    await connected(token);
  } else {
    const token = localStorage.getItem("token");
    console.log("storage", token);
    if (token) {
      await connected(token);
    } else {
      await connect();
    }
  }
}

// main();

async function connect() {
  const webfinger = await lookup(resource, undefined, uri);
  const record = RemoteStorage.getRemoteStorageRecord(webfinger);
  const url = RemoteStorage.buildAuthURL(record);
  window.location.href = url.toString();
}

async function connected(token: string) {
  const webfinger = await lookup(resource, undefined, uri);
  const record = RemoteStorage.getRemoteStorageRecord(webfinger);
  const rs = new RemoteStorage(record.href, token);
  console.log(rs, token);

  // const input = document.querySelector("input");
  // input.addEventListener("change", async () => {
  //   const file = input.files[0];

  //   const stream = createStringStreamFromBlob(file);

  //   for await (const chunk of createAsyncIteratorFromStream(stream)) {
  //     console.log(chunk);
  //   }

  //   // await rs.put(`/public/${file.name}`, file);

  //   // console.log(await rs.get('/public/big.txt'))
  //   // console.log(stream)

  //   // const reader = stream.getReader()

  //   // console.log(await reader.read())
  // });

  for await (const node of rs) {
    console.log(node);
  }
}

const rs = new RemoteStorage("http://localhost:9090", "foobar");

(async () => {
  // console.log(await rs.get("/hello/"));
})().catch(console.error);

const listButton = document.querySelector("button#list");
if (listButton) {
  listButton.addEventListener("click", async () => {
    for await (const [path, node] of rs) {
      console.log(path, node);
    }
  });
}

const syncButton = document.querySelector("button#sync");
if (syncButton) {
  syncButton.addEventListener("click", async () => {
    sync();
  });
}

async function sync() {
  const asyncStorage = new AsyncStorage("remoteStorage.js");
  for await (const [path, node] of rs) {
    console.log(path, node);
    // const {path, ...node} =

    await asyncStorage.set(path, node);
  }
}

const form = document.querySelector("form");
if (form) {
  form.addEventListener("submit", async evt => {
    evt.preventDefault();

    const file = form.querySelector("input[type=file]") as HTMLInputElement;
    if (!file.files) return;
    const blob = file.files[0];
    if (!blob) return;

    const location = form.querySelector("input[type=text]") as HTMLInputElement;

    console.log(await rs.put(`${location.value}${blob.name}`, blob));
    const node = await rs.head(`${location.value}${blob.name}`);
    console.log(node);
  });
}

// async function main(): Promise<void> {
//   const webfinger = await lookup("acct:sonny@5apps.com");
//   const record = RemoteStorage.getRemoteStorageRecord(webfinger);

//   //   if (!token) {
//   //     token = await authorize(record, prompt);
//   //   }

//   const rs = new RemoteStorage(record.href, token);

//   function getHeaders(response: Response, headers: Array<string>) {
//     return headers.reduce((accumulator: any, header) => {
//       const value = response.headers.get(header);
//       if (value !== null) {
//         accumulator[header] = value;
//       }
//       return accumulator;
//     }, {});
//   }

//   const map = {} as Record<string, any>;
//   async function sync(prefix: string, name: string = "") {
//     const path = prefix + name;

//     const response = await rs.get(path);
//     const value = getHeaders(response, [
//       "Content-length",
//       "Content-Type",
//       "ETag",
//       "Last-Modified",
//     ]);

//     const isFolder = path.endsWith("/");

//     if (isFolder) {
//       value.content = await response.json();
//     }
//     //  else {
//     //   value.content = await response.blob();
//     // }
//     map[path] = value;

//     await asyncStorage.setItem(path, value);

//     if (!isFolder) return;

//     const { content } = value;
//     const { items } = content;

//     for (const item of Object.keys(items)) {
//       await sync(path, item);
//     }
//   }

//   div.textContent = "building index...";
//   let i = 0;

//   for await (const tuple of rs) {
//     i++;
//     console.log(tuple);
//   }

//   div.textContent = "0/" + i;

//   // const file = await asyncStorage.getItem(
//   //   "/public/shares/190217-2116-Theme.zip"
//   // );
//   // console.log(file);

//   // const folder = await asyncStorage.getItem("/public/shares/");
//   // console.log(folder);

//   //   // const drinks = await fetch("/myfavoritedrinks/");

//   //   // Object.keys(drinks.content.items).forEach(async drink => {
//   //   //   const value = await fetch("/myfavoritedrinks/" + drink);
//   //   //   await asyncStorage.setItem("/myfavoritedrinks/" + drink, value);
//   //   // });

//   //   return;

//   //   // for (const item of Object.keys(body.items)) {
//   //   //   console.log(await rs.fetch(`/myfavoritedrinks/${item}`));
//   //   // }

//   //   await asyncStorage.clear();
//   //   await asyncStorage.setItem("foo", "bar");
//   //   console.log(await asyncStorage.getItem("foo"));
//   //   await asyncStorage.removeItem("foo");
//   //   console.log(await asyncStorage.getItem("foo"));
// }
