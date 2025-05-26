"use client";

import { type ReactNode, useCallback, useMemo, useState } from "react";
import { GameEngine } from "./game";
import { UserProfileCard } from "./UserProfileCard";
import { useAccount } from "wagmi";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionError,
  TransactionResponse,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionStatus,
} from "@coinbase/onchainkit/transaction";
import { useNotification } from "@coinbase/onchainkit/minikit";

type ButtonProps = {
  children: ReactNode;
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
    sm: "text-xs px-2.5 py-1.5 rounded-md",
    md: "text-sm px-4 py-2 rounded-lg",
    lg: "text-base px-6 py-3 rounded-lg",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center mr-2">{icon}</span>}
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
      <Card title="Key Features">
        <ul className="space-y-3 mb-4">
          <li className="flex items-start">
            <Icon name="check" className="text-accent mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              Minimalistic and beautiful UI design
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-accent mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              Responsive layout for all devices
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-accent mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              Dark mode support
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-accent mt-1 mr-2" />
            <span className="text-[var(--app-foreground-muted)]">
              OnchainKit integration
            </span>
          </li>
        </ul>
        <Button variant="outline" onClick={() => setActiveTab("home")}>
          Back to Home
        </Button>
      </Card>
    </div>
  );
}

type HomeProps = {
  setActiveTab: (tab: string) => void;
};

export function Home({ setActiveTab }: HomeProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="User Profile" className="border-4 border-cyber">
        <UserProfileCard />
      </Card>

      <Card title="Tap Dash'99" className="my-8">
        <div className="flex flex-col items-center justify-center">
          <GameEngine />
        </div>
      </Card>

      <Card title="Game Menu">
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => setActiveTab("leaderboard")}
            icon={<Icon name="trophy" size="sm" />}
            variant="primary"
          >
            Leaderboard
          </Button>
          <Button
            onClick={() => setActiveTab("features")}
            icon={<Icon name="star" size="sm" />}
            variant="primary"
          >
            Features
          </Button>
        </div>
      </Card>

      <TodoList />

      <TransactionCard />
    </div>
  );
}

type IconProps = {
  name: "heart" | "star" | "check" | "plus" | "arrow-right" | "gamepad" | "trophy";
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
  };

  return (
    <span className={`inline-block ${sizeClasses[size]} ${className}`}>
      {icons[name]}
    </span>
  );
}

type Todo = {
  id: number;
  text: string;
  completed: boolean;
}

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Learn about MiniKit", completed: false },
    { id: 2, text: "Build a Mini App", completed: true },
    { id: 3, text: "Deploy to Base and go viral", completed: false },
  ]);
  const [newTodo, setNewTodo] = useState("");

  const addTodo = () => {
    if (newTodo.trim() === "") return;

    const newId =
      todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
    setTodos([...todos, { id: newId, text: newTodo, completed: false }]);
    setNewTodo("");
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  return (
    <Card title="Get started">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 rounded border border-bubblegum text-bubblegum focus:outline-none focus:ring-2 focus:ring-bubblegum placeholder:text-bubblegum/60"
            placeholder="Add a new todo..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            variant="primary"
            size="md"
            onClick={addTodo}
            icon={<Icon name="plus" size="sm" />}
          >
            Add
          </Button>
        </div>

        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id={`todo-${todo.id}`}
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="mr-2 accent-bubblegum border-bubblegum focus:ring-2 focus:ring-bubblegum"
                />
                {todo.completed && (
                  <Icon
                    name="check"
                    size="sm"
                    className="text-[var(--app-background)]"
                  />
                )}
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={`text-[var(--app-foreground-muted)] cursor-pointer ${todo.completed ? "line-through opacity-70" : ""}`}
                >
                  {todo.text}
                </label>
              </div>
              <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                className="text-[var(--app-foreground-muted)] hover:text-accent"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}


function TransactionCard() {
  const { address } = useAccount();

  // Example transaction call - sending 0 ETH to self
  const calls = useMemo(() => address
    ? [
        {
          to: address,
          data: "0x" as `0x${string}`,
          value: BigInt(0),
        },
      ]
    : [], [address]);

  const sendNotification = useNotification();

  const handleSuccess = useCallback(async (response: TransactionResponse) => {
    const transactionHash = response.transactionReceipts[0].transactionHash;

    console.log(`Transaction successful: ${transactionHash}`);

    await sendNotification({
      title: "Congratulations!",
      body: `You sent your a transaction, ${transactionHash}!`,
    });
  }, [sendNotification]);

  return (
    <Card title="Make Your First Transaction">
      <div className="space-y-4">
        <p className="text-[var(--app-foreground-muted)] mb-4">
          Experience the power of seamless sponsored transactions with{" "}
          <a
            href="https://onchainkit.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0052FF] hover:underline"
          >
            OnchainKit
          </a>
          .
        </p>

        <div className="flex flex-col items-center">
          {address ? (
            <Transaction
              calls={calls}
              onSuccess={handleSuccess}
              onError={(error: TransactionError) =>
                console.error("Transaction failed:", error)
              }
            >
              <TransactionButton className="text-white text-md" />
              <TransactionStatus>
                <TransactionStatusAction />
                <TransactionStatusLabel />
              </TransactionStatus>
              <TransactionToast className="mb-4">
                <TransactionToastIcon />
                <TransactionToastLabel />
                <TransactionToastAction />
              </TransactionToast>
            </Transaction>
          ) : (
            <p className="text-yellow-400 text-sm text-center mt-2">
              Connect your wallet to send a transaction
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
