import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GameEngine, GameState } from "../GameEngine";

describe("GameEngine", () => {
  it("increments score when TapButton is clicked", () => {
    render(<GameEngine initialGameState={GameState.Running} />);
    const button = screen.getByRole("button", { name: /tap/i });
    fireEvent.click(button);
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
