import React, { useState } from "react";
import { StyleSheet, FlatList, View } from "react-native";

import Item from "./Item";

export default function List({ node, path, onPress, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  function renderItem({ item }) {
    return <Item item={item} onPress={onPress} />;
  }

  async function onRefresh() {
    setRefreshing(true);

    try {
      await onRefresh();
    } catch (err) {
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      <FlatList
        style={styles.container}
        refreshing={refreshing}
        onRefresh={onRefresh}
        keyExtractor={({ path }) => path}
        renderItem={renderItem}
        data={node.items}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
