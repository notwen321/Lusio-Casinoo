"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface WalletProtectionProps {
  children: React.ReactNode;
}

export default function WalletProtection({ children }: WalletProtectionProps) {
  const currentAccount = useCurrentAccount();
  const router = useRouter();

  useEffect(() => {
    // If wallet is not connected, redirect to landing page
    if (!currentAccount) {
      router.push("/landing");
    }
  }, [currentAccount, router]);

  // Show nothing while redirecting
  if (!currentAccount) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Redirecting to landing page...</div>
      </div>
    );
  }

  return <>{children}</>;
}
