"use client";
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";

// Define the transaction interface
interface TokenTransaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  timestamp: number;
  type: "in" | "out";
}

// Note: In a production implementation, you would use the Base Explorer API
// Example: const BASE_EXPLORER_URL = "https://basescan.org";

export const TokenTransactionHistory = ({ tokenAddress }: { tokenAddress: string }) => {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [decimals] = useState(18); // Default to 18 decimals for ERC20

  // Fetch token transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address || !tokenAddress) return;
      
      setIsLoading(true);
      try {
        // In a real implementation, you would call the Base Explorer API
        // For demo purposes, we'll simulate some transactions
        const mockTransactions: TokenTransaction[] = [
          {
            hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            from: "0x0000000000000000000000000000000000000000",
            to: address,
            value: BigInt("1000000000000000000"), // 1 GLICO
            timestamp: Date.now() - 86400000, // 1 day ago
            type: "in"
          },
          {
            hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            from: address,
            to: "0x1111111111111111111111111111111111111111",
            value: BigInt("500000000000000000"), // 0.5 GLICO
            timestamp: Date.now() - 43200000, // 12 hours ago
            type: "out"
          },
          {
            hash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
            from: "0x2222222222222222222222222222222222222222",
            to: address,
            value: BigInt("250000000000000000"), // 0.25 GLICO
            timestamp: Date.now() - 3600000, // 1 hour ago
            type: "in"
          }
        ];
        
        // Sort transactions by timestamp (newest first)
        mockTransactions.sort((a, b) => b.timestamp - a.timestamp);
        
        setTransactions(mockTransactions);
      } catch (error) {
        console.error("Error fetching token transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [address, tokenAddress]);

  if (!address) {
    return <div className="text-center text-sm text-gray-500 mt-2">Connect wallet to view transactions</div>;
  }

  if (isLoading) {
    return <div className="text-center text-sm mt-2">Loading transaction history...</div>;
  }

  if (transactions.length === 0) {
    return <div className="text-center text-sm text-gray-500 mt-2">No transactions found</div>;
  }

  // Format address for display (0x1234...5678)
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Format timestamp to relative time (e.g., "1 hour ago")
  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="w-full mt-4 border-t border-cyber pt-2">
      <h3 className="text-lg font-bold mb-2 text-center">Recent Transactions</h3>
      <div className="max-h-48 overflow-y-auto">
        {transactions.map((tx) => (
          <div 
            key={tx.hash} 
            className="flex items-center justify-between p-2 border-b border-gray-700 hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className={`text-xs font-medium ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'in' ? '↓ Received' : '↑ Sent'}
                </span>
                <span className="text-xs text-gray-400 ml-2">{formatTime(tx.timestamp)}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {tx.type === 'in' 
                  ? `From: ${formatAddress(tx.from)}` 
                  : `To: ${formatAddress(tx.to)}`}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-medium ${tx.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'in' ? '+' : '-'}{formatUnits(tx.value, decimals)} GLICO
              </div>
              <a 
                href={`https://basescan.org/tx/${tx.hash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-cyber hover:underline"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
