import React from "react";
import { View, StyleSheet } from "react-native";

export default function Toolbar(props) {
  return <View {...props} style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    // alignItems: "stretch",
    // alignContent: "stretch",
  },
});
