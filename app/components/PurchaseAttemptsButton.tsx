"use client";
import React, { useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useUserProfile } from "../../src/context/UserContext";
import { useNotification } from "@coinbase/onchainkit/minikit";
import { Wallet, ConnectWallet } from "@coinbase/onchainkit/wallet";

// Payment wallet address from environment variables
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel
} from "@coinbase/onchainkit/transaction";

// Using ABI approach instead of function selector

// Dynamic pricing model
const ATTEMPTS_PRICING = [
  { attempts: 1, price: 0.5 },  // 0.5 GLICO for 1 attempt
  { attempts: 3, price: 1.2 },  // 1.2 GLICO for 3 attempts (20% discount)
  { attempts: 10, price: 3.5 }, // 3.5 GLICO for 10 attempts (30% discount)
];

export const PurchaseAttemptsButton = () => {
  const { isConnected, address } = useAccount();
  const { profile, updateProfile } = useUserProfile();
  const [selectedPackage, setSelectedPackage] = useState(ATTEMPTS_PRICING[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sendNotification = useNotification();


  // Prepare contract call for token transfer using the ERC20 transfer function
  const tokenTransferCall = useMemo(() => {
    if (!isConnected || !address) return [];
    // Use 18 decimals for GLICO token
    const tokenAmount = BigInt(Math.floor(Number(selectedPackage.price) * 10 ** 18));
    // ERC20 transfer(address,uint256) selector: 0xa9059cbb
    const TRANSFER_FUNCTION_SELECTOR = "0xa9059cbb";
    return [{
      to: process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`,
      data: `${TRANSFER_FUNCTION_SELECTOR}${(process.env.NEXT_PUBLIC_PAYMENT_ADDRESS as string).slice(2).padStart(64, '0')}${tokenAmount.toString(16).padStart(64, '0')}` as `0x${string}`,
      value: BigInt(0)
    }];
  }, [isConnected, address, selectedPackage.price]);

  // Handle transaction success
  const handleSuccess = useCallback(async () => {
    updateProfile({
      bonusAttempts: profile.bonusAttempts + selectedPackage.attempts,
    });
    setIsModalOpen(false);
    await sendNotification({
      title: "Bonus Attempts Purchased!",
      body: `You've successfully purchased ${selectedPackage.attempts} bonus attempts for ${selectedPackage.price} GLICO!`,
    });
  }, [profile, selectedPackage, sendNotification, updateProfile]);

  // Handle transaction error
  const handleError = useCallback(async (error: Error | unknown) => {
    console.error("Error during purchase:", error);
    await sendNotification({
      title: "Purchase Error",
      body: "An error occurred while processing your purchase.",
    });
  }, [sendNotification]);
  
  

  // Toggle modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      {/* Purchase Button */}
      <button
        onClick={toggleModal}
        className="w-full bg-cyber text-black font-bold py-2 px-4 rounded-lg hover:bg-cyber/80 transition-colors mt-4"
        disabled={!isConnected}
      >
        Buy Game Attempts
      </button>

      {/* Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[var(--app-card-bg)] rounded-xl p-6 max-w-md w-full mx-4 border-2 border-cyber">
            <h2 className="text-xl font-bold mb-4 text-center">Purchase Game Attempts</h2>
            
            {/* Package Selection */}
            <div className="grid gap-3 mb-6">
              {ATTEMPTS_PRICING.map((pkg) => (
                <div 
                  key={pkg.attempts}
                  className={`border-2 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPackage.attempts === pkg.attempts 
                      ? "border-cyber bg-cyber/10" 
                      : "border-gray-700 hover:border-cyber/50"
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">{pkg.attempts} Attempts</span>
                    <span className="text-right">
                      <span className="font-bold text-lg">{pkg.price}</span>
                      <span className="text-sm ml-1">GLICO</span>
                    </span>
                  </div>
                  {pkg.attempts > 1 && (
                    <div className="text-right text-xs text-green-400 mt-1">
                      {pkg.attempts === 3 ? "20% discount" : "30% discount"}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Purchase Button with Transaction Component */}
            <div className="flex flex-col items-center">
              {isConnected ? (
                <Transaction
                  calls={tokenTransferCall}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  resetAfter={0}
                >
                  <TransactionButton
                    className="w-full bg-cyber text-black font-bold py-2 px-4 rounded-lg hover:bg-cyber/80 transition-colors"
                    text={`Purchase ${selectedPackage.attempts} Attempts for ${selectedPackage.price} GLICO`}
                  />
                  <TransactionStatus className="mt-2 text-center">
                    <TransactionStatusLabel />
                    <TransactionStatusAction />
                  </TransactionStatus>
                  <TransactionToast className="mb-4">
                    <TransactionToastIcon />
                    <TransactionToastLabel />
                    <TransactionToastAction />
                  </TransactionToast>
                </Transaction>
              ) : (
                <div className="flex flex-col items-center w-full mt-2">
                  <Wallet>
                    <ConnectWallet />
                  </Wallet>
                </div>
              )}
            </div>
            
            {/* Close Button */}
            <button
              onClick={toggleModal}
              className="w-full mt-4 border border-gray-600 text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};
