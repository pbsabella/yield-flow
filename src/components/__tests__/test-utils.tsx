import { render } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export function renderWithProviders(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}
