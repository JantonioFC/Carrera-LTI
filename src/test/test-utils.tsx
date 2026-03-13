import { type RenderOptions, render } from "@testing-library/react";
import type React from "react";
import type { ReactElement } from "react";
import { SubjectDataProvider } from "../hooks/useSubjectData";

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
	return <SubjectDataProvider>{children}</SubjectDataProvider>;
};

const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
