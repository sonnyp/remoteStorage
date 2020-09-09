import React, { useContext, useState, useEffect } from "react";
import { StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { ListItem, Button } from "react-native-elements";
import * as DocumentPicker from "expo-document-picker";

import { View } from "../components/Themed";

import AccountContext from "../AccountContext";

import List from "../scenes/storage/List";
import Loading from "../scenes/storage/Loading";
import UploadButton from "../scenes/storage/UploadButton";

import useRemoteStorage from "../lib/useRemoteStorage";

export default function TabOneScreen({ route, navigation }) {
  const [account, setAccount] = useContext(AccountContext);
  const path = route.params?.path || "/";

  const [node, refresh] = useRemoteStorage(path);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: path,
    });
  }, [path]);

  if (!node) return <Loading />;

  return (
    <View style={styles.container}>
      <List node={node} navigation={navigation} />
      <UploadButton path={path} onUpload={refresh} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: "center",
    // justifyContent: "center",
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
