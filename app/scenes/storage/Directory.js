import React from "react";

import List from "./List";
import UploadButton from "./UploadButton";
import remoteStorage from "../../lib/remoteStorage";
import Toolbar from "../../components/Toolbar";
import CreateDirectoryButton from "./CreateDirectoryButton";

export default function Directory({ node, path, setPath, refresh }) {
  return (
    <>
      <List
        node={node}
        path={path}
        onRefresh={refresh}
        onPress={(item) => setPath(item.path)}
      />
      <Toolbar>
        <UploadButton
          path={path}
          onUpload={(file) => {
            return onUpload({ file, path });
          }}
        />
        <CreateDirectoryButton
          path={path}
          onCreateDirectory={(name) => {
            return onCreateDirectory({ name, path });
          }}
        />
      </Toolbar>
    </>
  );
}

async function onUpload({ file, path }) {
  const filePath = `${path}${file.name}`;
  return remoteStorage.upload(filePath, file);
}

async function onCreateDirectory({ name, path }) {
  const filePath = `${path}${name}/.keep`;
  return remoteStorage.upload(filePath, new Blob([""], { type: "text/plain" }));
}
