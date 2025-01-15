// App.js
import React, { useEffect, useState, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "./screens/Login";
import DashboardScreen from "./screens/Dashboard";
import UsersPage from "./screens/UsersPage";

import { requestBluetoothPermission } from "./myPermissionRequest";

// const bleManager = new BleManager();

const Stack = createStackNavigator();

requestBluetoothPermission();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [num, setNum] = useState(0);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Hides the header for all screens
        }}
      >
        <Stack.Screen name="login" component={LoginScreen} />
        <Stack.Screen name="users" component={UsersPage} />
        <Stack.Screen name="dash" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
