import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Button, IconButton, MD3Colors } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { db } from "./firbaseData";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

import styled from "styled-components/native";

const screenWidth = Dimensions.get("window").width;

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    bio: "",
    email: "", // Email to be used as the document ID
  });
  const [showForm, setShowForm] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const usersPerPage = 4;

  const navigation = useNavigation();

  // Function to fetch all user documents
  const fetchUsers = async () => {
    setIsBusy(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
      setFilteredUsers(usersList);
      setIsBusy(false);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users by search term
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, users]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    navigation.navigate("login");
  };

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (direction) => {
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const displayedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const navigateToDashboard = (user) => {
    navigation.navigate("dash", { user });
  };

  const handleCreatePatient = async () => {
    if (
      !newPatient.name ||
      !newPatient.age ||
      !newPatient.bio ||
      !newPatient.email
    ) {
      Alert.alert("Error", "Please fill all fields before submitting.");
      return;
    }

    const newPatientData = {
      name: newPatient.name,
      age: newPatient.age,
      bio: newPatient.bio,
      email: newPatient.email,
    };

    try {
      // Use email as document ID
      await setDoc(doc(db, "users", newPatient.email), newPatientData);
      setUsers([...users, { id: newPatient.email, ...newPatientData }]);
      setFilteredUsers([...users, { id: newPatient.email, ...newPatientData }]);
      setNewPatient({ name: "", age: "", bio: "", email: "" });
      setShowForm(false);
      Alert.alert("Success", "New patient added successfully!");
    } catch (error) {
      console.error("Error creating new patient:", error);
      Alert.alert("Error", "There was an error adding the patient.");
    }
  };

  // Fetch specific user by email using getDoc
  const fetchUserByEmail = async (email) => {
    try {
      const docRef = doc(db, "users", email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user by email:", error);
    }
  };

  return (
    <Container style={styles.container}>
      <StatusBar backgroundColor="#6200EE" barStyle="light-content" />
      {/* <Text style={styles.title}>User Directory</Text> */}
      <SearchInput
        style={styles.searchInput}
        placeholder="Search by user's name..."
        value={searchTerm}
        onChangeText={(text) => setSearchTerm(text)}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {displayedUsers.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={styles.userCard}
            onPress={() => navigateToDashboard(user)}
          >
            <UserCard>
              <Icon name="account" size={30} color="#6200EE" />
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </UserCard>
          </TouchableOpacity>
        ))}
        <ActivityIndicator size="small" color="#6200EE" animating={isBusy} />
      </ScrollView>

      <Pagination>
        <PaginationButton
          onPress={() => handlePageChange("prev")}
          disabled={currentPage === 1}
        >
          <Icon
            name="arrow-left-circle"
            size={24}
            color={currentPage === 1 ? "#ccc" : "#6200EE"}
          />
        </PaginationButton>
        <Text>{`Page ${currentPage} of ${totalPages}`}</Text>
        <PaginationButton
          onPress={() => handlePageChange("next")}
          disabled={currentPage === totalPages}
        >
          <Icon
            name="arrow-right-circle"
            size={24}
            color={currentPage === totalPages ? "#ccc" : "#6200EE"}
          />
        </PaginationButton>
      </Pagination>
      <StyledButton
        compact={true}
        mode="outlined"
        onPress={() => setShowForm(!showForm)}
      >
        {showForm ? "Hide Form" : "Add New Patient"}
      </StyledButton>
      <StyledButton mode="outlined" onPress={handleLogout}>
        Logout
      </StyledButton>

      {showForm && (
        <NewPatientForm style={styles.form}>
          <MYTextINPUT
            placeholder="Name"
            value={newPatient.name}
            onChangeText={(text) =>
              setNewPatient({ ...newPatient, name: text })
            }
          />
          <MYTextINPUT
            placeholder="Age"
            value={newPatient.age}
            onChangeText={(text) => setNewPatient({ ...newPatient, age: text })}
          />
          <MYTextINPUT
            placeholder="Bio"
            value={newPatient.bio}
            onChangeText={(text) => setNewPatient({ ...newPatient, bio: text })}
          />
          <MYTextINPUT
            placeholder="Email"
            value={newPatient.email}
            onChangeText={(text) =>
              setNewPatient({ ...newPatient, email: text })
            }
          />
          <View style={styles.upload_container}>
            <IconButton
              mode="contained-tonal"
              compact={true}
              icon="cloud"
              onPress={handleCreatePatient}
              iconColor="#6200EE"
            >
              upload
            </IconButton>
          </View>
        </NewPatientForm>
      )}
    </Container>
  );
};

// Styled components
const Container = styled.View`
  flex: 1;
  background-color: #f5f5f5;
  padding: 20px;
`;

const SearchInput = styled.TextInput`
  height: 40px;
  border-width: 1px;
  border-color: #ccc;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 20px;
`;

const MYTextINPUT = styled.TextInput`
  height: 40px;
  border-width: 1px;
  border-color: #ccc;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
`;

const UserStats = styled.View``;

const UserCountText = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const UserCard = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #fff;
  border-radius: 10px;
  gap: 5px;
`;

const Avatar = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 15px;
`;

const UserInfo = styled.View`
  flex: 1;
`;

const UserName = styled.Text`
  font-weight: bold;
  font-size: 16px;
`;

const UserBio = styled.Text`
  color: #666;
  font-size: 14px;
`;

const RemoveButton = styled.TouchableOpacity`
  padding: 5px;
  position: relative;
`;

const NewPatientForm = styled.View`
  background-color: #eeeeee;

  padding: 5%;
  border-radius: 10px;

  elevation: 3;
`;

const StyledButton = styled(Button)`
  margin-top: 10px;
  padding: 10px;
`;

const FloatingButton = styled.TouchableOpacity`
  background-color: #6200ee;
  border-radius: 30px;

  elevation: 4;
`;

const Pagination = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const PaginationButton = styled.TouchableOpacity`
  padding: 10px;
`;

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 10,
  },
  input: {
    height: 40,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  paginationText: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  form: {},

  upload_container: {
    marginVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    // backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
});

// const styles = StyleSheet.create({

//   // Define styles here
// });

export default UsersPage;
