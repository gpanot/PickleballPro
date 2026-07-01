import { Link } from "react-router";
import { Plus, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const sessions = [
  {
    id: 1,
    date: "Jun 26, 2026",
    hours: "3h",
    type: "Social",
    mood: "Difficult",
    strengths: ["Dinks", "Returns", "Drives", "Spin Control", "Smashes"],
    challenges: ["Dinks", "Returns", "Drop Shots", "Volleys/Resets"],
  },
  {
    id: 2,
    date: "Jun 25, 2026",
    hours: "1h",
    type: "Class",
    mood: "Neutral",
    strengths: ["Dinks"],
    challenges: ["Dinks"],
  },
];

export function Logbook() {
  return (
    <div className="min-h-screen bg-white max-w-md mx-auto">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl">Your Logbook</h1>
      </div>

      {/* Summary Stats */}
      <div className="px-6 pb-6">
        <div className="bg-neutral-50 rounded-lg p-6">
          <div className="text-center">
            <div className="text-5xl mb-2">5h</div>
            <div className="text-sm text-neutral-600">Total Hours</div>
            <div className="text-xs text-neutral-500 mt-1">3 sessions since Jun 25, 2026</div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Social</span>
              <span>4h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Class</span>
              <span>1h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="px-6 pb-24">
        <h2 className="text-lg mb-4">Recent Sessions</h2>
        
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={`/log?id=${session.id}`}
              className="block bg-neutral-50 rounded-lg p-4 hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium">{session.date}</div>
                  <div className="text-sm text-neutral-600 mt-1">{session.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{session.hours}</span>
                  <ChevronRight className="size-4 text-neutral-400" />
                </div>
              </div>
              
              <div className="text-sm text-neutral-600">
                <div className="mb-1">Progress: {session.mood}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Add Button */}
      <Link
        to="/log"
        className="fixed bottom-6 right-6 size-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-800 transition-colors"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}
