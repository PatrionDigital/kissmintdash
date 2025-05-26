"use client";
import React, { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useUserProfile } from "../../src/context/UserContext";
import { useNotification } from "@coinbase/onchainkit/minikit";

// Note: In a real implementation, you would use the GLICO Token CAIP-19 identifier

// Game treasury FID (replace with actual treasury FID)
const TREASURY_FID = 123456; // Example FID

// Dynamic pricing model
const ATTEMPTS_PRICING = [
  { attempts: 1, price: 0.5 },  // 0.5 GLICO for 1 attempt
  { attempts: 3, price: 1.2 },  // 1.2 GLICO for 3 attempts (20% discount)
  { attempts: 10, price: 3.5 }, // 3.5 GLICO for 10 attempts (30% discount)
];

export const PurchaseAttemptsButton = () => {
  const { isConnected } = useAccount();
  const { profile, updateProfile } = useUserProfile();
  const [selectedPackage, setSelectedPackage] = useState(ATTEMPTS_PRICING[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sendNotification = useNotification();

  // Handle token purchase using Farcaster sendToken action
  const handlePurchase = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      // Convert price to token units (with 6 decimals for GLICO)
      const tokenAmount = Math.floor(selectedPackage.price * 1000000).toString();
      
      // In a real implementation, you would use the Farcaster SDK to send tokens
      // For this demo, we're simulating a successful transaction
      console.log(`Sending ${tokenAmount} GLICO to FID ${TREASURY_FID}`);
      
      // Simulate a successful transaction
      const transactionHash = `0x${Math.random().toString(16).slice(2)}`;
      
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
      
      console.log(`Attempts purchase successful: ${transactionHash}`);
    } catch (error) {
      console.error("Error during purchase:", error);
      
      // Show error notification
      await sendNotification({
        title: "Purchase Error",
        body: "An error occurred while processing your purchase.",
      });
    }
  }, [isConnected, profile, selectedPackage, sendNotification, updateProfile]);

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
            
            {/* Purchase Button */}
            <div className="flex flex-col items-center">
              {isConnected ? (
                <button
                  onClick={handlePurchase}
                  className="w-full bg-cyber text-white font-bold py-2 px-4 rounded-lg hover:bg-cyber/80 transition-colors"
                >
                  Purchase {selectedPackage.attempts} Attempts for {selectedPackage.price} GLICO
                </button>
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
