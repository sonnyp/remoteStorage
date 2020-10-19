import React from "react";

import List from "./List";
import UploadButton from "./UploadButton";
import remoteStorage from "../../lib/remoteStorage";
import Toolbar from "../../components/Toolbar";
import CreateDirectoryButton from "./CreateDirectoryButton";
import ParentButton from "./ParentButton";
import DeleteButton from "./DeleteButton";

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
        {path !== "/" && <ParentButton path={path} setPath={setPath} />}
        {/* <DeleteButton
          path={path}
          onDelete={() => onDelete({ path, setPath })}
        /> */}
        <UploadButton
          path={path}
          onUpload={(file) => {
            onUpload({ file, path, refresh });
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

async function onUpload({ file, path, refresh }) {
  const filePath = `${path}${file.name}`;
  await remoteStorage.upload(filePath, file);
  refresh();
}

async function onDelete({ setPath, path }) {
  setPath(getParentPath(path));
}

async function onCreateDirectory({ name, path }) {
  const filePath = `${path}${name}/.keep`;
  return remoteStorage.upload(filePath, new Blob([""], { type: "text/plain" }));
}
