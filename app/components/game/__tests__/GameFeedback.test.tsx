import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GameFeedback } from "../GameFeedback";

describe("GameFeedback", () => {
  it("renders feedback when triggered", () => {
    const { container, rerender } = render(<GameFeedback trigger={false} />);
    expect(container.firstChild).toBeNull();
    rerender(<GameFeedback trigger={true} />);
    expect(container.firstChild).not.toBeNull();
  });
});
