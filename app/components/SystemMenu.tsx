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
      onClick: () => console.log("Settings clicked"),
    },
    {
      key: "help",
      label: "Help & Support",
      icon: "check",
      onClick: () => console.log("Help clicked"),
    },
  ];

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
            <Button
              key={item.key}
              variant="secondary"
              size="lg"
              className="w-full justify-start"
              icon={<Icon name={item.icon} size="md" />}
              onClick={item.onClick}
            >
              {item.label}
            </Button>
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
