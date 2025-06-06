import '@testing-library/jest-dom';
import { render, screen } from "@testing-library/react";
import { ScoreCounter } from "../ScoreCounter";

describe("ScoreCounter", () => {
  it("renders the score", () => {
    render(<ScoreCounter score={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
