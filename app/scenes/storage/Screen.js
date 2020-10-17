import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import useRemoteStorage from "../../lib/useRemoteStorage";
import useGlobalState from "../../lib/useGlobalState";

import Loading from "./Loading";
import Directory from "./Directory";
import Document from "./Document";

export default function StorageScreen() {
  const [path, setPath] = useGlobalState("path");

  console.log(path);

  const [node, refresh] = useRemoteStorage(path);

  console.log(node);

  // useEffect(() => {
  //   navigation.setOptions({
  //     headerTitle: path,
  //   });
  // }, [path]);

  return (
    <View style={styles.container}>
      {(() => {
        if (!node) return null;
        // if (!node) return <Loading />;

        if (path.endsWith("/"))
          return (
            <Directory
              node={node}
              path={path}
              setPath={setPath}
              refresh={refresh}
            />
          );

        return (
          <Document
            node={node}
            path={path}
            setPath={setPath}
            refresh={refresh}
          />
        );

        // return null;
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
