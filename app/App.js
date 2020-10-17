import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-community/async-storage";
import { ThemeProvider, Header } from "react-native-elements";
import { patchFlatListProps } from "react-native-web-refresh-control";

import useGlobalState from "./lib/useGlobalState";

import ConnectScreen from "./scenes/connect/Screen";
import StorageScreen from "./scenes/storage/Screen";
import { connect } from "./lib/remoteStorage";

// FIXME: remove when issue solved
// workaround https://github.com/necolas/react-native-web/issues/1027
patchFlatListProps();

// FIXME: remove with react-native-elements@3
// workaround https://github.com/react-native-elements/react-native-elements/issues/2541
const theme = {
  colors: {
    platform: {
      default: {
        grey: "#FFF",
      },
    },
  },
};

export default function App() {
  const [status, setStatus] = useGlobalState("status");
  const [path] = useGlobalState("path");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load().then(() => {
      setLoading(false);
      setStatus("connected");
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <View style={styles.container}>
        <Header centerComponent={{ text: path, style: { color: "#fff" } }} />
        {(() => {
          if (loading) return null;

          if (status === "connected") {
            return <StorageScreen />;
          } else {
            return <ConnectScreen />;
          }
        })()}
        <StatusBar style="auto" />
      </View>
    </ThemeProvider>
  );
}

async function gotToken(token) {
  const value = await AsyncStorage.getItem("remoteStorage:link");
  const link = JSON.parse(value);
  console.log(link);
  connect(link.href, token);
  return { token, link };
}

async function load() {
  const url = new URL(window.location.href);
  url.search = url.hash.substr(1);
  const callback_token = url.searchParams.get("access_token");
  if (callback_token) {
    history.replaceState({}, "", url.pathname);
    AsyncStorage.setItem("remoteStorage:token", callback_token);
    return gotToken(callback_token);
  }

  const token = await AsyncStorage.getItem("remoteStorage:token");
  if (token) return gotToken(token);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: Dimensions.get("window").height,
  },
});
