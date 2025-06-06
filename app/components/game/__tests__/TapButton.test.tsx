import { render, screen, fireEvent } from "@testing-library/react";
import { TapButton } from "../TapButton";

// Mock console.log to prevent console output during tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe("TapButton", () => {
  it("calls onTap when clicked", () => {
    const onTap = jest.fn();
    render(<TapButton onTap={onTap} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onTap).toHaveBeenCalled();
  });
});
