import type { ReactNode } from "react";

interface SortPillProps {
    active: boolean;
    label: string;
    icon: ReactNode;
    onClick: () => void;
}

export default function SortPill({ active, label, icon, onClick }: SortPillProps) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-semibold whitespace-nowrap transition-all ${
                active
                    ? "border-brand-500 bg-brand-500 text-white shadow-[0_10px_24px_rgba(70,95,255,0.22)] dark:border-brand-400/60 dark:bg-brand-500/90 dark:shadow-[0_14px_30px_rgba(70,95,255,0.2)]"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-[#162033] dark:text-gray-200 dark:hover:border-brand-400/30 dark:hover:bg-[#1b2740]"
            }`}
        >
            <span className={active ? "text-white" : "text-gray-500 dark:text-gray-400"}>{icon}</span>
            <span>{label}</span>
        </button>
    );
}
