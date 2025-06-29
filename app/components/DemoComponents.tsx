"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { GameEngine } from "./game";
import { FaHome } from "react-icons/fa";
import { UserProfileCard } from "./UserProfileCard";
import { useGame } from "../context/GameContext";

type ButtonProps = {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  icon,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary:
      "bg-accent hover:bg-accent-hover text-[var(--app-background)]",
    secondary:
      "bg-[var(--app-foreground-muted)] hover:bg-accent-light text-[var(--app-background)]",
    outline:
      "border border-accent text-accent bg-transparent hover:bg-accent-light",
    ghost:
      "hover:bg-accent-light text-[var(--app-foreground-muted)]",
  };

  const sizeClasses = {
    sm: "text-xs px-4 py-2 rounded-md h-8 flex items-center justify-center",
    md: "text-sm px-6 py-2.5 rounded-lg h-10 flex items-center justify-center",
    lg: "text-base px-8 py-3 rounded-lg h-12 flex items-center justify-center",
  };

  const isIconOnly = !children && icon;

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        isIconOnly ? 'px-2' : ''
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && (
        <span className={`flex items-center ${!isIconOnly ? 'mr-2' : ''}`}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({
  title,
  children,
  className = "",
  onClick,
}: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border-2 border-cyber overflow-hidden transition-all hover:shadow-xl ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
    >
      {title && (
        <div className="px-5 py-3 border-b border-[var(--app-card-border)]">
          <h3 className="text-lg font-medium text-[var(--app-foreground)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

type FeaturesProps = {
  setActiveTab: (tab: string) => void;
};

export function Features({ setActiveTab }: FeaturesProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Kiss MINT Dash: Tap Runner &apos;99">
        <div className="space-y-4">
          <p className="text-[var(--app-foreground-muted)]">
            <span className="text-accent font-medium">$GLICO</span> is the token for
            Kiss MINT Dash, a tap game where you test how many times you can tap
            in 25 seconds. You get 2 free tries daily, and can buy more with{" "}
            <span className="text-accent font-medium">$GLICO</span> to compete for
            leaderboard prizes.
          </p>
          <p className="text-[var(--app-foreground-muted)]">
          Both leaderboards also feature a <span className="text-cyan-400 font-medium">dynamic prize pool</span>, supplemented by a portion of <span className="text-pink-300 font-medium">Game Pass purchases</span>.
          </p>
          <p className="text-[var(--app-foreground-muted)]">
            <span className="text-accent font-medium">$GLICO</span> is listed on{" "}
            <a
              href="https://mint.club/token/base/GLICO"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Mint.Club
            </a>
          </p>
          <div className="flex justify-center items-center space-x-4 pt-2">
            <a
              href="https://mint.club/token/base/GLICO"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <Image
                src="/mint-logo.webp"
                alt="Mint.Club"
                width={80}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </a>
            <span className="text-2xl">🤝</span>
            <div className="flex-shrink-0 rounded-full overflow-hidden border-2 border-accent">
              <Image
                src="/token.png"
                alt="GLICO Token"
                width={32}
                height={32}
                className="h-8 w-8 object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="How to Play">
        <ul className="space-y-3 mb-4">
          <li className="flex items-start">
            <Icon name="check" className="text-accent mt-1 mr-2 flex-shrink-0" />
            <span className="text-[var(--app-foreground-muted)]">
              Tap Fast. You have{" "}
              <span className="text-pink-300 font-medium">25 seconds</span> on the
              clock.
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-accent mt-1 mr-2 flex-shrink-0" />
            <span className="text-[var(--app-foreground-muted)]">
              You get <span className="text-cyber font-medium">2 free Game Passes</span>{" "}
              to <span className="text-cyan-400 font-medium">Bubble up your Score</span>.
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-accent mt-1 mr-2 flex-shrink-0" />
            <span className="text-[var(--app-foreground-muted)]">
              You can buy more{" "}
              <span className="text-cyber font-medium">Game Passes</span> with{" "}
              <span className="text-accent font-medium">$GLICO</span> to improve your
              score and climb the leaderboards.
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="trophy" className="text-accent mt-1 mr-2 flex-shrink-0" />
            <div className="text-[var(--app-foreground-muted)]">
              <span className="text-[var(--app-foreground)] font-semibold">
                Leaderboard Prizes:
              </span>
              <ul className="space-y-2 mt-1">
                <li className="flex items-start">
                  <Icon name="star" className="text-yellow-400 mt-1 mr-2 flex-shrink-0" />
                  <span>
                    <strong className="text-cyan-400">Daily Leaderboard:</strong> Base prize of{" "}
                    <strong className="text-accent font-medium">50 $GLICO</strong>.
                  </span>
                </li>
                <li className="flex items-start">
                  <Icon name="star" className="text-yellow-400 mt-1 mr-2 flex-shrink-0" />
                  <span>
                    <strong className="text-cyan-400">Weekly Leaderboard:</strong> Base prize of{" "}
                    <strong className="text-accent font-medium">500 $GLICO</strong>.
                  </span>
                </li>
                <li className="flex items-start">
                  <Icon name="star" className="text-yellow-400 mt-1 mr-2 flex-shrink-0" />
                  <span>
                    The total prize pool <span className="text-pink-300 font-medium">(Base Prize + Dynamic Bonus)</span> for each
                    is distributed among the <span className="text-cyan-400 font-medium">Top 5</span>:
                  </span>
                </li>
              </ul>
            </div>
          </li>
        </ul>
        {/* Prize Distribution Table */}
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-center font-semibold text-[var(--app-foreground)]">1st Place</th>
                          <th scope="col" className="px-3 py-2 text-center font-semibold text-[var(--app-foreground)]">2nd Place</th>
                          <th scope="col" className="px-3 py-2 text-center font-semibold text-[var(--app-foreground)]">3rd Place</th>
                          <th scope="col" className="px-3 py-2 text-center font-semibold text-[var(--app-foreground)]">4th Place</th>
                          <th scope="col" className="px-3 py-2 text-center font-semibold text-[var(--app-foreground)]">5th Place</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300 dark:divide-gray-600 bg-[var(--app-background)]">
                        <tr>
                          <td className="whitespace-nowrap px-3 py-2 text-center text-[var(--app-foreground-muted)]"><strong>40%</strong></td>
                          <td className="whitespace-nowrap px-3 py-2 text-center text-[var(--app-foreground-muted)]"><strong>24%</strong></td>
                          <td className="whitespace-nowrap px-3 py-2 text-center text-[var(--app-foreground-muted)]"><strong>16%</strong></td>
                          <td className="whitespace-nowrap px-3 py-2 text-center text-[var(--app-foreground-muted)]"><strong>12%</strong></td>
                          <td className="whitespace-nowrap px-3 py-2 text-center text-[var(--app-foreground-muted)]"><strong>8%</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
        <Button
          variant="outline"
          onClick={() => setActiveTab("home")}
          icon={<FaHome className="w-4 h-4" />}
          aria-label="Back to Home"
          className="p-2"
        />
      </Card>
    </div>
  );
}

export function Home() {
  const { isGameRunning } = useGame();
  
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Tap Runner'99" className="my-8">
        <div className="flex flex-col items-center justify-center">
          <GameEngine />
        </div>
      </Card>

      {!isGameRunning && (
        <Card className="border-4 border-cyber">
          <UserProfileCard />
        </Card>
      )}
    </div>
  );
}

type IconProps = {
  name: "heart" | "star" | "check" | "plus" | "arrow-right" | "gamepad" | "trophy" | "user" | "shopping-cart" | "x-circle";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Icon({ name, size = "md", className = "" }: IconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const icons = {
    user: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>User</title>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    heart: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Heart</title>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    star: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Star</title>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    check: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Check</title>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    plus: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Plus</title>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    "arrow-right": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Arrow Right</title>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    gamepad: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Gamepad</title>
        <rect x="2" y="7" width="20" height="10" rx="5" />
        <circle cx="7" cy="12" r="1.5" />
        <circle cx="17" cy="12" r="1.5" />
        <line x1="12" y1="10" x2="12" y2="14" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    ),
    trophy: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Trophy</title>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
        <path d="M17 9a5 5 0 0 0 5-5" />
        <path d="M7 9a5 5 0 0 1-5-5" />
      </svg>
    ),
    'shopping-cart': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Shopping Cart</title>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    'x-circle': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Close</title>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  };

  const IconComponent = icons[name];
  if (!IconComponent) return null;

  return (
    <span className={`inline-block ${sizeClasses[size]} ${className}`}>
      {IconComponent}
    </span>
  );
}
