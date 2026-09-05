import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { CustomerAddressProvider } from "@/contexts/CustomerAddressContext";

export default function CustomerLayout() {
  return (
    <CustomerAddressProvider>
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </CustomerAddressProvider>
  );
}
