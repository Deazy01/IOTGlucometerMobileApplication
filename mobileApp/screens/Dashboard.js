import React, { useState, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Button } from "react-native-paper";
import styled from "styled-components/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LineChart } from "react-native-chart-kit";

import { BleManager } from "react-native-ble-plx";
import { atob } from "react-native-quick-base64";

import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "./firbaseData";

const screenWidth = Dimensions.get("window").width;

// Function to generate random health data
const generateData = (rVal, spo2, pulse) => ({
  bloodSugar: rVal,
  oxygenLevel: spo2,
  pulseRate: pulse,
});

const ProgressBar = ({ progress }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <ProgressBarContainer>
      <Animated.View style={[styles.progressBar, animatedStyle]} />
    </ProgressBarContainer>
  );
};

let bleManager = null;
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const HEART_RATE_CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

const TARGET_DEVICE_ID = "C0:5D:89:B1:C8:76";

// console.log("____ dash runing  again _________ ");

const DashboardScreen = ({ route }) => {
  const [data, setData] = useState(generateData(0, 0, 0));
  const [history, setHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const navigation = useNavigation();
  const fadeAnim = useSharedValue(0);
  const bloodSugarProgress = useSharedValue(0);
  const oxygenLevelProgress = useSharedValue(0);
  const pulseRateProgress = useSharedValue(0);
  const { user } = route.params;

  const [deviceID, setDeviceID] = useState(null);
  const [stepCount, setStepCount] = useState(0);
  const [stepDataChar, setStepDataChar] = useState(null); // Not Used
  const [connectionStatus, setConnectionStatus] = useState("Searching...");
  const [pulse, setPulse] = useState(null);
  const [spO2, setSpO2] = useState(null);
  const [rValue, setRvalue] = useState(null);
  const [device, setDevice] = useState(null);
  const [latestVital, setLatestVital] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  // const [bleManager, setBleManager] = useState(null);

  const deviceRef = useRef(null);

  // useEffect(()=>{
  //   if (isBusy) return

  // },[isBusy])

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem("userToken");
      // setIsLoggedIn(!!token);
    };

    const fetchData = async () => {
      const userId = "userId1"; // Replace with the actual user ID

      console.log(user.email);
      const vitalsRef = collection(db, "users", `${user.email}`, "vitals");

      const q = query(vitalsRef, orderBy("timestamp", "desc"), limit(1));

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const vitalData = querySnapshot.docs[0].data();

        // console.log(vitalData);

        setLatestVital(vitalData);
      }
    };

    fetchData();

    checkLoginStatus();
  }, []);

  const searchAndConnectToDevice = () => {
    // const alreadyConnected = checkIfConnected();

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
        setConnectionStatus("Error searching for devices");
        return;
      }
      if (device.name === "IoT Glucometer") {
        bleManager.stopDeviceScan();
        setConnectionStatus("Connecting...");

        setDevice(device);

        connectToDevice(device);
      }
    });
  };

  useEffect(() => {
    bleManager = new BleManager();
    searchAndConnectToDevice();
    console.log("scanning and connecting to device");
  }, []);

  const connectToDevice = (device) => {
    return device
      .connect()
      .then((device) => {
        setDeviceID(device.id);
        setConnectionStatus("Connected");
        deviceRef.current = device;
        return device.discoverAllServicesAndCharacteristics();
      })
      .then((device) => {
        return device.services();
      })
      .then((services) => {
        let service = services.find((service) => service.uuid === SERVICE_UUID);
        return service.characteristics();
      })
      .then((characteristics) => {
        let stepDataCharacteristic = characteristics.find(
          (char) => char.uuid === HEART_RATE_CHARACTERISTIC_UUID
        );
        setStepDataChar(stepDataCharacteristic);
        stepDataCharacteristic.monitor((error, char) => {
          if (error) {
            console.log(error);
            return;
          }
          const rawStepData = atob(char.value);
          console.log("Received step data:", rawStepData);

          const [bpm, spo2, rValue] = rawStepData.split(",").map(Number);

          setStepCount(rawStepData);

          setPulse(bpm);
          setSpO2(spo2);
          setRvalue(rValue);
        });
      })
      .catch((error) => {
        console.log(error);
        setConnectionStatus("Error in Connection");
      });
  };

  useEffect(() => {
    const subscription = bleManager.onDeviceDisconnected(
      deviceID,
      (error, device) => {
        if (error) {
          console.log("Disconnected with error:", error);
        }
        setConnectionStatus("Disconnected");
        console.log("Disconnected device");
        setStepCount(0); // Reset the step count
        if (deviceRef.current) {
          setConnectionStatus("Reconnecting...");
          connectToDevice(deviceRef.current)
            .then(() => setConnectionStatus("Connected"))
            .catch((error) => {
              console.log("Reconnection failed: ", error);
              setConnectionStatus("Reconnection failed");
            });
        }
      }
    );
    return () => subscription.remove();
  }, [deviceID]);

  // Fetch the latest data every 5 seconds
  useEffect(() => {
    fadeAnim.value = withTiming(1, {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
    });

    const interval = setInterval(() => {
      const newData = generateData(rValue, spO2, pulse);
      setData(newData);
      setHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, newData];
        return updatedHistory.length > 10
          ? updatedHistory.slice(1)
          : updatedHistory;
      });

      bloodSugarProgress.value = withTiming(
        latestVital === null ? 0 : Number(latestVital.rValue) / 100,
        {
          duration: 1000,
        }
      );
      oxygenLevelProgress.value = withTiming(
        latestVital === null ? 0 : Number(latestVital.sp02) / 100,
        {
          duration: 1000,
        }
      );
      pulseRateProgress.value = withTiming(
        latestVital === null ? 0 : Number(latestVital.bpm) / 100,
        {
          duration: 1000,
        }
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    navigation.navigate("login");
  };

  const pushToCloud = () => {
    const timestamp = new Date().toISOString();

    console.log(timestamp);

    const collectionRef = collection(db, "users", `${user.email}`, "vitals");

    console.log("trying to push..");

    setIsBusy(true);

    try {
      addDoc(collectionRef, {
        bpm: pulse,
        spo2: spO2,
        rValue: rValue,
        timestamp: timestamp,
      }).then(() => {
        console.log("sucessful");
        setIsBusy(false);
      });
      console.log("done");
    } catch (err) {
      console.log("Failed to push to cloud: ");
    }
  };

  const handleBackToUsers = () => {
    // bleManager.cancelDeviceConnection(deviceID);
    bleManager.destroy();
    navigation.navigate("users");
  };

  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <UserProfile>
          <ActivityIndicator size="small" color="#0000ff" animating={isBusy} />

          <Icon name="account" size={100} color="#6200EE" />
          <WelcomeText>{user.name}'s Portal</WelcomeText>
          <Text>{user.email}</Text>
        </UserProfile>

        <LottieView
          source={require("../assets/dashboard-animation.json")}
          autoPlay
          loop
          style={styles.animation}
        />

        {/* Device Connection Status */}
        <ConnectionStatus>
          <Icon
            name={
              connectionStatus === "Connected" ? "bluetooth" : "bluetooth-off"
            }
            size={20}
            color={connectionStatus === "Connected" ? "#4CAF50" : "#F44336"}
          />
          <ConnectionStatusText>{connectionStatus}</ConnectionStatusText>
        </ConnectionStatus>

        {/* Health Metrics */}

        <HealthMetricContainer>
          <IconRow>
            <Icon name="air-filter" size={30} color="#6200EE" />
            <HealthMetricLabel>Oxygen Level</HealthMetricLabel>
          </IconRow>
          <HealthMetricValue>{spO2} %</HealthMetricValue>
          <ProgressBar progress={oxygenLevelProgress} />
        </HealthMetricContainer>

        <HealthMetricContainer>
          <IconRow>
            <Icon name="heart" size={30} color="#6200EE" />
            <HealthMetricLabel>Pulse Rate</HealthMetricLabel>
          </IconRow>
          <HealthMetricValue>{pulse} bpm</HealthMetricValue>
          <ProgressBar progress={pulseRateProgress} />
        </HealthMetricContainer>

        <HealthMetricContainer>
          <IconRow>
            <Icon name="water" size={35} color="#FF5252" />
            <HealthMetricLabel>R value</HealthMetricLabel>
          </IconRow>
          <HealthMetricValue>{rValue} </HealthMetricValue>
          <ProgressBar progress={bloodSugarProgress} />
        </HealthMetricContainer>

        {/* Buttons Section */}
        <ButtonContainer>
          {/* <StyledButton
            icon={
              connectionStatus === "connected"
                ? "bluetooth-connect"
                : "connection"
            }
            mode="contained"
            onPress={handleConnectToDevice}
          >
            {isConnected ? "Con" : "Dis"}
          </StyledButton> */}

          <StyledButton
            icon="cloud"
            mode="outlined"
            compact={true}
            onPress={pushToCloud}
            disabled={isBusy ? true : false}
          >
            Upload
          </StyledButton>

          <StyledButton
            icon="account-arrow-left"
            mode="outlined"
            compact={true}
            onPress={handleBackToUsers}
          >
            Back
          </StyledButton>
        </ButtonContainer>

        <RecentStatsDisplay>
          <RecordText>
            Last Record:
            {latestVital === null
              ? ""
              : " " + new Date(latestVital.timestamp).toUTCString()}
          </RecordText>
          {latestVital === null ? (
            <StatText>No recent data</StatText>
          ) : (
            <View>
              <StatText>BPM : {latestVital.bpm}</StatText>
              <StatText>SpO₂ : {latestVital.spo2}%</StatText>
            </View>
          )}
        </RecentStatsDisplay>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#a366fa80", // Example background color
  },
  animation: {
    height: 50,
    width: 50,
    marginBottom: 20,
    position: "absolute",
    right: "2%",
    top: "3%",
  },
});

const Container = styled.View`
  flex: 1;
  background-color: #f5f5f5;
`;

const UserProfile = styled.View`
  align-items: center;
  margin-bottom: 20px;
`;

const Avatar = styled.Image`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  margin-bottom: 10px;
`;

const WelcomeText = styled.Text`
  font-size: 15px;
  font-weight: bold;
  color: #333;
`;

const HealthMetricContainer = styled.View`
  margin-bottom: 20px;
  padding: 10px;
  width: ${screenWidth * 0.9}px;
  background-color: #fff;
  border-radius: 10px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 2;
`;

const IconRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const HealthMetricLabel = styled.Text`
  font-size: 18px;

  margin-left: 10px;
  color: #333;
`;

const HealthMetricValue = styled.Text`
  font-size: 22px;

  color: #333;
  margin-top: 5px;
`;

const ProgressBarContainer = styled.View`
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 5px;
`;

const ButtonContainer = styled.View`
  margin-top: 20px;
  flex-direction: row;
  justify-content: space-between;
  width: ${screenWidth * 0.9}px;
`;

const StyledButton = styled(Button)`
  flex: 1;
  margin: 5px;
`;

const ConnectionStatus = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
`;

const ConnectionStatusText = styled.Text`
  font-size: 10px;
  margin-left: 5px;
  color: #333;
`;

const RecentStatsDisplay = styled.View`
  justify-content: center;
  align-items: center;
  padding: 20px;
  margin: 20px;
  background-color: #ffffff; /* White background for a clinical look */
  border-radius: 15px;
  border-width: 1px;
  border-color: #cccccc; /* Light gray border */
  shadow-color: #000;

  shadow-opacity: 0.2;
  shadow-radius: 2px;
  elevation: 2; /* Shadow for Android */
`;

const RecordText = styled.Text`
  font-size: 10px;
  color: grey; /* Dark text for readability */
`;

const StatText = styled.Text`
  font-size: 16px;
  color: grey; /* Slightly clinical color for stat text */
  margin-top: 5px;
  font-weight: bold;
`;

export default DashboardScreen;
