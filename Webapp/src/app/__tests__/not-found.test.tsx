import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import NotFound from "../not-found";

jest.mock("../../lib/i18n", () => ({}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

describe("NotFound page", () => {
  it("renders the 404 status code", () => {
    render(<NotFound />);
    expect(screen.getByLabelText("notFound.title")).toHaveTextContent("notFound.title");
    expect(screen.getByText("notFound.title")).toBeInTheDocument();
  });

  it("renders the heading and message", () => {
    render(<NotFound />);
    expect(screen.getByText("notFound.heading")).toBeInTheDocument();
    expect(screen.getByText("notFound.message")).toBeInTheDocument();
  });

  it("renders a link back to home", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: "notFound.back" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("uses the app background and is full screen", () => {
    const { container } = render(<NotFound />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("min-h-screen");
    expect(wrapper).toHaveClass("app-bg-dark");
  });
});
