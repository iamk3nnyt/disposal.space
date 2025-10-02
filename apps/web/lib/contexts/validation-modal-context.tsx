"use client";

import type { ValidationResult } from "@/lib/hooks/use-upload-validation";
import { createContext, ReactNode, useContext, useState } from "react";

interface ValidationModalContextType {
  validationModal: {
    isOpen: boolean;
    validation: ValidationResult | null;
  };
  showValidationModal: (validation: ValidationResult) => void;
  hideValidationModal: () => void;
}

const ValidationModalContext = createContext<
  ValidationModalContextType | undefined
>(undefined);

export function ValidationModalProvider({ children }: { children: ReactNode }) {
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    validation: ValidationResult | null;
  }>({ isOpen: false, validation: null });

  const showValidationModal = (validation: ValidationResult) => {
    setValidationModal({
      isOpen: true,
      validation,
    });
  };

  const hideValidationModal = () => {
    setValidationModal({ isOpen: false, validation: null });
  };

  return (
    <ValidationModalContext.Provider
      value={{
        validationModal,
        showValidationModal,
        hideValidationModal,
      }}
    >
      {children}
    </ValidationModalContext.Provider>
  );
}

export function useValidationModal() {
  const context = useContext(ValidationModalContext);
  if (context === undefined) {
    throw new Error(
      "useValidationModal must be used within a ValidationModalProvider",
    );
  }
  return context;
}
