"use client";
import { useSignals } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/lib/toast";
import { Plus, ChevronDown, Trash2, Check, X } from "lucide-react";

export default function SignalsPage() {
	const { data, isLoading, error, createSignal, deleteSignal } = useSignals();
	const [newName, setNewName] = useState("");
	const [openAdd, setOpenAdd] = useState(false);
	const [confirmName, setConfirmName] = useState<string | null>(null);
	const toast = useToast();

	if (isLoading)
		return (
			<div className="w-full max-w-2xl mx-auto animate-fade-in">
				<div className="bg-card border border-border rounded-xl shadow-card p-6">
					<div className="h-6 w-40 bg-muted rounded animate-pulse mb-4" />
					<div className="space-y-2">
						<div className="h-10 bg-muted rounded animate-pulse" />
						<div className="h-10 bg-muted rounded animate-pulse" />
						<div className="h-10 bg-muted rounded animate-pulse" />
					</div>
				</div>
			</div>
		);
	if (error)
		return (
			<div className="w-full max-w-2xl mx-auto animate-fade-in">
				<div className="bg-card border border-border rounded-xl shadow-card p-6 text-red-300">
					{String(error)}
				</div>
			</div>
		);

	return (
		<div className="w-full max-w-2xl mx-auto animate-fade-in">
			<div className="bg-card border border-border rounded-xl shadow-card p-4 sm:p-6">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-xl font-semibold">Signals</h1>
					<button
						onClick={() => setOpenAdd((v) => !v)}
						className="inline-flex items-center gap-2 px-3 py-2 rounded bg-accent/10 hover:bg-accent/20 text-accent transition"
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
					className={`overflow-hidden transition-all ${
						openAdd
							? "max-h-28 opacity-100 translate-y-0"
							: "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
					}`}
				>
					<div className="flex gap-2 mb-3">
						<input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder="New signal name"
							className="bg-muted border border-border/70 rounded px-3 py-2 w-full"
						/>
						<button
							onClick={() => {
								if (newName.trim()) {
									createSignal.mutate(
										{ name: newName.trim(), actions: [] },
										{
											onSuccess: () => {
												toast.push("Signal created", "success");
												setNewName("");
												setOpenAdd(false);
											},
											onError: () => toast.push("Create failed", "error"),
										}
									);
								}
							}}
							disabled={!newName.trim()}
							className="px-3 py-2 rounded bg-accent/20 hover:bg-accent/30 text-accent disabled:opacity-50 disabled:cursor-not-allowed transition"
						>
							Create
						</button>
					</div>
				</div>
				{(data?.signals?.length ?? 0) === 0 ? (
					<div className="text-subtext text-sm mb-3">No signals yet</div>
				) : (
					<ul className="divide-y divide-border/60 mb-4">
						{data?.signals.map((s) => (
							<li
								key={s.name}
								className="flex items-center justify-between py-2"
							>
								<Link
									href={`/signals/${encodeURIComponent(s.name)}`}
									className="px-2 py-1 rounded hover:bg-muted/60 transition-colors"
								>
									{s.name}
								</Link>
								{confirmName === s.name ? (
									<div className="flex items-center gap-2">
										<button
											onClick={() => {
												deleteSignal.mutate(s.name, {
													onSuccess: () =>
														toast.push("Signal deleted", "success"),
													onError: () => toast.push("Delete failed", "error"),
												});
												setConfirmName(null);
											}}
											className="inline-flex items-center gap-1 text-red-300 hover:text-red-200"
										>
											<Check className="w-4 h-4" />
											<span>Confirm</span>
										</button>
										<button
											onClick={() => setConfirmName(null)}
											className="inline-flex items-center gap-1 text-subtext hover:text-text"
										>
											<X className="w-4 h-4" />
											<span>Cancel</span>
										</button>
									</div>
								) : (
									<button
										onClick={() => setConfirmName(s.name)}
										className="inline-flex items-center gap-1 text-subtext hover:text-red-400 transition-colors"
									>
										<Trash2 className="w-4 h-4" />
										<span>Delete</span>
									</button>
								)}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
