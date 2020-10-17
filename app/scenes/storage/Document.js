import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import remoteStorage from "../../lib/remoteStorage";
import Toolbar from "../../components/Toolbar";
import DeleteButton from "./DeleteButton";

export default function Document({ node, path, setPath, refresh }) {
  const [uri, seturi] = useState("");

  console.log(node, path);

  useEffect(() => {
    remoteStorage.get(path).then(async ([, fo]) => {
      const b = await fo.blob();
      console.log(b);
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
        <img src={uri} />
        {/* <Image
          source={{
            uri,
            // width: 100,
            // height: 100,
          }}
        /> */}
      </View>

      <Toolbar>
        <DeleteButton path={path} onDelete={onDelete} />
      </Toolbar>
    </>
  );
}

async function onDelete() {
  console.log("ok");
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
