"use client";
import React, { useState } from "react";
import { Card, Button, Icon } from "./DemoComponents";
import { useMiniKit, useViewProfile } from "@coinbase/onchainkit/minikit";

type MenuItem = {
  key: string;
  label: string;
  icon: 'user' | 'heart' | 'star' | 'check' | 'plus' | 'arrow-right' | 'gamepad' | 'trophy' | 'shopping-cart' | 'x-circle';
  onClick: () => void;
};

export type SystemMenuProps = {
  setActiveTab: (tab: string) => void;
};

export const SystemMenu: React.FC<SystemMenuProps> = ({ setActiveTab }) => {
  const viewProfile = useViewProfile();
  const { context } = useMiniKit();
  const farcasterUsername = context?.user?.username;
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    {
      key: "profile",
      label: "Profile",
      icon: "user",
      onClick: () => viewProfile(),
    },
    {
      key: "settings",
      label: "Settings",
      icon: "star",
      onClick: () => setActivePanel(activePanel === 'settings' ? null : 'settings'),
    },
    {
      key: "help",
      label: "Help & Support",
      icon: "check",
      onClick: () => setActivePanel(activePanel === 'help' ? null : 'help'),
    },
  ];

  const [settings, setSettings] = useState({
    soundEffects: true,
    music: true,
    notifications: true,
    theme: 'system',
    animationSpeed: 'medium',
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // In a real app, you would save these settings to a database or local storage
    console.log('Saving settings:', settings);
    // Close the settings panel after saving
    setActivePanel(null);
  };

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  
  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };
  
  const faqs = [
    {
      id: 'what-is-kissmint',
      question: 'What is KISS MINT?',
      answer: 'KISS MINT is a fun and interactive platform where you can collect and trade digital assets, participate in games, and connect with other collectors.'
    },
    {
      id: 'how-to-play',
      question: 'How do I start playing?',
      answer: 'To get started, connect your wallet, browse the available collections, and start collecting! Each collection has its own unique mechanics and rewards.'
    },
    {
      id: 'what-is-glico',
      question: 'What is GLICO?',
      answer: 'GLICO is our in-platform currency that you can use to purchase items, participate in special events, and unlock exclusive content.'
    },
    {
      id: 'troubleshooting',
      question: 'I\'m having technical issues. What should I do?',
      answer: 'Try refreshing your browser first. If the issue persists, please contact our support team with details about the problem you\'re experiencing.'
    }
  ];

  const renderSettingsPanel = () => (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Settings</h3>
      
      <div className="space-y-6">
        {/* Sound Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Audio</h4>
          <div className="space-y-4 pl-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Sound Effects</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.soundEffects}
                  onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Background Music</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.music}
                  onChange={(e) => handleSettingChange('music', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Display Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Display</h4>
          <div className="space-y-4 pl-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
              <select 
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Animation Speed</span>
              <select 
                value={settings.animationSpeed}
                onChange={(e) => handleSettingChange('animationSpeed', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Notifications</h4>
          <div className="space-y-4 pl-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => setActivePanel(null)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveSettings}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  const renderHelpSupportPanel = () => (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Help & Support</h3>
      
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Need help?</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            We're here to help! Browse our FAQs or contact our support team for assistance.
          </p>
        </div>

        {/* FAQ Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Frequently Asked Questions</h4>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none flex justify-between items-center"
                >
                  <span>{faq.question}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${expandedFaq === faq.id ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-3 pt-1 bg-white dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Contact Us</h4>
          <div className="space-y-3">
            <a
              href="mailto:support@kissmint.xyz"
              className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@kissmint.xyz
            </a>
            <a
              href="https://twitter.com/kissmint"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
              @kissmint
            </a>
          </div>
        </div>

        {/* Documentation Links */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Documentation</h4>
          <div className="grid grid-cols-1 gap-2">
            <a
              href="#"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Getting Started Guide
            </a>
            <a
              href="#"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              FAQ & Troubleshooting
            </a>
            <a
              href="#"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              API Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="System Menu">
        {farcasterUsername && (
          <div className="text-center mb-4 text-bubblegum font-semibold">
            Signed in as @{farcasterUsername}
          </div>
        )}
        
        <div className="space-y-3">
          {menuItems.map((item) => (
            <React.Fragment key={item.key}>
              <Button
                variant={activePanel === item.key ? 'primary' : 'secondary'}
                size="lg"
                className="w-full justify-start"
                icon={<Icon name={item.icon} size="md" />}
                onClick={item.onClick}
              >
                {item.label}
              </Button>
              {activePanel === item.key && item.key === 'settings' && renderSettingsPanel()}
              {activePanel === item.key && item.key === 'help' && renderHelpSupportPanel()}
            </React.Fragment>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-start">
          <Button 
            variant="outline" 
            onClick={() => setActiveTab("home")}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            }
            aria-label="Back to Home"
            className="p-2"
          />
        </div>
      </Card>
    </div>
  );
};

export default SystemMenu;
