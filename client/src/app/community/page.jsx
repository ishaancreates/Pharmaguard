"use client";
import { useState } from "react";
import NavBar from "@/components/NavBar";
import TwinFinder from "@/components/community/TwinFinder";
import Feed from "@/components/community/Feed";
import PostComposer from "@/components/community/PostComposer";

export default function CommunityPage() {
  const [refreshFeed, setRefreshFeed] = useState(0);

  const mockProfile = {
    CYP2D6: { diplotype: "*4/*4", phenotype: "PM", variants: ["rs3892097"] },
  };

  const handlePostCreated = () => setRefreshFeed((prev) => prev + 1);

  return (
    <main className="min-h-screen bg-white">
      <NavBar />

      {/* ── Page Header ── */}
      <div className="border-b border-[#a9bb9d]/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="block w-8 h-px bg-[#a9bb9d]" />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#a9bb9d]">
              Patient Network
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] tracking-tight">
            Community
          </h1>
          <p className="text-[#555] mt-2 text-sm max-w-xl leading-relaxed">
            Connect with patients who share your pharmacogenomic profile. Share
            experiences, ask questions, and learn from real-world drug
            responses.
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed column */}
          <div className="lg:col-span-2 space-y-4">
            <PostComposer onPostCreated={handlePostCreated} />
            <Feed refreshTrigger={refreshFeed} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <TwinFinder profile={mockProfile} />
            <div className="bg-[#a9bb9d]/5 border border-[#a9bb9d]/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a9bb9d]" />
                <h4 className="text-[#4d6944] font-bold text-sm">
                  Did you know?
                </h4>
              </div>
              <p className="text-sm text-[#6b8760] leading-relaxed">
                Patients with the same CYP2D6 phenotype often have similar
                reactions to codeine and antidepressants. Sharing your
                experience helps others make more informed decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
