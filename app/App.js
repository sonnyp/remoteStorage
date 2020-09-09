import React, { createContext, useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "react-native-elements";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import Navigation from "./navigation";

import AccountContext from "./AccountContext";
import AsyncStorage from "@react-native-community/async-storage";
import { connect } from "./lib/remoteStorage";

const theme = {
  colors: {
    platform: {
      default: {
        grey: "#FFF",
      },
    },
  },
};

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

export default function App() {
  const [account, setAccount] = useState({});
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load().then(({ token, link }) => {
      setLoading(false);
      setAccount({ token, connected: true, link });
    });
  }, []);

  if (!isLoadingComplete || loading) {
    return null;
  } else {
    return (
      <AccountContext.Provider value={[account, setAccount]}>
        <ThemeProvider theme={theme}>
          <SafeAreaProvider>
            <Navigation colorScheme={colorScheme} />
            <StatusBar />
          </SafeAreaProvider>
        </ThemeProvider>
      </AccountContext.Provider>
    );
  }
}
