/* eslint-disable react-refresh/only-export-components */
import { type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { I18nProvider } from "@/i18n";

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}

export function renderWithI18n(
  ui: ReactNode,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: Wrapper, ...options });
}
