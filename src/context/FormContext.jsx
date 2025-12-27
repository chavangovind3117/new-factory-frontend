import React, { createContext, useContext, useState, useMemo } from "react";

const FormContext = createContext(null);

export const useFormContext = () => {
  const ctx = useContext(FormContext);
  if (!ctx) {
    throw new Error("useFormContext must be used inside FormProvider");
  }
  return ctx;
};

const initialFormState = {
  userID: null,
  fieldOverseerName: "",

  circleID: "",
  circleName: "",
  gutCode: "",
  villageName: "",
  villageCode: "",

  growerName: "",
  growerCode: "",

  cropType: "",
  cropCategory: "",
  cropHealth: "",
  cropStage: "",

  totalArea: {
    hectare: 0,
    acre: 0,
    gunta: 0,
    sqft: 0,
  },
  coordinates: null,

  expectedWeight: "",
  factoryMember: "",
};

export const FormProvider = ({ children }) => {
  const [formState, setFormState] = useState(initialFormState);

  const updateForm = (updates) => {
    setFormState((prev) => ({
      ...prev,
      ...updates,
      totalArea: {
        ...prev.totalArea,
        ...updates.totalArea,
      },
    }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
  };

  const value = useMemo(
    () => ({ formState, updateForm, resetForm }),
    [formState]
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};
