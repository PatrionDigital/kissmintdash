import '@testing-library/jest-dom';
import { render, screen } from "@testing-library/react";
import { GameTimer } from "../GameTimer";

describe("GameTimer", () => {
  it("renders with the correct duration", () => {
    render(<GameTimer duration={10} onComplete={() => {}} running={false} />);
    expect(screen.getByText(/Timer: 10s/)).toBeInTheDocument();
  });
});
