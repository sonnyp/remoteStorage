import RemoteStorage from "@remotestorage/client/dist/RemoteStorage";

const remoteStorage = new RemoteStorage();

export function connect(url, token) {
  remoteStorage.url = url;
  remoteStorage.token = token;
}

export default remoteStorage;
