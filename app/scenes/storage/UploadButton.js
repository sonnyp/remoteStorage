import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button } from "react-native-elements";
import * as DocumentPicker from "expo-document-picker";

export default function UploadButton({ onUpload }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      icon={{
        name: "add-circle",
        type: "Ionicons",
        color: "white",
      }}
      title="Upload"
      loading={loading}
      onPress={() => {
        onPress({ setLoading, onUpload });
      }}
    />
  );
}

async function onPress({ setLoading, onUpload }) {
  let result;
  try {
    result = await DocumentPicker.getDocumentAsync({
      // FIXME on web it still encode in base64 for uri
      // nogo for big files
      copyToCacheDirectory: false,
      multiple: false,
    });
    if (result.type === "cancel") return;
  } catch (err) {
    console.error(err);
    setLoading(false);
    return;
  }

  const { file } = result;

  try {
    await onUpload(file);
  } catch (err) {
    console.error(err);
    return;
  } finally {
    setLoading(false);
  }
}

const styles = StyleSheet.create({});
