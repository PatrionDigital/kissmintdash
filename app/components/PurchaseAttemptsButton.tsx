"use client";
import React, { useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useUserProfile } from "../../src/context/UserContext";
import { useNotification } from "@coinbase/onchainkit/minikit";
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

// Payment wallet address from environment variables
const paymentAddressFromEnv = process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || "0x48FFCbCaBb0B10B2A185D398EE67c48080b9D7e7";
const PAYMENT_ADDRESS = paymentAddressFromEnv.startsWith('0x') ? 
  paymentAddressFromEnv : 
  `0x${paymentAddressFromEnv}`;

// Ensure TOKEN_ADDRESS has the correct 0x prefix without duplication
const tokenAddressFromEnv = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x6De365d939Ce9Ab46e450E5f1FA706E1DbcEC9Fe";
const TOKEN_ADDRESS = tokenAddressFromEnv.startsWith('0x') ? 
  tokenAddressFromEnv as `0x${string}` : 
  `0x${tokenAddressFromEnv}` as `0x${string}`;

// ERC20 transfer function selector: keccak256("transfer(address,uint256)").slice(0, 10)
const TRANSFER_FUNCTION_SELECTOR = "0xa9059cbb";

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


  // Create contract call for token transfer using the ERC20 transfer function
  const tokenTransferCall = useMemo(() => {
    if (!isConnected || !address) return [];
    
    // Convert price to token units (with 6 decimals for GLICO)
    const tokenAmount = BigInt(Math.floor(selectedPackage.price * 1000000));
    
    // Encode the ERC20 transfer function call
    // The ERC20 transfer function has the signature: transfer(address,uint256)
    // We need to encode the function selector (first 4 bytes of the keccak256 hash of the function signature)
    // followed by the encoded arguments (recipient address and amount)
    
    // For simplicity, we'll use a direct transaction call format
    return [{
      to: TOKEN_ADDRESS, // The token contract address
      data: `${TRANSFER_FUNCTION_SELECTOR}${PAYMENT_ADDRESS.slice(2).padStart(64, '0')}${tokenAmount.toString(16).padStart(64, '0')}` as `0x${string}`, // Encoded transfer function call
      value: BigInt(0) // No ETH is being sent
    }];
  }, [isConnected, address, selectedPackage.price]);
  
  // Handle successful transaction
  const handleSuccess = useCallback(async () => {
    console.log(`Attempts purchase successful!`);
    
    // Update user's bonus attempts
    updateProfile({
      bonusAttempts: profile.bonusAttempts + selectedPackage.attempts,
    });
    
    // Close modal
    setIsModalOpen(false);
    
    // Send notification
    await sendNotification({
      title: "Bonus Attempts Purchased!",
      body: `You've successfully purchased ${selectedPackage.attempts} bonus attempts for ${selectedPackage.price} GLICO!`,
    });
  }, [profile, selectedPackage, sendNotification, updateProfile]);
  
  // Handle transaction error
  const handleError = useCallback(async (error: Error | unknown) => {
    console.error("Error during purchase:", error);
    
    // Send error notification
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
        className="w-full bg-cyber text-white font-bold py-2 px-4 rounded-lg hover:bg-cyber/80 transition-colors mt-4"
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
                >
                  <TransactionButton 
                    className="w-full bg-cyber text-white font-bold py-2 px-4 rounded-lg hover:bg-cyber/80 transition-colors"
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
                <p className="text-yellow-400 text-sm text-center mt-2">
                  Connect your wallet to purchase attempts
                </p>
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
