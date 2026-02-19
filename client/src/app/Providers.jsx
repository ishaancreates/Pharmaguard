"use client";
import { AuthProvider } from "@/context/AuthContext";
import PageLoader from "@/components/PageLoader";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <PageLoader />
      {children}
    </AuthProvider>
  );
}
