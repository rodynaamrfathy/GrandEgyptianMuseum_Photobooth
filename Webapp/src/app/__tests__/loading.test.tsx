import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Loading from "../loading";

jest.mock("../../lib/i18n", () => ({}));

jest.mock("../components/LoadingState", () => {
  return function MockLoadingState() {
    return <div data-testid="loading-state" />;
  };
});

describe("Loading page", () => {
  it("renders the LoadingState component", () => {
    render(<Loading />);
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
  });

  it("uses the app background and is full screen", () => {
    const { container } = render(<Loading />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("min-h-screen");
    expect(wrapper).toHaveClass("app-bg-dark");
  });
});
