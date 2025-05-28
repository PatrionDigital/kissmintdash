"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { LiaEthereum } from 'react-icons/lia';
import { mintclub, wei } from 'mint.club-v2-sdk';
import { useNotification } from '@coinbase/onchainkit/minikit';

interface BuyGlicoButtonProps {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function BuyGlicoButton({ onSuccess, onError }: BuyGlicoButtonProps) {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [amount, setAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const showNotification = useNotification();
  
  useEffect(() => {
    if (walletClient?.account?.address) {
      console.log('Wallet connected:', walletClient.account.address);
      console.log('Mint.Club SDK should automatically detect the connected wallet');
    }
  }, [walletClient]);

  const toggleModal = (): void => {
    if (isPurchasing) {
      return;
    }
    
    setIsOpen(prev => {
      if (!prev) {
        setAmount('');
      }
      return !prev;
    });
  };
  
  // Alias for modal state to match template
  const isModalOpen = isOpen;

  // Mint.Club buy logic for $GLICO
  const handlePurchase = async (): Promise<void> => {
    if (!isConnected || !address) {
      showNotification({
        title: 'Wallet Not Connected',
        body: 'Please connect your wallet first',
      });
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showNotification({
        title: 'Invalid Amount',
        body: 'Please enter a valid amount greater than 0',
      });
      return;
    }
    try {
      setIsPurchasing(true);
      showNotification({
        title: 'Preparing Transaction',
        body: 'Please wait while we prepare your purchase...',
      });
      await mintclub
        .network('base')
        .token('GLICO')
        .buy({
          amount: wei(amount, 18),
          recipient: address,
          // Approval callbacks
          onAllowanceSignatureRequest: () => {
            showNotification({
              title: 'Approve Token Spending',
              body: 'Approve token spending in your wallet',
            });
          },
          onAllowanceSigned: () => {
            showNotification({
              title: 'Approval Submitted',
              body: 'Token approval submitted. Waiting for confirmation...',
            });
          },
          onAllowanceSuccess: () => {
            showNotification({
              title: 'Approval Confirmed',
              body: 'Token spending approved. Proceeding to purchase...',
            });
          },
          // Transaction callbacks
          onSignatureRequest: () => {
            showNotification({
              title: 'Confirm Purchase',
              body: 'Please sign the purchase transaction in your wallet',
            });
          },
          onSigned: () => {
            showNotification({
              title: 'Transaction Submitted',
              body: 'Purchase transaction submitted. Waiting for confirmation...',
            });
          },
          onSuccess: () => {
            showNotification({
              title: 'Purchase Successful!',
              body: `You purchased ${amount} GLICO!`,
            });
            setAmount('');
            toggleModal();
            onSuccess?.();
          },
          onError: () => {
            showNotification({
              title: 'Purchase Failed',
              body: 'Your purchase could not be completed. Please try again.',
            });
            onError?.(new Error('Mint.Club buy failed'));
          },
        });
    } catch (error: unknown) {
      let errorMessage = 'Failed to complete purchase';
      if (error instanceof Error) {
        if (error.message?.toLowerCase().includes('rejected')) {
          errorMessage = 'Transaction was rejected';
        } else if (error.message?.toLowerCase().includes('insufficient')) {
          errorMessage = 'Insufficient funds for transaction';
        } else {
          errorMessage = error.message;
        }
        onError?.(error);
      } else {
        onError?.(new Error('Unknown error occurred'));
      }
      showNotification({
        title: 'Purchase Failed',
        body: errorMessage,
      });
    } finally {
      setIsPurchasing(false);
    }
  };


  return (
    <div className="w-full">
      <a
        href="https://mint.club/token/base/GLICO"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-cyber text-black font-bold py-2 px-4 rounded-lg hover:bg-cyber/80 transition-colors mt-4 flex items-center justify-center gap-2 no-underline"
        style={{ display: 'inline-flex' }}
      >
        <LiaEthereum className="w-7 h-7" />
        <span>Buy $GLICO on Mint.Club</span>
      </a>
    </div>
  );
};

export default BuyGlicoButton;
