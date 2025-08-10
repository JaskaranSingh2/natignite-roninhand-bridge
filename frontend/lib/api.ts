import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { SignalsZ, MappingZ, type Signals, type Mapping } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:7001";

async function get<T>(path: string, schema: z.ZodSchema<T>): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
	const json = await res.json();
	const parsed = schema.parse(json);
	return parsed;
}

async function post<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
	return res.json();
}

// API functions for the new data format
export function useSignals() {
	const qc = useQueryClient();

	const q = useQuery({
		queryKey: ["signals"],
		queryFn: () => get("/signals", SignalsZ),
	});

	return q;
}

export function useMapping() {
	const qc = useQueryClient();

	const q = useQuery({
		queryKey: ["mapping"],
		queryFn: () => get("/mapping", MappingZ),
	});

	return q;
}

// Error for missing POST endpoints - the API doesn't support full file updates
export function usePostSignals() {
	return useMutation({
		mutationFn: () => {
			throw new Error(
				"Missing endpoint: api.py does not expose POST /signals for full file updates. Available endpoints: POST /add_signal, POST /remove_signal"
			);
		},
	});
}

export function usePostMapping() {
	return useMutation({
		mutationFn: () => {
			throw new Error(
				"Missing endpoint: api.py does not expose POST /mapping for full file updates. Available endpoint: POST /add_mapping"
			);
		},
	});
}

// Legacy support for current API endpoints (these work with the existing API)
export function useAddSignal() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: { signal: string; signal_types: string[] }) =>
			post("/add_signal", payload),
		onSuccess: (data, variables, context) => {
			// Always invalidate queries when mutation succeeds
			qc.invalidateQueries({ queryKey: ["signals"] });
			qc.invalidateQueries({ queryKey: ["mapping"] });
		},
		onSettled: () => {
			// Ensure queries are refetched even if there's an error
			qc.invalidateQueries({ queryKey: ["signals"] });
			qc.invalidateQueries({ queryKey: ["mapping"] });
		},
	});
}

export function useRemoveSignal() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (signal: string) => post("/remove_signal", { signal }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["signals"] });
			qc.invalidateQueries({ queryKey: ["mapping"] });
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: ["signals"] });
			qc.invalidateQueries({ queryKey: ["mapping"] });
		},
	});
}

export function useAddMapping() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: { signal: string; mapsto: string[] | null }) =>
			post("/add_mapping", payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["mapping"] });
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: ["mapping"] });
		},
	});
}
