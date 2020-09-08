import React, { useContext } from "react";
import { StyleSheet } from "react-native";

import EditScreenInfo from "../components/EditScreenInfo";
import { Text, View } from "../components/Themed";

import AccountContext from "../AccountContext";

import RemoteStorage from "client/dist/RemoteStorage";

export default function TabOneScreen() {
  const [account, setAccount] = useContext(AccountContext);
  console.log(account);

  const rs = new RemoteStorage(account.link.href, account.token);

  rs.get("/").then(([node]) => {
    console.log(node);
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <EditScreenInfo path="/screens/TabOneScreen.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
