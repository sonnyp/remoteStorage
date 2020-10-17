import React, { useState } from "react";
import { StyleSheet, Modal, Text, View } from "react-native";
import { Input, Button } from "react-native-elements";

export default function CreateDirectoryButton({ onCreateDirectory }) {
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <>
      <CreateDirectoryModal
        visible={visible}
        onDismiss={() => setVisible(false)}
        onSubmit={(value) => {
          setVisible(false);
          onCreateDirectory(value);
        }}
      />
      <Button
        icon={{
          name: "addfolder",
          type: "antdesign",
          color: "white",
        }}
        title="Create directory"
        loading={loading}
        onPress={() => {
          onPress({ setLoading, setVisible, onCreateDirectory });
        }}
      />
    </>
  );
}

function CreateDirectoryModal({ onSubmit, ...props }) {
  const [value, setValue] = useState("");

  return (
    <Modal transparent={true} {...props}>
      <View style={styles.modal}>
        <View style={styles.view}>
          <View style={styles.header}>
            <Button
              icon={{
                name: "close",
                type: "Ionicons",
                color: "blue",
              }}
              type="clear"
              onPress={props.onDismiss}
            />
          </View>
          <View style={styles.body}>
            <Input
              label="Directory name"
              value={value}
              onChangeText={setValue}
            />
            <View style={styles.actions}>
              <Button title="Submit" onPress={() => onSubmit(value)} />
              <Button title="Cancel" onPress={props.onDismiss} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

async function onPress({ setLoading, setVisible, onCreateDirectory }) {
  // let result;
  // try {
  //   result = await DocumentPicker.getDocumentAsync({
  //     // FIXME on web it still encode in base64 for uri
  //     // nogo for big files
  //     copyToCacheDirectory: false,
  //     multiple: false,
  //   });
  //   if (result.type === "cancel") return;
  // } catch (err) {
  //   console.error(err);
  //   setLoading(false);
  //   return;
  // }

  setVisible(true);
  return;

  const { file } = result;

  try {
    await onCreateDirectory(name);
  } catch (err) {
    console.error(err);
    return;
  } finally {
    setLoading(false);
  }
}

const styles = StyleSheet.create({
  modal: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
  },
  view: {
    // width: "80%",
    // height: "80%",
    backgroundColor: "white",
  },
  header: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  actions: {
    flex: 1,
    flexDirection: "row",
  },
});
