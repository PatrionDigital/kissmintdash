"use client";
import React, { useState } from "react";
import { Card, Button, Icon } from "./DemoComponents";
import { useMiniKit, useViewProfile } from "@coinbase/onchainkit/minikit";
import { FaUserNinja, FaHome, FaMusic, FaCog, FaUser, FaQuestionCircle, FaTimes, FaChevronLeft, FaMoon, FaSun, FaBell, FaPlusCircle } from "react-icons/fa";
import { IoSpeedometer } from "react-icons/io5";
import { BiSupport } from "react-icons/bi";
import AudioPlayer from "./AudioPlayer";
import Notifications from "./Notifications";
import AddMiniApp from "./AddMiniApp";

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

export type SystemMenuProps = {
  setActiveTab: (tab: string) => void;
};

const SystemMenu: React.FC<SystemMenuProps> = ({ setActiveTab }) => {
  // State and hooks
  const viewProfile = useViewProfile();
  const { context } = useMiniKit();
  const farcasterUsername = context?.user?.username;
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    soundEffects: true,
    music: true,
    notifications: true,
    theme: 'system',
    animationSpeed: 'medium',
  });

  // Menu items
  const menuItems: MenuItem[] = [
    {
      key: "profile",
      label: "Profile",
      icon: <FaUserNinja className="w-5 h-5" />,
      onClick: () => setActivePanel(activePanel === 'profile' ? null : 'profile'),
    },
    {
      key: "settings",
      label: "Settings",
      icon: <IoSpeedometer className="w-5 h-5" />,
      onClick: () => setActivePanel(activePanel === 'settings' ? null : 'settings'),
    },
    {
      key: "help",
      label: "Help & Support",
      icon: <BiSupport className="w-5 h-5" />,
      onClick: () => setActivePanel(activePanel === 'help' ? null : 'help'),
    },
  ];

  // Settings handlers
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    console.log('Saving settings:', settings);
    setActivePanel(null);
  };

  // FAQ handlers
  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // FAQ data
  const faqs = [
    {
      id: 'what-is-kissmint-dash',
      question: 'What is Kiss MINT Dash?',
      answer: "In a world where taps determine destiny, only the fastest fingers survive. KISSMINT DASH brings the adrenaline rush of the Running Man to your fingertips with a sweet twist! Compete daily for the highest score, build your $GLICO empire, and claim your spot on the leaderboard. Remember - in this game, you're either tapping or you're history! Fresh, fast, and dangerously addictive."
    },
    {
      id: 'how-to-play',
      question: 'How do I start Playing?',
      answer: "Press 'Start Game' and wait for the count down time to start. You have 25 seconds to tap the green button as many times as you can. Place on the Leaderboard and you could win prizes of $GLICO tokens."
    },
    {
      id: 'what-is-glico',
      question: 'What is $GLICO?',
      answer: "$GLICO is the ticker for Kiss MINT, a token created on [Mint.Club](https://mint.club/token/base/GLICO) and a child-token of Mint.Club's $MT token.\nYou can use $GLICO to buy extra Game Passes to play Kiss MINT Dash."
    },
    {
      id: 'troubleshooting',
      question: "I'm having technical issues..",
      answer: "Try refreshing the app by clicking the elipsis menu (...) in the top right corner, and selecting \"Refresh\" in the menu."
    }
  ];

  // Render functions
  const renderSettingsPanel = () => (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Settings</h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaMusic className="w-5 h-5 text-pink-500" />
            <span className="font-medium">Background Music</span>
          </div>
          <AudioPlayer />
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <FaBell className="w-5 h-5 text-pink-500" />
            <span className="font-medium">Notifications</span>
          </div>
          <div className="pl-2">
            <Notifications />
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <FaPlusCircle className="w-5 h-5 text-pink-500" />
          <span className="font-medium">Farcaster Integration</span>
        </div>
        <div className="pl-2 mb-6">
          <AddMiniApp />
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-6">
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
    </div>
  );

  const renderProfilePanel = () => {
    const user = context?.user;
    const displayName = user?.displayName || 'Anonymous User';
    const username = user?.username;
    const pfpUrl = user?.pfpUrl;
    const fid = user?.fid;

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Profile</h3>
        
        <div className="space-y-6">
          {/* Profile Info */}
          <div className="flex flex-col items-center">
            {pfpUrl ? (
              <img 
                src={pfpUrl} 
                alt={displayName}
                className="w-16 h-16 rounded-full mb-3 border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 mb-3 flex items-center justify-center">
                <span className="text-2xl text-gray-700 dark:text-gray-200">
                  {displayName[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              {displayName}
            </h4>
            {username && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{username}
              </p>
            )}
          </div>

          {/* Farcaster Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              icon={
                <span className="flex items-center justify-center mr-2">
                  <i className="fc fc-square-farcaster text-lg"></i>
                </span>
              }
              onClick={viewProfile}
            >
              Open Farcaster Profile
            </Button>
          </div>

          {/* Additional Info */}
          <div className="space-y-3 text-sm">
            {fid && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Farcaster ID:</span>
                <span className="font-mono">#{fid}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
              href="mailto:psd@patrion.xyz"
              className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email: psd@patrion.xyz
            </a>
            <a
              href="https://twitter.com/patriondigital"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
              @patriondigital
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
                icon={item.icon}
                onClick={item.onClick}
              >
                {item.label}
              </Button>
              {activePanel === item.key && item.key === 'profile' && renderProfilePanel()}
              {activePanel === item.key && item.key === 'settings' && renderSettingsPanel()}
              {activePanel === item.key && item.key === 'help' && renderHelpSupportPanel()}
            </React.Fragment>
          ))}
          
          <Button 
            variant="outline" 
            onClick={() => setActiveTab("home")}
            icon={<FaHome className="w-4 h-4" />}
            aria-label="Back to Home"
            className="p-2 justify-start"
          />
        </div>
      </Card>
    </div>
  );
};

export default SystemMenu;
