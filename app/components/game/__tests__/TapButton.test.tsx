import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TapButton } from "../TapButton";

describe("TapButton", () => {
  it("calls onTap when clicked", () => {
    const onTap = vi.fn();
    render(<TapButton onTap={onTap} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onTap).toHaveBeenCalled();
  });
});
