// ********************************************************************************************************
//                                      GetAll Circles
// ********************************************************************************************************
import config from "../config/config";
const IP_ADDRESS = config.IP_ADDRESS;

export const fetchCircle = async () => {
  try {
    const response = await fetch(`${IP_ADDRESS}/api/circles`);

    if (!response.ok) {
      const text = await response.text();
      console.error("Circle API error:", text);
      return [];
    }

    const data = await response.json();

    console.log("circle data in api service : ", data);

    if (!Array.isArray(data)) return [];

    return data
      .filter((c) => c.circleID != null && c.CircleName != null)
      .map((c, index) => ({
        CircleID: c.circleID,
        CircleName: c.CircleName,
        __key: `${c.circleID}-${index}`, // 🔐 guaranteed unique
      }));
  } catch (error) {
    console.error("fetchCircle error:", error);
    return [];
  }
};

// ********************************************************************************************************
//                                      GetAll GutIds
// ********************************************************************************************************

export const fetchGutByCircleID = async (circleID) => {
  try {
    console.log("in fetching gut ids ");
    if (!circleID) return [];

    const response = await fetch(`${IP_ADDRESS}/api/gut/get/${circleID}`);

    console.log("gut in api service : ", response);

    if (!response.ok) {
      const text = await response.text();
      console.error("Gut API error:", text);
      return [];
    }

    const data = await response.json();

    console.log("gut data in api service:", data);

    if (!Array.isArray(data)) return [];

    return data;
  } catch (error) {
    console.error("fetchGutByCircleID error:", error);
    return [];
  }
};

// ********************************************************************************************************
//                                      GetAll Villages By GutID
// ********************************************************************************************************

export const fetchVillagesByGutID = async (gutCode) => {
  try {
    console.log("in fetching village ");
    if (!gutCode) return [];

    const response = await fetch(`${IP_ADDRESS}/api/village/get/${gutCode}`);

    console.log("village in api service : ", response);

    if (!response.ok) {
      const text = await response.text();
      console.error("Gut API error:", text);
      return [];
    }

    const data = await response.json();

    console.log("village data in api service:", data);

    if (!Array.isArray(data)) return [];

    return data
      .filter((v) => v.VillageCode != null && v.VillageName != null)
      .map((v, index) => ({
        VillageCode: v.VillageCode,
        VillageName: v.VillageName,
        VillageNameD: v.VillageNameD,
        __key: `${v.VillageCode}-${index}`, // 🔐 guaranteed unique
      }));
  } catch (error) {
    console.error("fetchVillagesByGutID error:", error);
    return [];
  }
};

// ********************************************************************************************************
//                                      GetAll Growers
// ********************************************************************************************************
export const fetchGrowers = async () => {
  try {
    const response = await fetch(`${IP_ADDRESS}/api/grower/all`);
    if (!response.ok) throw new Error("Failed to get all growers.");
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching growers:", error);
    throw error;
  }
};

// ********************************************************************************************************
//                                      Get Growers By Village Code
// ********************************************************************************************************
export const fetchGrowersByVillageCode = async (villageCode) => {
  try {
    console.log("in fetch grower by village code");
    if (!villageCode) return [];

    const response = await fetch(`${IP_ADDRESS}/api/grower/all/${villageCode}`);

    console.log("grover by village code in api service : ", response);

    if (!response.ok) {
      const text = await response.text();
      console.error("GrowerBy village code API error:", text);
      return [];
    }

    const data = await response.json();
    const data1 = data.data;

    console.log("grover by village code in api service: ", data1);

    if (!Array.isArray(data1)) return [];

    return data1
      .filter((g) => g.GrowerCode != null && g.GrowerName != null)
      .map((g, index) => ({
        GrowerCode: g.GrowerCode,
        GrowerName: g.GrowerName,
        GrowerNameD: g.GrowerNameD,
        __key: `${g.GrowerCode}-${index}`,
      }));
  } catch (error) {
    console.error("fetchGrowersByVillageCode error:", error);
    return [];
  }
};

// ********************************************************************************************************
//                                      Get PlantationFarm data By Grower Code
// ********************************************************************************************************
export const fetchPlantationFarmByGrowerCode = async (growerCode) => {
  try {
    console.log("in fetch plantation farm by grower code");
    if (!growerCode) return [];

    const response = await fetch(
      `${IP_ADDRESS}/api/plantationfarm/get/${growerCode}`
    );

    console.log("plantation farm by grower code in api service : ", response);

    if (!response.ok) {
      const text = await response.text();
      console.error("PlantationFarmBy grower code API error:", text);
      return [];
    }

    const data = await response.json();
    const data1 = data.data;

    console.log("plantation farm by grower code in api service: ", data1);

    if (!Array.isArray(data1)) return [];

    return data1
      .filter(
        (p) => p.PlantationFarmCode != null && p.PlantationFarmName != null
      )
      .map((p, index) => ({
        PlantationFarmCode: p.PlantationFarmCode,
        PlantationFarmName: p.PlantationFarmName,
        PlantationFarmNameD: p.PlantationFarmNameD,
        __key: `${p.PlantationFarmCode}-${index}`,
      }));
  } catch (error) {
    console.error("fetchPlantationFarmByGrowerCode error:", error);
    return [];
  }
};

// ********************************************************************************************************
//                                      Get Grower Details
// ********************************************************************************************************
export const fetchGrowerDetails = async (growercode) => {
  try {
    const response = await fetch(`${IP_ADDRESS}/api/grower/get/${growercode}`);
    if (!response.ok) throw new Error("Failed to get all grower Details.");
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching grower Details:", error);
    throw error;
  }
};
// ********************************************************************************************************
//                                      Update Grower Details
// ********************************************************************************************************
export const updateGrowerDetails = async (growerID, payload) => {
  try {
    console.log("paload : ", payload);
    const response = await fetch(
      `${IP_ADDRESS}/api/grower/update/${growerID}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) throw new Error("Failed to update grower Details.");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating grower Details:", error);
    throw error;
  }
};
// ********************************************************************************************************
//                                      GetAll LandIDs
// ********************************************************************************************************
export const fetchLandIDs = async (growerID) => {
  try {
    const response = await fetch(`${IP_ADDRESS}/api/land-details/${growerID}`);
    if (!response.ok) throw new Error("Failed to get Land IDs.");
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching land IDs:", error);
    throw error;
  }
};
// ********************************************************************************************************
//                                      Get Land Details
// ********************************************************************************************************
export const fetchLandIdDetails = async (growerID, landID) => {
  try {
    const response = await fetch(
      `${IP_ADDRESS}/api/land-details/${growerID}/${landID}`
    );
    if (!response.ok) throw new Error("Failed to get Land details.");
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching land details:", error);
    throw error;
  }
};
// ********************************************************************************************************
//                                      Update Land Area
// ********************************************************************************************************
/*export const updateLandArea = async (payload, landID) => {
    console.log("in api service")
    try {
        const response = await fetch(`${IP_ADDRESS}/api/land-details/updateArea/${landID}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            }
        );
        if (!response.ok) throw new Error("Failed to update Land Area.");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error updating land Area:", error);
        throw error;
    }
};*/

export const updateLandArea = async (landID, payload) => {
  console.log("Updating land area in api service");

  console.log("in api service : ", JSON.stringify(payload));

  try {
    const response = await fetch(
      `${IP_ADDRESS}/api/land-details/updateArea/${landID}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.text(); // Get error detail from backend
      console.error("Backend error:", errorData);
      throw new Error("Failed to update Land Area.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating land Area:", error);
    throw error;
  }
};
// ********************************************************************************************************
//                                      GetAll Crops
// ********************************************************************************************************
export const fetchCrops = async () => {
  try {
    const response = await fetch(`${IP_ADDRESS}/api/crop/all`);
    if (!response.ok) throw new Error("Failed to get all Crops.");
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching Crops:", error);
    throw error;
  }
};
// ********************************************************************************************************
//                                      GetAll Regions
// ********************************************************************************************************
export const fetchRegions = async () => {
  try {
    const response = await fetch(`${IP_ADDRESS}/api/region/all`);
    if (!response.ok) throw new Error("Failed to get all Regions.");
    const data = await response.json();
    // console.log(data)
    return data.data;
  } catch (error) {
    console.error("Error fetching Regions:", error);
    throw error;
  }
};
// ********************************************************************************************************
//                                      GetAll FieldOverseers
// ********************************************************************************************************
export const fetchFieldOverseers = async () => {
  try {
    const response = await fetch(`${IP_ADDRESS}/api/field/all`);
    if (!response.ok) throw new Error("Failed to get all fieldOverseers.");
    const data = await response.json();
    // console.log(data)
    return data.data;
  } catch (error) {
    console.error("Error fetching Regions:", error);
    throw error;
  }
};
// ********************************************************************************************************
//                                      GetAll Factories
// ********************************************************************************************************
export const fetchFactories = async (userID) => {
  try {
    const response = await fetch(`${IP_ADDRESS}/api/factory/all/${userID}`);
    if (!response.ok) throw new Error("Failed to get all factories.");
    const data = await response.json();
    // console.log(data)
    return data.data;
  } catch (error) {
    console.error("Error fetching factories:", error);
    throw error;
  }
};
// ********************************************************************************************************
//                                    Admin -> GetAll Growers Names and IDs
// ********************************************************************************************************
export const fetchGrowerNamesAndIDs = async (userID) => {
  try {
    const response = await fetch(`${IP_ADDRESS}/api/admin/all/${userID}`);
    if (!response.ok) throw new Error("Failed to get all factories.");
    const data = await response.json();
    // console.log(data)
    return data.data;
  } catch (error) {
    console.error("Error fetching factories:", error);
    throw error;
  }
};
// ********************************************************************************************************
//                                     Admin -> Get Slip Details
// ********************************************************************************************************
// export const fetchSlipDetails = async (slipID, growerID, landID) => {
//     try {
//         const response = await fetch(`http://192.168.122.65:3000/api/land-details/${slipID}/${growerID}/${landID}`);
//         if (!response.ok) throw new Error("Failed to get Land details.");
//         const data = await response.json();
//         return data.data;
//     } catch (error) {
//         console.error("Error fetching land details:", error);
//         throw error;
//     }
// };
