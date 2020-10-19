import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View, TextInput } from "react-native";

import remoteStorage from "../../lib/remoteStorage";
import Toolbar from "../../components/Toolbar";
import DeleteButton from "./DeleteButton";
import ParentButton from "./ParentButton";
import { getParentPath } from "../../remoteStorage/RemoteStorage";

export default function Document({ node, path, setPath, refresh }) {
  const [uri, seturi] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    remoteStorage.get(path).then(async ([, fo]) => {
      if (node.type.startsWith("text")) {
        setText(await fo.text());
        return;
      }

      const b = await fo.blob();
      seturi(URL.createObjectURL(b));
    });
  }, []);

  return (
    <>
      {/* <List
        node={node}
        path={path}
        onRefresh={refresh}
        onPress={(item) => setPath(item.path)}
      /> */}

      <View style={styles.container}>
        {node.type.startsWith("image") && <img src={uri} />}
        {node.type.startsWith("video") && <video controls src={uri} />}
        {node.type.startsWith("audio") && <audio controls src={uri} />}
        {node.type.startsWith("text") && (
          <TextInput
            multiline={true}
            style={{ flex: 1, width: "100%" }}
            readonly
            value={text}
          />
        )}
        {/* <Image
          source={{
            uri,
            // width: 100,
            // height: 100,
          }}
        /> */}
      </View>

      <Toolbar>
        <ParentButton path={path} setPath={setPath} />
        <DeleteButton
          path={path}
          onDelete={() => onDelete({ path, setPath })}
        />
      </Toolbar>
    </>
  );
}

async function onDelete({ setPath, path }) {
  setPath(getParentPath(path));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
