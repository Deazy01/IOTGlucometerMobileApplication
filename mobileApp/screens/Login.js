// LoginScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image } from "react-native";
import { Button } from "react-native-paper";
import styled from "styled-components/native";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (email && password) {
      await AsyncStorage.setItem("userToken", "abc123");
      navigation.navigate("users");
    } else {
      alert("Please enter valid credentials");
    }
  };

  return (
    <Container>
      <LottieView
        source={require("../assets/login-animation.json")}
        autoPlay
        loop
        style={{ width: 200, height: 200 }}
      />
      <Title>IoT Blood Sugar Monitor</Title>

      <Input placeholder="Email" value={email} onChangeText={setEmail} />
      <Input
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <StyledButton mode="contained" onPress={handleLogin}>
        Login
      </StyledButton>
      <View
        style={{
          marginTop: "15%",
          display: "flex",
          position: "absolute",
          justifyContent: "center",
          alignItems: "center",
          bottom: "10%",
          padding: "4%",
        }}
      >
        {/* <StyledText> Designed by Funke Kuyebi</StyledText>
        <StyledText>NOU232080644</StyledText>
        <StyledText>Supervisor : Dr Olalere Marufu</StyledText>
        <StyledText>
          Faculty of Computer Science, National Open University of Nigeria
        </StyledText> */}
        <StyledText>Supervisor : Dr Olalere Marufu</StyledText>

        <StyledText>
          Copyright © 2024 Funke Kuyebi. All rights reserved
        </StyledText>
      </View>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f5f5f5;
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
`;

const Input = styled.TextInput`
  width: 100%;
  height: 50px;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 20px;
  background-color: #fff;
`;

const StyledButton = styled(Button)`
  width: 100%;
  padding: 10px;
  border-radius: 10px;
`;

const StyledText = styled.Text`
  font-size: 10px;
  margin-bottom: 2%;
`;

export default LoginScreen;
