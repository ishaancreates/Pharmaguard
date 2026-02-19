"use client";
import { useState } from "react";
import NavBar from "@/components/NavBar";
import TwinFinder from "@/components/community/TwinFinder";
import Feed from "@/components/community/Feed";
import PostComposer from "@/components/community/PostComposer";

export default function CommunityPage() {
  const [refreshFeed, setRefreshFeed] = useState(0);

  // Mock profile for demo - in reality this comes from AnalysisTool or User Context
  const mockProfile = {
    CYP2D6: { diplotype: "*4/*4", phenotype: "PM", variants: ["rs3892097"] },
  };

  const handlePostCreated = () => {
    setRefreshFeed((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-12 px-4 sm:px-6">
      <NavBar />
      <div className="max-w-6xl mx-auto pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="mb-2">
              <h1 className="text-3xl font-extrabold text-[#0b1e40] tracking-tight">
                Community Feed
              </h1>
              <p className="text-[#64748b]">
                Connect with patients who share your genetic profile.
              </p>
            </div>

            <PostComposer onPostCreated={handlePostCreated} />
            <Feed refreshTrigger={refreshFeed} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TwinFinder profile={mockProfile} />

            {/* Info Card */}
            <div className="bg-[#a9bb9d]/10 border border-[#a9bb9d]/20 rounded-2xl p-6">
              <h4 className="text-[#5a7a52] font-bold mb-2">Did you know?</h4>
              <p className="text-sm text-[#5a7a52]/80 leading-relaxed">
                Patients with the same CYP2D6 phenotype often have similar
                reactions to codeine and antidepressants. Sharing your
                experience helps others!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
