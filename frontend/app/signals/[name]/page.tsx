"use client";
import { useSignal, useUpdateSignalActions } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Save, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function SignalDetailPage() {
	const params = useParams();
	const name = decodeURIComponent(String(params?.name ?? ""));
	const { data, isLoading, error } = useSignal(name);
	const update = useUpdateSignalActions(name);
	const toast = useToast();

	const [rows, setRows] = useState<{ name: string; bit: number | null }[]>([]);

	// track if saved to lock the UI (must be declared before any early returns)
	const [hasSaved, setHasSaved] = useState(false);

	// sync when data changes
	useEffect(() => {
		if (data?.actions) {
			setRows(
				data.actions.map((a) => ({
					name: (a as any).name as string,
					bit: ((a as any).bit ?? null) as number | null,
				}))
			);
		}
	}, [data?.actions]);

	// focus management refs per row
	const rowRefs = useRef<Array<HTMLInputElement | null>>(
		[] as (HTMLInputElement | null)[]
	);

	const addRow = () => {
		setRows((prev) => [...prev, { name: "", bit: null }]);
		// focus will be applied in effect below
		setTimeout(() => {
			const i = rows.length; // new index after push
			rowRefs.current[i]?.focus();
		}, 0);
	};
	const removeRow = (idx: number) => {
		setRows((prev) => {
			const next = prev.filter((_, i) => i !== idx);
			setTimeout(() => {
				const focusIndex = idx < next.length ? idx : idx - 1;
				if (focusIndex >= 0) rowRefs.current[focusIndex]?.focus();
			}, 0);
			return next;
		});
	};

	const locked =
		hasSaved ||
		(data && Array.isArray(data.actions) && data.actions.length > 0);

	const save = () => {
		// prevent empty names
		const hasEmptyName = rows.some(
			(r) => !r.name || r.name.trim().length === 0
		);
		if (hasEmptyName) {
			toast.push("Please give every action a name before saving.", "error");
			return;
		}
		// client-side unique bit validation
		const seen = new Set<number>();
		for (const r of rows) {
			if (r.bit === null || r.bit === undefined) continue;
			if (seen.has(r.bit)) {
				toast.push(`Duplicate bit ${r.bit}`, "error");
				return;
			}
			seen.add(r.bit);
		}
		update.mutate(
			{
				actions: rows.map((r) => ({ name: r.name.trim(), bit: r.bit ?? null })),
			},
			{
				onSuccess: () => {
					setHasSaved(true);
					toast.push("Saved", "success");
				},
				onError: () => toast.push("Save failed", "error"),
			}
		);
	};

	// Cmd/Ctrl+S to save
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				if (!locked) save();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [locked, rows]);

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
				<div className="text-subtext">Editing</div>
				<div className="text-lg font-semibold">{name}</div>
			</div>
			<div className="flex-1 p-6">
				{isLoading ? (
					<div className="w-full max-w-2xl mx-auto animate-fade-in">
						<div className="bg-card border border-border rounded-xl shadow-card p-6 rainbow-border rainbow-rotate">
							<div className="h-6 w-40 bg-muted rounded animate-pulse mb-4" />
							<div className="space-y-2">
								<div className="h-10 bg-muted rounded animate-pulse" />
								<div className="h-10 bg-muted rounded animate-pulse" />
								<div className="h-10 bg-muted rounded animate-pulse" />
							</div>
						</div>
					</div>
				) : error ? (
					<div className="w-full max-w-2xl mx-auto animate-fade-in">
						<div className="bg-card border border-border rounded-xl shadow-card p-6 text-red-300 rainbow-border rainbow-rotate">
							{String(error)}
						</div>
					</div>
				) : (
					<>
						<div className="flex items-center justify-between mb-4">
							<h2
								className="text-lg font-semibold text-shimmer"
								id="actions-heading"
							>
								Actions
							</h2>
							<button
								onClick={addRow}
								disabled={locked}
								className="inline-flex items-center gap-2 px-3 py-2 rounded bg-accent/20 hover:bg-accent/30 text-accent disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-[1.02]"
							>
								<Plus className="w-4 h-4" />
								<span>Add Action</span>
							</button>
						</div>
						<div className="space-y-2">
							{rows.map((row, idx) => (
								<div
									key={idx}
									className="grid grid-cols-12 gap-2 bg-card border border-border rounded p-3 shadow-card rainbow-border rainbow-rotate"
								>
									<input
										ref={(el) => {
											rowRefs.current[idx] = el;
										}}
										value={row.name}
										onChange={(e) => {
											const v = e.target.value;
											const next = [...rows];
											next[idx].name = v;
											setRows(next);
										}}
										placeholder="action name"
										aria-label={`Action name ${idx + 1}`}
										className={`col-span-7 bg-muted rounded px-2 py-1 focus:outline-none focus:ring-2 ${
											row.name && row.name.trim().length > 0
												? "border border-transparent focus:ring-accent/40"
												: "border border-red-500/50 focus:ring-red-500/40"
										}`}
										disabled={locked}
									/>
									<input
										value={row.bit ?? ""}
										onChange={(e) => {
											const v = e.target.value;
											const num = v === "" ? null : Number(v);
											const next = [...rows];

											next[idx].bit =
												num === null || Number.isFinite(num)
													? (num as any)
													: null;
											setRows(next);
										}}
										placeholder="bit"
										aria-label={`Bit index for action ${idx + 1}`}
										className="col-span-3 bg-muted rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent/40"
										disabled={locked}
									/>
									<button
										onClick={() => removeRow(idx)}
										disabled={locked}
										className="col-span-2 inline-flex items-center justify-center gap-2 text-subtext hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
									>
										<Trash2 className="w-4 h-4" />
										<span>Remove</span>
									</button>
								</div>
							))}
						</div>
						<div className="mt-4">
							<button
								onClick={save}
								disabled={
									locked ||
									rows.some((r) => !r.name || r.name.trim().length === 0)
								}
								className="inline-flex items-center gap-2 px-4 py-2 rounded bg-accent text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{locked ? (
									<span>Saved (locked)</span>
								) : (
									<>
										<Save className="w-4 h-4" />
										<span>Save</span>
									</>
								)}
							</button>
							<div className="text-subtext/80 text-xs mt-2">
								Note: Once you save actions, this signal becomes locked and
								cannot be edited further.
							</div>

							{!locked &&
								rows.some((r) => !r.name || r.name.trim().length === 0) && (
									<div className="text-red-300 text-xs mt-2">
										Fill all action names to enable Save.
									</div>
								)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
