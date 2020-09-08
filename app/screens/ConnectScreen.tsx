import React, { useState, useContext } from "react";
import { StackScreenProps } from "@react-navigation/stack";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Alert,
} from "react-native";
import { Input, Button, Divider } from "react-native-elements";
import AsyncStorage from "@react-native-community/async-storage";

import { RootStackParamList } from "../types";

import AccountContext from "../AccountContext";
import { lookup } from "client/dist/WebFinger";
import { buildAuthURL, getRemoteStorageLink } from "client/dist/RemoteStorage";

async function connect({ lookupUrl, resource }) {
  const record = await lookup(`acct:${resource}`, lookupUrl);
  const link = getRemoteStorageLink(record);

  console.log(link);

  await AsyncStorage.setItem("remoteStorage:link", JSON.stringify(link));

  if (Platform.OS === "web") {
  } else {
    Alert.alert("Oops", "Unsupported platform");
    return;
  }

  const authorizationURL = buildAuthURL(link);
  window.location.href = authorizationURL.toString();

  return { link };
}

async function onSubmit({
  resource,
  setLoading,
  setAccount,
  setErrorMessage,
  lookupUrl,
}) {
  if (!resource) {
    setErrorMessage("Please enter your account.");
    return;
  }

  setLoading(true);

  try {
    const { link } = await connect({ lookupUrl, resource });

    setAccount({
      // connected: true,
      link,
    });
  } catch (err) {
    console.log(err);
    setAccount({
      connected: false,
    });
  } finally {
    setLoading(false);
  }
}

const domain = "localhost";
const dev = true;

export default function ConnectScreen({
  navigation,
}: StackScreenProps<RootStackParamList, "Root">) {
  const [resource, setResource] = useState(dev ? `sonny@${domain}` : "");
  const [lookupUrl, setLookupUrl] = useState(
    dev ? `https://${domain}:4646/.well-known/webfinger` : "",
  );
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useContext(AccountContext);
  const [errorMessage, setErrorMessage] = useState("");

  function onChangeResource(text) {
    setResource(text);
    setErrorMessage("");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect your storage.</Text>
      <Input
        value={resource}
        onChangeText={onChangeResource}
        placeholder="user@provider.com"
        errorMessage={errorMessage}
      />

      <Divider style={{ backgroundColor: "red", width: "100%" }} />

      <Input
        value={lookupUrl}
        onChangeText={setLookupUrl}
        placeholder="WebFinger URL"
        errorMessage={errorMessage}
      />

      <Button
        title="Connect"
        loading={loading}
        onPress={() =>
          onSubmit({
            resource,
            setLoading,
            setErrorMessage,
            setAccount,
            lookupUrl,
          })
        }
      />
      {/* <TouchableOpacity
        onPress={() => navigation.replace("Root")}
        style={styles.link}
      >
        <Text style={styles.linkText}>Go to home screen!</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});
