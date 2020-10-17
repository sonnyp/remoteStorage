import React from "react";

import List from "./List";
import UploadButton from "./UploadButton";
import remoteStorage from "../../lib/remoteStorage";

export default function Directory({ node, path, setPath, refresh }) {
  return (
    <>
      <List
        node={node}
        path={path}
        onRefresh={refresh}
        onPress={(item) => setPath(item.path)}
      />
      <UploadButton
        path={path}
        onUpload={(file) => {
          return onUpload({ file, path });
        }}
      />
    </>
  );
}

async function onUpload({ file, path }) {
  const filePath = `${path}${file.name}`;
  return remoteStorage.upload(filePath, file);
}
