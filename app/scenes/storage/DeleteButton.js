import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button } from "react-native-elements";
import * as DocumentPicker from "expo-document-picker";
import remoteStorage from "../../lib/remoteStorage";

export default function DeleteButton({ path, onDelete }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      icon={{
        name: "remove-circle",
        type: "Ionicons",
        color: "white",
      }}
      title="Delete"
      loading={loading}
      onPress={() => {
        onPress({ setLoading, path, onDelete });
      }}
    />
  );
}

async function onPress({ setLoading, path, onDelete }) {
  try {
    await remoteStorage.delete(path);
  } catch (err) {
    console.error(err);
    return;
  } finally {
    setLoading(false);
  }

  onDelete(path);
}

const styles = StyleSheet.create({});
