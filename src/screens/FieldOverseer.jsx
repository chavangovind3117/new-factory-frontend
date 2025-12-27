import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { pickPhoto, calculateLandArea } from "../utils/landUtils";
import { useRoute } from "@react-navigation/native";
import LandPhotos from "../components/LandPhotos";
import CustomButton from "../components/CustomButton";
import CustomEditButton from "../components/CustomEditButton";
import ConfirmationModal from "../components/ConfirmationModal";
import ReadOnlyArea from "../components/ReadOnlyArea";
import AddMoreLand from "../components/AddMoreLand";
import RoleSelector from "../components/RoleSelector";
import InputField from "../components/InputField";
import {
  fetchCircle,
  fetchGutByCircleID,
  fetchVillagesByGutID,
  fetchGrowersByVillageCode,
  fetchGrowers,
  fetchLandIDs,
  fetchLandIdDetails,
  fetchCrops,
  fetchFieldOverseers,
} from "../utils/apiService";
import { useToast } from "react-native-toast-notifications";
import Dropdown from "../components/DropDown";
import config from "../config/config";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useFormContext } from "../context/FormContext";

const IP_ADDRESS = config.IP_ADDRESS;
const FieldOverseer = ({ navigation }) => {
  const toast = useToast();
  const route = useRoute();
  // const navigation = useNavigation();
  const { formState, updateForm } = useFormContext();

  const { userID } = route.params;
  const [circles, setCircles] = useState([]);
  const [fieldOverseerName, setFieldOverseerName] = useState("");
  const [fieldOverseers, setFieldOverseers] = useState([]);
  const [gutList, setGutList] = useState([]);
  const [villageList, setVillageList] = useState([]);
  const [growerList, setGrowerList] = useState([]);
  const [growers, setGrowers] = useState([]);
  const [landIDs, setLandIDs] = useState([]);
  const [landID, setLandID] = useState("");
  const [landDetails, setLandDetails] = useState("");
  const [crops, setCrops] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [addMoreLand, setAddMoreLand] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  const { totalArea, coordinates } = formState;

  const { hectare = 0, acre = 0, gunta = 0, sqft = 0 } = totalArea || {};

  const handleSelect = (value) => {
    // const [name, id] = value.split("_");
    // setGrowerNameD(value);
    // setGrowercode(id);
  };

  const handleSelectCircle = (value) => {
    const [name, id] = value.split("_");

    updateForm({
      circleName: name,
      circleID: id,
      gutCode: "",
      villageName: "",
      villageCode: "",
      growerName: "",
      growerCode: "",
      cropType: "",
      cropCategory: "",
      expectedWeight: "",
      factoryMember: "",
    });
  };

  const handleSelectGutCode = (value) => {
    updateForm({
      gutCode: value,
      villageName: "",
      villageCode: "",
      growerName: "",
      growerCode: "",
      cropType: "",
      cropCategory: "",
      expectedWeight: "",
      factoryMember: "",
    });
  };

  const handleSelectVillage = (value) => {
    const [name, code] = value.split("_");

    updateForm({
      villageName: name,
      villageCode: code,
      growerName: "",
      growerCode: "",
      cropType: "",
      cropCategory: "",
      expectedWeight: "",
      factoryMember: "",
    });
  };

  const handleSelectGrower = (value) => {
    const [name, id] = value.split("_");

    updateForm({
      growerName: name,
      growerCode: id,
      cropType: "",
      cropCategory: "",
      expectedWeight: "",
      factoryMember: "",
    });
  };

  useEffect(() => {
    const loadGuts = async () => {
      if (!formState.circleID) {
        setGutList([]);
        return;
      }

      try {
        const guts = await fetchGutByCircleID(formState.circleID);
        setGutList(guts);
      } catch (error) {
        console.error("Failed to fetch guts:", error);
        setGutList([]);
      }
    };

    loadGuts();
  }, [formState.circleID]);

  useEffect(() => {
    const loadVillages = async () => {
      if (!formState.gutCode) {
        setVillageList([]);
        return;
      }

      try {
        console.log("load villages useeffect gut id : ", formState.gutCode);
        const villages = await fetchVillagesByGutID(formState.gutCode);
        console.log("village in useeffect : ", villages);
        setVillageList(villages);
      } catch (error) {
        console.error("Failed to fetch guts:", error);
        setVillageList([]);
      }
    };

    loadVillages();
  }, [formState.gutCode]);

  useEffect(() => {
    const loadCircles = async () => {
      console.log("Loading circles...");
      let toastId = toast.show("Loading Circles...");
      try {
        const data = await fetchCircle();

        console.log("fetching data: ", data);
        if (Array.isArray(data)) {
          setCircles(data);
        } else {
          console.warn("Circle API returned non-array:", data);
          setCircles([]);
        }
      } catch (error) {
        toast.show("Unable to load circles", { type: "danger" });
      } finally {
        toast.hide(toastId);
      }
    };

    loadCircles();
  }, []);

  useEffect(() => {
    const loadGrowersByVillageCode = async () => {
      if (!formState.villageCode) {
        setGrowerList([]);
        return;
      }

      try {
        const growers = await fetchGrowersByVillageCode(formState.villageCode);
        setGrowerList(growers);
      } catch (error) {
        console.error("Failed to fetch growers:", error);
        setGrowerList([]);
      }
    };

    loadGrowersByVillageCode();
  }, [formState.villageCode]);

  const handleCropType = (value) => {
    const [name] = value.split("_");
    updateForm({ cropType: name });
  };

  useEffect(() => {
    const getCrops = async () => {
      let id = toast.show("Fetching Crop Details...");
      try {
        const data = await fetchCrops();
        setCrops(data);
      } catch (error) {
        toast.show("Failed to fetch Overseers details.", { type: "danger" });
      } finally {
        toast.hide(id);
      }
    };

    const getFieldOverseers = async () => {
      let id = toast.show("Loading...");
      try {
        const data = await fetchFieldOverseers();
        console.log("Fetched getFieldOverseers data:", data);
        console.log("UserID:", userID);
        setFieldOverseers(data);
        const overseer = data.find((g) => g.UserID === userID);
        if (overseer) {
          updateForm({
            userID,
            fieldOverseerName: overseer.FieldOverseerName,
          });
        } else {
          toast.show("Field overseer not found.", { type: "danger" });
        }
      } catch (error) {
        toast.show("Failed to fetch Overseers details.", { type: "danger" });
      } finally {
        toast.hide(id);
      }
    };

    getCrops();
    getFieldOverseers();
  }, []);

  useEffect(() => {
    const loadGrowers = async () => {
      let id = toast.show("Loading...");
      try {
        const data = await fetchGrowers();
        setGrowers(data);
      } catch (error) {
        toast.show("Failed to fetch land details.", { type: "danger" });
      } finally {
        toast.hide(id);
      }
    };

    loadGrowers();
  }, []);

  // useEffect(() => {
  //   if (growerCode) {
  //     const loadLandIDs = async () => {
  //       let id = toast.show("Loading...");
  //       try {
  //         const data = await fetchLandIDs(growerCode);
  //         {
  //           data && setLandIDs(data);
  //         }
  //       } catch (error) {
  //         toast.show("Failed to fetch land IDs.", { type: "danger" });
  //       } finally {
  //         toast.hide(id);
  //       }
  //     };

  //     loadLandIDs();
  //   }
  // }, [growerCode]); // ✅ Fetch Land IDs when `growerID` changes

  // useEffect(() => {
  //   if (landID) {
  //     const loadLandDetails = async () => {
  //       let id = toast.show("Loading...");
  //       try {
  //         const data = await fetchLandIdDetails(growerCode, landID);
  //         if (!data || data.length === 0) throw new Error("No data received");

  //         setLandDetails(data[0]);
  //         setCropType(data[0].CropType);
  //         setCropCategory(data[0].CropCategory);

  //         setCoordinates(data[0].Coordinates);

  //         setTotalArea({
  //           hectare: data[0].TotalAreaInHectare || 0,
  //           acre: data[0].TotalAreaInAcre || 0,
  //           gunta: data[0].TotalAreaInGunta || 0,
  //           sqft: data[0].TotalAreaInGunta * 1089 || 0,
  //         });

  //         console.log("Fetched Land Details:", data);
  //         console.log("New Crop Type:", data[0].CropType);
  //         console.log("New Crop Category:", data[0].CropCategory);
  //         console.log("Updated Total Area:", totalArea);
  //         console.log("fetched coordinates :", data[0].Coordinates);
  //       } catch (error) {
  //         toast.show("Failed to fetch land details.", { type: "danger" });
  //       } finally {
  //         toast.hide(id);
  //       }
  //     };

  //     loadLandDetails();
  //   }
  // }, [landID]); // ✅ Fetch Land Details when both `growerID` & `landID` change

  // const handlePickPhoto = async () => {
  //   let id = toast.show("Loading...");
  //   const result = await pickPhoto(
  //     photos,
  //     setPhotos,
  //     calculateLandArea,
  //     setTotalArea
  //   );
  //   if (!result.success) {
  //     toast.show(result.message, { type: "danger" });
  //   }
  //   toast.hide(id);
  // };

  // const buildPayload = (
  //   growerCode,
  //   fieldOverseerName,
  //   cropType,
  //   cropHealth,
  //   cropStage,
  //   gutCode,
  //   expectedWeight,
  //   cropCategory,
  //   factoryMember,
  //   totalArea,
  //   coordinates,
  //   circleID,
  //   circleName
  // ) => ({
  //   growerCode,
  //   fieldOverseerName,
  //   cropType,
  //   cropCategory,
  //   cropHealth,
  //   cropStage,
  //   gutCode,
  //   expectedWeight,
  //   factoryMember,

  //   totalAreaInHectare: parseFloat(totalArea.hectare),
  //   totalAreaInAcre: parseFloat(totalArea.acre),
  //   totalAreaInGunta: parseFloat(totalArea.gunta),

  //   coordinates,
  //   circleID,
  //   circleName,
  // });

  // const clearFormData = () => {
  //   updateForm({
  //     circleID: "",
  //     circleName: "",
  //     gutCode: "",
  //     villageName: "",
  //     villageCode: "",
  //     growerName: "",
  //     growerCode: "",
  //     cropType: "",
  //     cropCategory: "",
  //     cropHealth: "",
  //     cropStage: "",
  //     expectedWeight: "",
  //     factoryMember: "",
  //     totalArea: {
  //       hectare: 0,
  //       acre: 0,
  //       gunta: 0,
  //       sqft: 0,
  //     },
  //     coordinates: null,
  //   });

  //   setPhotos([]);
  //   setAddMoreLand(false);
  // };

  const handleSubmit = async () => {
    console.log("Add more land : ", addMoreLand);

    const payload = buildPayload(
      formState.growerCode,
      formState.fieldOverseerName,
      formState.cropType,
      formState.cropHealth,
      formState.cropStage,
      formState.gutCode,
      formState.expectedWeight,
      formState.cropCategory,
      formState.factoryMember,
      totalArea,
      coordinates,
      formState.circleID,
      formState.circleName
    );

    console.log("payload", payload);

    if (
      !formState.growerCode ||
      !formState.fieldOverseerName ||
      !formState.cropType ||
      !formState.cropCategory ||
      !formState.cropHealth ||
      !formState.cropStage ||
      !formState.factoryMember ||
      !totalArea?.hectare ||
      !totalArea?.acre ||
      !totalArea?.gunta ||
      !formState.gutCode ||
      !formState.expectedWeight
    ) {
      toast.show("Complete all fields before submitting.", { type: "danger" });
      return;
    }

    let id = toast.show("Updating Details...");
    try {
      const response = await fetch(
        `${IP_ADDRESS}/api/land-details/update/${landID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json", // Correct Content-Type for JSON payload
          },
          body: JSON.stringify(payload), // Send payload as JSON
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update Land details.");
      }

      const data = await response.json();
      console.log("Response Data:", data);
      toast.show("Grower details updated successfully!", { type: "success" });
      // console.log("printing ids: ", growerID, userID, growerName)
      console.log("add more land ; ", addMoreLand);
      if (!addMoreLand) {
        navigation.navigate("GenerateSlip", {
          growerCode: formState.growerCode,
          growerName: formState.growerName,
          userID: formState.userID,
        });
      }

      // Clear form and photo after successful submission
      // clearFormData();
    } catch (error) {
      console.error("Error:", error);
      toast.show("Failed to submit grower details.", { type: "danger" });
    } finally {
      clearFormData();
      toast.hide(id);
    }
  };

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  const handleConfirm = () => {
    // navigation.navigate("GrowerProfile");
    // navigation.navigate("GenerateSlip");
    console.log(
      "printing ids: ",
      formState.growerCode,
      userID,
      formState.growerName
    );
    handleSubmit();
    console.log("Confirmed! Submitting data...");
    // Add your submit logic here
  };
  console.log("overseerName", fieldOverseerName);

  const handleGoogleEarth = () => {
    if (!formState.growerCode) {
      toast.show("Please select Grower first", { type: "danger" });
      return;
    }

    navigation.navigate("MeasureTool");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Field Overseer Name */}
      <InputField
        label="Field Overseer Name"
        placeholder="Field Overseer Name"
        value={formState.fieldOverseerName}
        editable={false}
      />
      {/* Circle Name Picker */}
      <Dropdown
        label="Select Circle"
        placeholder="Select Circle"
        items={
          Array.isArray(circles)
            ? circles.map((c) => ({
                label: c.CircleName,
                value: `${c.CircleName}_${c.CircleID}`,
                key: c.__key || String(c.CircleID), // 🔐 safe key
              }))
            : []
        }
        selectedValue={formState.circleName}
        onSelect={handleSelectCircle}
      />

      {/* Gut Number Picker */}
      <Dropdown
        label="Select Gut Number/गट निवडा"
        placeholder="Select Gut Number"
        items={gutList.map((g) => ({
          label: g.Gutcode,
          value: g.Gutcode,
          key: String(g.Gutcode),
        }))}
        selectedValue={formState.gutCode}
        onSelect={handleSelectGutCode}
      />

      {/* Villege Name Picker */}
      <Dropdown
        label="Select Village Name/गाव निवडा"
        placeholder="Select Village Name"
        items={villageList.map((v) => ({
          label: v.VillageName + "/" + v.VillageNameD,
          value: v.VillageName + "_" + v.VillageCode,
          key: String(v.VillageCode),
        }))}
        selectedValue={formState.villageName}
        onSelect={handleSelectVillage}
      />

      {/* Grower Name Picker */}
      <Dropdown
        label="Select Grower Name/ग्रोवर नाव निवडा"
        items={growerList.map((g) => ({
          label: g.GrowerName + "/" + g.GrowerNameD,
          value: g.GrowerName + "_" + g.GrowerCode,
          key: g.GrowerCode,
        }))}
        placeholder="Select Grower Name"
        selectedValue={formState.growerName}
        onSelect={handleSelectGrower}
      />

      {/*{/* View/Edit Grower Info 
      <CustomEditButton title="View/Edit Grower Info" onPress={handleNavigate} />*/}

      {/* Land ID Picker */}
      {/* <Dropdown
        label="Select Land ID /शेती आयडी निवडा"
        items={landIDs.map((g) => ({
          label: "Grower Land ID__" + g.LandID,
          value: g.LandID,
          key: g.LandID,
        }))}
        placeholder="Select Land ID"
        selectedValue={landID}
        onSelect={setLandID}
      /> */}

      {/* Crop Type Picker */}
      <Dropdown
        label="Crop Type/पिक प्रकार"
        items={crops.map((g) => ({
          label: g.CropType + "_" + g.CropID,
          value: g.CropType + "_" + g.CropID,
          key: g.CropID,
        }))}
        placeholder="Select Crop Type"
        selectedValue={formState.cropType}
        onSelect={handleCropType}
      />

      {/* Crop Category Picker */}
      <Dropdown
        label="Crop Category/पिक श्रेणी"
        items={crops.map((g) => ({
          label: g.CropType + "__" + g.CropCategory,
          value: g.CropCategory,
          key: g.CropID,
        }))}
        placeholder="Select Crop Category"
        selectedValue={formState.cropCategory}
        onSelect={(value) => updateForm({ cropCategory: value })}
      />

      {/* Crop Health */}
      {/* <RoleSelector
        label="Crop Health/पिकाची प्रत"
        roles={["Healthy", "Moderate", "Poor"]}
        selectedRole={formState.cropHealth}
        onSelectRole={(value) => updateForm({ cropHealth: value })}
      /> */}

      {/* Crop Stage */}
      {/* <RoleSelector
        label="Crop Stage/पिकाची स्थिती"
        roles={["Initial", "Growing", "Harvesting"]}
        selectedRole={formState.cropStage}
        onSelectRole={(value) => updateForm({ cropStage: value })}
      />  */}

      {/* Land Photos */}
      {/* <LandPhotos
        label="Land Photos (3-8 photos)"
        photos={photos}
        setPhotos={setPhotos}
        calculateLandArea={calculateLandArea}
        setTotalArea={setTotalArea}
        pickPhoto={handlePickPhoto}
      />
      */}

      {/* Read-Only Area */}
      <ReadOnlyArea
        label="Approximate Total Area of Land/शेतीचे एकूण क्षेत्रफळ"
        totalArea={
          formState.totalArea || {
            hectare: 0,
            acre: 0,
            gunta: 0,
            sqft: 0,
          }
        }
      />

      <CustomEditButton title="GoogleEarth View" onPress={handleGoogleEarth} />

      {/* Gut Number */}
      {/* <InputField
        label="Gut Number/गट नंबर"
        placeholder="Enter Gut Number"
        value={gutCode}
        onChangeText={setGutCode}
        keyboardType="numeric"
        // maxLength={6} // Restrict input to 6 digits
      /> */}

      {/* Expected Weight/Tonnage */}
      <InputField
        label="Expected Weight/Tonnage (किलोमध्ये अपेक्षित वजन)"
        placeholder="Expected Weight"
        value={formState.expectedWeight}
        onChangeText={(text) => updateForm({ expectedWeight: text })}
      />

      {/* Select Factory Member */}
      <Dropdown
        label="Factory Member/कारखाना सदस्य?"
        items={[
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" },
        ]}
        placeholder="Select Factory Member"
        selectedValue={formState.factoryMember}
        onSelect={(value) => updateForm({ factoryMember: value })}
      />

      {/* Add More Land */}
      {/*<AddMoreLand
        label="Add More Land?"
        addMoreLand={addMoreLand}
        setAddMoreLand={setAddMoreLand}
      />
      */}

      {/* Submit Button */}
      <CustomButton title="Save Land Details" onPress={handleOpenModal} />

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        title="Confirm Submission"
        message="Are you sure you want to submit?"
      />
    </ScrollView>
  );
};

// Add your styles here
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  modalActions: {
    marginVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  noButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  noButtonText: {
    color: "#000",
    fontSize: 16,
  },
  yesButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  yesButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default FieldOverseer;
