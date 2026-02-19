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
      <div className="min-h-screen flex items-center justify-center bg-white/60 backdrop-blur-md">
        <video
          src="/loader.webm"
          autoPlay
          muted
          loop
          playsInline
          className="w-[166px] h-[166px] object-contain"
        />
      </div>
    );
  }

  return <GenomeMap data={data} />;
}
