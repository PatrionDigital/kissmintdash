import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GameTimer } from "../GameTimer";

describe("GameTimer", () => {
  it("renders with the correct duration", () => {
    render(<GameTimer duration={10} onComplete={() => {}} running={false} />);
    expect(screen.getByText(/Timer: 10s/)).toBeInTheDocument();
  });
});
