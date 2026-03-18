import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

interface EducationContextType {
  educationMode: boolean;
  setEducationMode: (on: boolean) => void;
  dismissedTips: Set<string>;
  dismissTip: (id: string) => void;
  resetTips: () => void;
}

const EducationContext = createContext<EducationContextType>({
  educationMode: true,
  setEducationMode: () => {},
  dismissedTips: new Set(),
  dismissTip: () => {},
  resetTips: () => {},
});

export function EducationProvider({ children }: { children: ReactNode }) {
  const [educationMode, setEducationModeState] = useState(() => {
    const stored = localStorage.getItem("hufi_education_mode");
    return stored === null ? true : stored === "true";
  });

  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("hufi_dismissed_tips");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const setEducationMode = useCallback((on: boolean) => {
    setEducationModeState(on);
    localStorage.setItem("hufi_education_mode", String(on));
  }, []);

  const dismissTip = useCallback((id: string) => {
    setDismissedTips((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("hufi_dismissed_tips", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const resetTips = useCallback(() => {
    setDismissedTips(new Set());
    localStorage.removeItem("hufi_dismissed_tips");
  }, []);

  return (
    <EducationContext.Provider value={{ educationMode, setEducationMode, dismissedTips, dismissTip, resetTips }}>
      {children}
    </EducationContext.Provider>
  );
}

export function useEducation() {
  return useContext(EducationContext);
}
