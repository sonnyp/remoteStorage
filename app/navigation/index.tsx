import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useContext } from "react";
import { ColorSchemeName } from "react-native";

import StorageScreen from "../scenes/storage/Screen";
import ConnectScreen from "../screens/ConnectScreen";
import { RootStackParamList } from "../types";
import BottomTabNavigator from "./BottomTabNavigator";
import LinkingConfiguration from "./LinkingConfiguration";

import AccountContext from "../AccountContext";

// If you are not familiar with React Navigation, we recommend going through the
// "Fundamentals" guide: https://reactnavigation.org/docs/getting-started
export default function Navigation({ colorScheme }) {
  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}

// A root stack navigator is often used for displaying modals on top of all other content
// Read more here: https://reactnavigation.org/docs/modal
const Stack = createStackNavigator<RootStackParamList>();

function RootNavigator() {
  const [account, setAccount] = useContext(AccountContext);

  console.log(account.connected);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Root"
        component={account.connected ? BottomTabNavigator : ConnectScreen}
      />

      <Stack.Screen
        name="Storage"
        component={StorageScreen}
        options={{ title: "Oops!" }}
      />
    </Stack.Navigator>
  );
}
