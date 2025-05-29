'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { sdk } from '@farcaster/frame-sdk';

type NotificationStatus = {
  type: 'success' | 'error' | null;
  message: string;
};

export default function Notifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<NotificationStatus>({ type: null, message: '' });

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      if (isEnabled) {
        // Disable notifications
        setIsEnabled(false);
        setStatus({ type: 'success', message: 'Notifications disabled' });
      } else {
        // Request notification permission
        const permission = await Notification.requestPermission();
        const enabled = permission === 'granted';
        setIsEnabled(enabled);
        
        if (enabled) {
          setStatus({ type: 'success', message: 'Notifications enabled!' });
        } else {
          setStatus({ 
            type: 'error', 
            message: 'Please enable notifications in your browser settings' 
          });
        }
      }
    } catch (error) {
      console.error('Failed to update notification settings', error);
      setStatus({ 
        type: 'error', 
        message: 'Failed to update notification settings. Please try again.' 
      });
    } finally {
      setIsLoading(false);
      
      // Clear status after 3 seconds
      const timer = setTimeout(() => {
        setStatus(prev => ({ ...prev, message: '' }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isEnabled, isLoading]);

  const sendTestNotification = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      if (Notification.permission !== 'granted') {
        throw new Error('Please enable notifications first');
      }

      // Use Farcaster SDK to send a test cast
      await sdk.actions.composeCast({
        text: 'Test notification from your app!',
        embeds: [],
      });

      setStatus({ 
        type: 'success', 
        message: 'Test notification sent! Check your Farcaster client.'
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send test notification' 
      });
    } finally {
      setIsLoading(false);
      
      // Clear status after 3 seconds
      const timer = setTimeout(() => {
        setStatus(prev => ({ ...prev, message: '' }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Push Notifications
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleNotifications}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
            isEnabled ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>

      {status.message && (
        <div 
          className={`flex items-center space-x-2 p-2 text-sm rounded-md ${
            status.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {status.type === 'success' ? (
            <FaCheckCircle className="flex-shrink-0" />
          ) : (
            <FaExclamationTriangle className="flex-shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {isEnabled && (
        <div className="space-y-3 pl-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Test Notification
            </span>
            <button
              type="button"
              onClick={sendTestNotification}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Test'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Send a test notification to verify your settings
          </p>
        </div>
      )}
    </div>
  );
}
