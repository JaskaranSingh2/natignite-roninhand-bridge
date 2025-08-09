import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import React from "react";
import SignalsPage from "@/app/signals/page";

expect.extend(toHaveNoViolations as any);

// Mock data hooks
jest.mock("@/lib/api", () => ({
	useSignals: () => ({
		data: { signals: [{ name: "EEG", actions: [] }] },
		isLoading: false,
		error: null,
		createSignal: { mutate: jest.fn() },
		deleteSignal: { mutate: jest.fn() },
	}),
}));

// Mock toast hook
jest.mock("@/lib/toast", () => ({
	useToast: () => ({
		push: jest.fn(),
	}),
}));

describe("Signals list page a11y", () => {
	it("has no a11y violations", async () => {
		const { container } = render(<SignalsPage />);
		expect(await axe(container)).toHaveNoViolations();
		// sanity
		expect(screen.getByText("Signals")).toBeInTheDocument();
	});
});
