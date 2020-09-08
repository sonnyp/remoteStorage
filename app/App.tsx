import React, { createContext, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import Navigation from "./navigation";

import AccountContext from "./AccountContext";
import AsyncStorage from "@react-native-community/async-storage";

export default function App() {
  const [account, setAccount] = useState({});
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);

  const url = new URL(window.location.href);
  url.search = url.hash.substr(1);
  const token = url.searchParams.get("access_token");
  if (token) {
    history.replaceState({}, "", url.pathname);
    AsyncStorage.setItem("remoteStorage:token", token);
    AsyncStorage.getItem("remoteStorage:link").then((value) => {
      console.log(value);
      const link = JSON.parse(value);
      console.log(link);
      setAccount({ token, connected: true, link });
      setLoading(false);
    });
  } else if (loading) {
    setLoading(false);
  }

  if (!isLoadingComplete || loading) {
    return null;
  } else {
    return (
      <AccountContext.Provider value={[account, setAccount]}>
        <SafeAreaProvider>
          <Navigation colorScheme={colorScheme} />
          <StatusBar />
        </SafeAreaProvider>
      </AccountContext.Provider>
    );
  }
}
