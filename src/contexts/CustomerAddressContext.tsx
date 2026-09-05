import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addressService } from "@/services/addressService";
import type { Address } from "@/types";

interface CustomerAddressContextValue {
  addresses: Address[];
  activeAddress?: Address;
  activeAddressId?: number;
  setActiveAddressId: (id: number) => void;
  isLoading: boolean;
}

const CustomerAddressContext =
  createContext<CustomerAddressContextValue | null>(null);
const STORAGE_KEY = "mealflex-active-address-id";

export function CustomerAddressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeAddressId, setActiveAddressIdState] = useState<
    number | undefined
  >(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : undefined;
  });
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: addressService.getMyAddresses,
  });

  useEffect(() => {
    if (!addresses.length) {
      setActiveAddressIdState(undefined);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    if (
      !activeAddressId ||
      !addresses.some((address) => address.id === activeAddressId)
    ) {
      const defaultAddress =
        addresses.find((address) => address.defaultAddress) || addresses[0];
      setActiveAddressIdState(defaultAddress.id);
      localStorage.setItem(STORAGE_KEY, String(defaultAddress.id));
    }
  }, [addresses, activeAddressId]);

  const setActiveAddressId = (id: number) => {
    setActiveAddressIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  };
  const activeAddress = addresses.find(
    (address) => address.id === activeAddressId,
  );
  const value = useMemo(
    () => ({
      addresses,
      activeAddress,
      activeAddressId,
      setActiveAddressId,
      isLoading,
    }),
    [addresses, activeAddress, activeAddressId, isLoading],
  );

  return (
    <CustomerAddressContext.Provider value={value}>
      {children}
    </CustomerAddressContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- this hook belongs to its provider context module.
export function useCustomerAddress() {
  const context = useContext(CustomerAddressContext);
  if (!context)
    throw new Error(
      "useCustomerAddress must be used inside CustomerAddressProvider",
    );
  return context;
}
