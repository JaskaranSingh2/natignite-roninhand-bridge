"use client";
import {
	useSignals,
	useMapping,
	useAddSignal,
	useRemoveSignal,
} from "@/lib/api";
import { comboKey } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/lib/toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronDown, Trash2, Check, X } from "lucide-react";

export default function SignalsPage() {
	const { data: signals, isLoading, error } = useSignals();
	const { data: mapping } = useMapping();
	const addSignal = useAddSignal();
	const removeSignal = useRemoveSignal();
	const queryClient = useQueryClient();
	const [newName, setNewName] = useState("");
	const [newFeature, setNewFeature] = useState("");
	const [newStates, setNewStates] = useState("");
	const [openAdd, setOpenAdd] = useState(false);
	const [confirmName, setConfirmName] = useState<string | null>(null);
	const toast = useToast();

	if (isLoading)
		return (
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
		);

	if (error)
		return (
			<div className="w-full max-w-2xl mx-auto animate-fade-in">
				<div className="rainbow-border">
					<div className="bg-card border border-border rounded-xl shadow-card p-6 text-red-300">
						{String(error)}
					</div>
				</div>
			</div>
		);

	return (
		<div className="w-full max-w-2xl mx-auto animate-fade-in">
			<div className="rainbow-border">
				<div className="bg-card border border-border rounded-xl shadow-card p-4 sm:p-6">
					<div className="flex items-center justify-between mb-4">
						<h1 className="text-xl font-semibold" id="signals-heading">
							Signals
						</h1>
						<button
							onClick={() => setOpenAdd((v) => !v)}
							className="inline-flex items-center gap-2 px-3 py-2 rounded bg-accent/10 hover:bg-accent/20 text-accent transition hover:scale-[1.02]"
						>
							<Plus className="w-4 h-4" />
							<span>New Signal</span>
							<ChevronDown
								className={`w-4 h-4 transition-transform ${
									openAdd ? "rotate-180" : "rotate-0"
								}`}
							/>
						</button>
					</div>
					<div
						className={`overflow-hidden transition-all duration-300 ${
							openAdd
								? "max-h-80 opacity-100 translate-y-0"
								: "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
						}`}
					>
						<div className="space-y-2 mb-3">
							<input
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								placeholder="Signal name (e.g., bite)"
								className="bg-muted border border-border/70 rounded px-3 py-2 w-full"
								aria-label="New signal name"
							/>
							<input
								value={newFeature}
								onChange={(e) => setNewFeature(e.target.value)}
								placeholder="Feature description (optional, e.g., clenching, moving up/down, left/right)"
								className="bg-muted border border-border/70 rounded px-3 py-2 w-full"
								aria-label="Feature description"
							/>
							<input
								value={newStates}
								onChange={(e) => setNewStates(e.target.value)}
								placeholder="States (comma-separated, e.g., clenched,open)"
								className="bg-muted border border-border/70 rounded px-3 py-2 w-full"
								aria-label="Signal states"
							/>
							<button
								onClick={() => {
									if (newName.trim() && newStates.trim()) {
										const states = newStates
											.split(",")
											.map((s) => s.trim())
											.filter(Boolean);
										if (states.length > 0) {
											addSignal.mutate(
												{ signal: newName.trim(), signal_types: states },
												{
													onSuccess: () => {
														// Manual cache invalidation to ensure UI updates
														queryClient.invalidateQueries({
															queryKey: ["signals"],
														});
														queryClient.invalidateQueries({
															queryKey: ["mapping"],
														});
														toast.push("Signal created", "success");
														setNewName("");
														setNewFeature("");
														setNewStates("");
														setOpenAdd(false);
													},
													onError: (error) => {
														console.error("Add signal error:", error);
														toast.push("Create failed", "error");
													},
												}
											);
										}
									}
								}}
								disabled={!newName.trim() || !newStates.trim()}
								className="w-full px-3 py-2 rounded bg-accent/20 hover:bg-accent/30 text-accent disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-[1.02]"
							>
								Create Signal
							</button>
						</div>
					</div>
					{!signals || Object.keys(signals).length === 0 ? (
						<div className="text-subtext text-sm mb-3">No signals yet</div>
					) : (
						<div className="space-y-3">
							{Object.entries(signals).map(([signalName, states]) => (
								<div
									key={signalName}
									className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/30 transition-colors"
								>
									<Link
										href={`/signals/${encodeURIComponent(signalName)}`}
										className="flex-1 hover:translate-x-0.5 transition-transform"
									>
										<div className="font-medium">{signalName}</div>
										<div className="text-sm text-subtext">
											States: {states.join(", ")}
										</div>
									</Link>
									{confirmName === signalName ? (
										<div className="flex items-center gap-2">
											<button
												onClick={() => {
													removeSignal.mutate(signalName, {
														onSuccess: () => {
															// Manual cache invalidation to ensure UI updates
															queryClient.invalidateQueries({
																queryKey: ["signals"],
															});
															queryClient.invalidateQueries({
																queryKey: ["mapping"],
															});
															toast.push("Signal deleted", "success");
														},
														onError: () => toast.push("Delete failed", "error"),
													});
													setConfirmName(null);
												}}
												className="inline-flex items-center gap-1 text-red-300 hover:text-red-200 hover:scale-[1.02]"
											>
												<Check className="w-4 h-4" />
												<span>Confirm</span>
											</button>
											<button
												onClick={() => setConfirmName(null)}
												className="inline-flex items-center gap-1 text-subtext hover:text-text hover:scale-[1.02]"
											>
												<X className="w-4 h-4" />
												<span>Cancel</span>
											</button>
										</div>
									) : (
										<button
											onClick={() => setConfirmName(signalName)}
											className="inline-flex items-center gap-1 text-subtext hover:text-red-400 transition-colors hover:scale-[1.02]"
										>
											<Trash2 className="w-4 h-4" />
											<span>Delete</span>
										</button>
									)}
								</div>
							))}
						</div>
					)}

					{/* Save disclaimer */}
					<div
						className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 text-orange-500 text-sm mt-4"
						role="note"
					>
						<strong>⚠️ Note:</strong> Once actions are saved, this signal
						becomes locked. To change it later, delete the signal and recreate
						it.
					</div>
				</div>
			</div>
		</div>
	);
}
