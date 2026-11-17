import { useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider.jsx';
import { usePincode } from './PincodeProvider.jsx';
import { useAddresses } from '../features/profile/hooks/useAddresses.js';

/**
 * Keeps the "Deliver to" pincode in step with the signed-in member's default address.
 * It applies the default address pincode once per change, so a pincode the member then
 * types in the location dialog is kept until their default address changes or they sign in again.
 * Renders nothing.
 */
export function DefaultAddressPincode() {
  const { isAuthenticated } = useAuth();
  const { setPincode } = usePincode();
  const { data: addresses = [] } = useAddresses({ enabled: isAuthenticated });
  const applied = useRef(null);

  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
  const postalCode = isAuthenticated ? defaultAddress?.postalCode : null;

  useEffect(() => {
    if (!isAuthenticated) {
      applied.current = null;
      return;
    }
    if (postalCode && postalCode !== applied.current) {
      applied.current = postalCode;
      setPincode(postalCode);
    }
  }, [isAuthenticated, postalCode, setPincode]);

  return null;
}
