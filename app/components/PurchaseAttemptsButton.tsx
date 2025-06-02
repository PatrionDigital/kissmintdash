"use client";
import React, { useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useUserProfile } from "../../src/context/UserContext";
import { useNotification } from "@coinbase/onchainkit/minikit";
import { Wallet, ConnectWallet } from "@coinbase/onchainkit/wallet";
import { ImTicket } from "react-icons/im";
import { Icon } from "./DemoComponents";

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
const GAME_PASS_PRICING = [
  { passes: 1, price: 5 },   // 5 GLICO for 1 pass
  { passes: 3, price: 12 },  // 12 GLICO for 3 passes - 20 % discount
  { passes: 10, price: 45 }, // 45 GLICO for 10 passes - 1 Free Pass
];

export const PurchaseAttemptsButton = () => {
  const { isConnected, address } = useAccount();
  const { profile, updateProfile } = useUserProfile();
  const [selectedPackage, setSelectedPackage] = useState(GAME_PASS_PRICING[0]);
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
  const handleSuccess = useCallback(async (response: { transactionReceipts?: { transactionHash: string }[] }) => {
    updateProfile({
      bonusAttempts: profile.bonusAttempts + selectedPackage.passes,
    });
    setIsModalOpen(false);
    await sendNotification({
      title: "Bonus Attempts Purchased!",
      body: `You've successfully purchased ${selectedPackage.passes} Game Pass${selectedPackage.passes > 1 ? 'es' : ''} for ${selectedPackage.price} GLICO!`,
    });

    // Allocate revenue
    if (response?.transactionReceipts && response.transactionReceipts.length > 0) {
      const transactionHash = response.transactionReceipts[0].transactionHash;
      try {
        const apiResponse = await fetch('/api/allocate-revenue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            purchaseId: transactionHash,
            totalRevenue: selectedPackage.price,
          }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          console.error('Error allocating revenue:', errorData.message);
          // Optionally send a user notification about allocation error
        } else {
          console.log('Revenue allocation successful');
        }
      } catch (error) {
        console.error('Failed to call revenue allocation API:', error);
      }
    } else {
      console.warn('Transaction hash not found in success response, cannot allocate revenue.');
    }
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
      {/* Purchase Button - Only show when connected */}
      {isConnected ? (
        <button
          onClick={toggleModal}
          className="w-full bg-cyber text-black font-bold py-2 px-4 rounded-lg hover:bg-cyber/80 transition-colors mt-4"
        >
          <span className="flex items-center justify-center gap-2">
            <ImTicket className="w-5 h-5" />
            <span>Buy Game Passes</span>
          </span>
        </button>
      ) : (
        <div className="w-full mt-4 flex justify-center">
          <Wallet className="w-full max-w-xs">
            <ConnectWallet className="w-full justify-center" />
          </Wallet>
        </div>
      )}

      {/* Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 pt-4">
          <div className="bg-[var(--app-card-bg)] rounded-xl p-6 max-w-md w-full mx-0">            
            {/* Package Selection */}
            <div className="grid gap-2 mb-4">
              {GAME_PASS_PRICING.map((pkg) => {
                const passesText = pkg.passes === 1 ? '1 Game Pass' : `${pkg.passes} Game Passes`;
                return (
                <div 
                  key={pkg.passes}
                  className={`border-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedPackage.passes === pkg.passes 
                      ? "border-cyber bg-cyber/10" 
                      : "border-gray-700 hover:border-cyber/50"
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{passesText}</span>
                    <span className="text-right">
                      <span className="font-medium">{pkg.price}</span>
                      <span className="text-xs ml-1">GLICO</span>
                    </span>
                  </div>
                  {pkg.passes > 1 && (
                    <div className="text-right text-[10px] text-green-400">
                      {pkg.passes === 3 ? "20% discount" : "30% discount"}
                    </div>
                  )}
                </div>
              )})}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              {/* Cancel Button */}
              <button
                onClick={toggleModal}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-600 text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors h-[42px]"
                aria-label="Cancel"
              >
                <Icon name="x-circle" className="w-5 h-5" />
                <span>Cancel</span>
              </button>
              
              {/* Purchase Button */}
              {isConnected ? (
                <Transaction
                  calls={tokenTransferCall}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  resetAfter={0}
                  className="flex-1"
                >
                  <div className="w-full">
                    <TransactionButton
                      className="w-full bg-cyber text-black font-bold py-2 px-4 rounded-lg hover:bg-cyber/80 transition-colors"
                      text={
                        <div className="flex items-center justify-center gap-2">
                          <Icon name="shopping-cart" className="w-5 h-5" />
                          <span>Purchase</span>
                        </div>
                      }
                    />
                  </div>
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
                <div className="flex-1">
                  <Wallet>
                    <ConnectWallet className="w-full justify-center" />
                  </Wallet>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
