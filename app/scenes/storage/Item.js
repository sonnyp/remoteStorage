import React from "react";
import { ListItem } from "react-native-elements";

export default function Item({ item, onPress }) {
  return (
    <ListItem topDivider bottomDivider onPress={() => onPress(item)}>
      <ListItem.Content>
        <ListItem.Title>{item.name}</ListItem.Title>
        {/* <ListItem.Subtitle>{item.ETag}</ListItem.Subtitle> */}
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
}
