'use client';

import { useState, useCallback } from 'react';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useAddFrame, useMiniKit } from '@coinbase/onchainkit/minikit';

type AddAppStatus = {
  type: 'success' | 'error' | null;
  message: string;
};

export default function AddMiniApp() {
  const addFrame = useAddFrame();
  const { isFrameReady } = useMiniKit();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<AddAppStatus>({ type: null, message: '' });
  const [isInstalled, setIsInstalled] = useState(false);

  const handleAddToFarcaster = useCallback(async () => {
    if (isLoading || !isFrameReady) {
      console.warn('AddMiniApp: Attempted to add frame but isLoading or !isFrameReady.');
      setStatus({
        type: 'error',
        message: !isFrameReady ? 'Farcaster MiniKit not ready. Please try again shortly.' : 'Previous operation in progress.'
      });
      setIsLoading(false); // Ensure loading is reset if it was true
      return;
    }
    
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      // Use the Farcaster SDK to add the app
      // Note: This will open the Farcaster client's app installation flow
      const result = await addFrame();
      if (!result || !result.url) { // Check if result or result.url is undefined/null
        throw new Error('Failed to initiate add app process or no URL returned.');
      }
      
      setStatus({ 
        type: 'success', 
        message: 'Follow the prompts in your Farcaster client to add the app.' 
      });
      
      // Set as installed optimistically since we can't actually check
      setIsInstalled(true);
    } catch (error) {
      console.error('Failed to add app to Farcaster:', error);
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to add app to Farcaster' 
      });
    } finally {
      setIsLoading(false);
      
      // Clear status after 5 seconds
      const timer = setTimeout(() => {
        setStatus(prev => ({ ...prev, message: '' }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, addFrame, isFrameReady]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Add to Farcaster</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isInstalled 
              ? 'App is installed in your Farcaster client' 
              : 'Add this app for quick access'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddToFarcaster}
          disabled={isLoading || isInstalled || !isFrameReady}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            isInstalled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-pink-600 hover:bg-pink-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isInstalled ? (
            <>
              <FaCheckCircle className="mr-2 h-4 w-4" />
              Installed
            </>
          ) : (
            <>
              <i className="fc fc-square-farcaster mr-2 text-lg"></i>
              {isLoading ? 'Adding...' : 'Add MiniApp'}
            </>
          )}
        </button>
      </div>

      {status.message && (
        <div className={`p-3 rounded-md ${
          status.type === 'error' 
            ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
            : 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {status.type === 'error' ? (
                <FaExclamationTriangle className="h-5 w-5" aria-hidden="true" />
              ) : status.type === 'success' ? (
                <FaCheckCircle className="h-5 w-5" aria-hidden="true" />
              ) : null}
            </div>
            <div className="ml-3">
              <p className="text-sm">{status.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
