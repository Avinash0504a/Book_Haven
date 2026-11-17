import React, { createContext, useCallback, useContext, useState } from 'react';

const PincodeContext = createContext(null);
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const DEFAULT_PINCODE = '110001';

export function PincodeProvider({ children }) {
  const [pincode, setPincodeState] = useState(() => {
    try {
      const stored = localStorage.getItem('bookhaven_pincode');
      return stored && PINCODE_REGEX.test(stored) ? stored : DEFAULT_PINCODE;
    } catch {
      return DEFAULT_PINCODE;
    }
  });

  const [error, setError] = useState(null);

  const setPincode = useCallback((newPincode) => {
    const cleaned = String(newPincode || '').trim();
    if (!PINCODE_REGEX.test(cleaned)) {
      setError('Please enter a valid 6-digit Indian postal code');
      return false;
    }

    setError(null);
    setPincodeState(cleaned);
    try {
      localStorage.setItem('bookhaven_pincode', cleaned);
    } catch {
      // Ignore localStorage errors
    }
    return true;
  }, []);

  const clearError = () => setError(null);

  return (
    <PincodeContext.Provider value={{ pincode, setPincode, error, clearError }}>
      {children}
    </PincodeContext.Provider>
  );
}

export function usePincode() {
  const context = useContext(PincodeContext);
  if (!context) {
    throw new Error('usePincode must be used within a PincodeProvider');
  }
  return context;
}
