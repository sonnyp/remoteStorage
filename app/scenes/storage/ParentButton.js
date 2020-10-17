import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button } from "react-native-elements";
import * as DocumentPicker from "expo-document-picker";

export default function ParentButton({ path, setPath }) {
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
        let p = path.split("/");
        p.pop();
        p.pop();
        setPath(p.join("/") + "/");
      }}
    />
  );
}

const styles = StyleSheet.create({});
