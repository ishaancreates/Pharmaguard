"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GenomeMap from "@/components/genome-map/GenomeMap";

export default function GenomeMapPage() {
    const router = useRouter();
    const [data, setData] = useState(null);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem("pharmaguard_results");
            if (!raw) {
                router.replace("/");
                return;
            }
            setData(JSON.parse(raw));
        } catch {
            router.replace("/");
        }
    }, [router]);

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="flex items-center gap-3 text-[#64748b]">
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading genome map…
                </div>
            </div>
        );
    }

    return <GenomeMap data={data} />;
}
