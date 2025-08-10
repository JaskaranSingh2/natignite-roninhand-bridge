"use client";
import { useSignals, useMapping, useAddMapping } from "@/lib/api";
import { comboKey } from "@/lib/types";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Save, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast";

export default function SignalMappingPage() {
	const params = useParams();
	const name = decodeURIComponent(String(params?.name ?? ""));
	const {
		data: signals,
		isLoading: signalsLoading,
		error: signalsError,
	} = useSignals();
	const {
		data: mapping,
		isLoading: mappingLoading,
		error: mappingError,
	} = useMapping();
	const addMapping = useAddMapping();
	const toast = useToast();

	const [localMapping, setLocalMapping] = useState<
		Record<string, string[] | null>
	>({});
	const [hasSaved, setHasSaved] = useState(false);

	const isLoading = signalsLoading || mappingLoading;
	const error = signalsError || mappingError;

	// Get all possible state combinations for this signal
	const signalStates = signals?.[name] || [];
	const otherSignals = Object.entries(signals || {}).filter(
		([key]) => key !== name
	);

	const combinations: Array<[string, string]> = [];
	if (signalStates.length > 0 && otherSignals.length > 0) {
		// For each state of this signal, pair with states of other signals
		for (const thisState of signalStates) {
			for (const [otherSignalName, otherStates] of otherSignals) {
				for (const otherState of otherStates) {
					combinations.push([thisState, otherState]);
				}
			}
		}
	}

	// Sync local mapping with server data
	useEffect(() => {
		if (mapping) {
			setLocalMapping({ ...mapping });
		}
	}, [mapping]);

	const updateMapping = (combo: [string, string], actions: string[] | null) => {
		const key = comboKey(combo);
		setLocalMapping((prev) => ({
			...prev,
			[key]: actions,
		}));
	};

	const saveMapping = (combo: [string, string]) => {
		const key = comboKey(combo);
		const actions = localMapping[key];

		addMapping.mutate(
			{ signal: key, mapsto: actions },
			{
				onSuccess: () => {
					toast.push("Mapping saved", "success");
					setHasSaved(true);
				},
				onError: () => toast.push("Save failed", "error"),
			}
		);
	};

	if (isLoading)
		return (
			<div className="flex w-full animate-fade-in">
				<div className="w-80 border-r border-border p-4 space-y-3">
					<Link
						href="/signals"
						className="inline-flex items-center gap-2 text-subtext hover:text-white transition"
					>
						<ArrowLeft className="w-4 h-4" />
						<span>Back</span>
					</Link>
					<div className="text-subtext">Editing Mappings</div>
					<div className="text-lg font-semibold">{name}</div>
				</div>
				<div className="flex-1 p-6">
					<div className="w-full max-w-2xl mx-auto animate-fade-in">
						<div className="rainbow-border">
							<div className="bg-card border border-border rounded-xl shadow-card p-6">
								<div className="h-6 w-40 bg-muted rounded animate-pulse mb-4 text-shimmer">
									Loading...
								</div>
								<div className="space-y-2">
									<div className="h-10 bg-muted rounded animate-pulse" />
									<div className="h-10 bg-muted rounded animate-pulse" />
									<div className="h-10 bg-muted rounded animate-pulse" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);

	if (error)
		return (
			<div className="flex w-full animate-fade-in">
				<div className="w-80 border-r border-border p-4 space-y-3">
					<Link
						href="/signals"
						className="inline-flex items-center gap-2 text-subtext hover:text-white transition"
					>
						<ArrowLeft className="w-4 h-4" />
						<span>Back</span>
					</Link>
					<div className="text-subtext">Editing Mappings</div>
					<div className="text-lg font-semibold">{name}</div>
				</div>
				<div className="flex-1 p-6">
					<div className="w-full max-w-2xl mx-auto animate-fade-in">
						<div className="rainbow-border">
							<div className="bg-card border border-border rounded-xl shadow-card p-6 text-red-300">
								{String(error)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);

	return (
		<div className="flex w-full animate-fade-in">
			<div className="w-80 border-r border-border p-4 space-y-3">
				<Link
					href="/signals"
					className="inline-flex items-center gap-2 text-subtext hover:text-white transition hover:scale-[1.02]"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>Back</span>
				</Link>
				<div className="text-subtext">Editing Mappings</div>
				<div className="text-lg font-semibold">{name}</div>
			</div>
			<div className="flex-1 p-6">
				<div className="w-full max-w-2xl mx-auto">
					<div className="rainbow-border">
						<div className="bg-card border border-border rounded-xl shadow-card p-6">
							<h2
								className="text-lg font-semibold text-shimmer mb-4"
								id="mappings-heading"
							>
								State Combinations for {name}
							</h2>

							{combinations.length === 0 ? (
								<div className="text-subtext text-sm">
									No state combinations available. Add more signals to create
									mappings.
								</div>
							) : (
								<div className="space-y-4">
									{combinations.map((combo) => {
										const key = comboKey(combo);
										const currentActions = localMapping[key] || null;
										const [state1, state2] = combo;

										return (
											<div
												key={key}
												className="bg-card border-2 border-accent/20 hover:border-accent/40 rounded-lg p-4 space-y-3 shadow-sm hover:shadow-md transition-all duration-200"
											>
												<div className="flex items-center justify-between">
													<div className="font-medium text-accent">
														{state1} + {state2}
													</div>
													<div className="text-sm text-subtext">Key: {key}</div>
												</div>

												<div className="space-y-2">
													<label className="text-sm font-medium">
														Actions (comma-separated):
													</label>
													<input
														type="text"
														value={
															currentActions ? currentActions.join(", ") : ""
														}
														onChange={(e) => {
															const value = e.target.value.trim();
															const actions = value
																? value
																		.split(",")
																		.map((s) => s.trim())
																		.filter(Boolean)
																: null;
															updateMapping(combo, actions);
														}}
														placeholder="e.g., hello, mate (or leave empty for null)"
														className="w-full bg-muted border border-border/70 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
														aria-label={`Actions for ${key}`}
													/>
												</div>

												<div className="flex items-center justify-between">
													<button
														onClick={() => updateMapping(combo, null)}
														className="text-sm text-subtext hover:text-red-400 transition-colors hover:scale-[1.02]"
													>
														Set to null
													</button>
													<button
														onClick={() => saveMapping(combo)}
														className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-black font-medium hover:bg-accent/90 transition hover:scale-[1.02] shadow-sm"
													>
														<Save className="w-4 h-4" />
														<span>Save</span>
													</button>
												</div>
											</div>
										);
									})}
								</div>
							)}

							{/* Save disclaimer */}
							<div
								className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 text-yellow-200 text-sm mt-4"
								role="note"
								aria-live="polite"
							>
								<strong>⚠️ Note:</strong> Once actions are saved, this signal
								becomes locked. To change it later, delete the signal and
								recreate it.
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
