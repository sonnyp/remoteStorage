import React, { useState, useContext } from "react";
import { StackScreenProps } from "@react-navigation/stack";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Input, Button } from "react-native-elements";

import { RootStackParamList } from "../types";

import AccountContext from "../AccountContext";

function onSubmit({ resource, setLoading, setAccount, setErrorMessage }) {
  if (!resource) {
    setErrorMessage("Please enter your account.");
    return;
  }

  setLoading(true);

  try {
    setAccount({
      connected: true,
    });
  } catch (err) {
    setAccount({
      connected: false,
    });
  } finally {
    setLoading(false);
  }
}

export default function ConnectScreen({
  navigation,
}: StackScreenProps<RootStackParamList, "Root">) {
  const [resource, setResource] = useState("");
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

      <Button
        title="Connect"
        loading={loading}
        onPress={() =>
          onSubmit({ resource, setLoading, setErrorMessage, setAccount })
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
