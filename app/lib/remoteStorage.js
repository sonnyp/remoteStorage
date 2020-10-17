import RemoteStorage from "../remoteStorage/RemoteStorage";

const remoteStorage = new RemoteStorage();

export function connect(url, token) {
  remoteStorage.url = url;
  remoteStorage.token = token;
}

export default remoteStorage;
