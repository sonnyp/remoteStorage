import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button } from "react-native-elements";
import * as DocumentPicker from "expo-document-picker";

import { getParentPath } from "../../remoteStorage/RemoteStorage";

export default function ParentButton({ path, setPath }) {
  console.log(path);

  return (
    <Button
      icon={{
        name: "back",
        type: "ant-design",
        color: "white",
      }}
      // title="Upload"
      // loading={loading}
      onPress={() => {
        setPath(getParentPath(path));
      }}
    />
  );
}

const styles = StyleSheet.create({});
