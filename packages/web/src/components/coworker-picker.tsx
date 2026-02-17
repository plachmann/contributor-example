"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Coworker {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface CoworkerPickerProps {
  coworkers: Coworker[];
  giftedIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CoworkerPicker({ coworkers, giftedIds, selectedId, onSelect }: CoworkerPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = coworkers.filter((c) =>
    c.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search coworkers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            aria-label={`Select ${c.displayName}`}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
              selectedId === c.id
                ? "bg-orange-100 border-2 border-orange-300"
                : "hover:bg-gray-50 border-2 border-transparent"
            }`}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={c.avatarUrl || undefined} />
              <AvatarFallback className="bg-orange-200 text-orange-700">
                {c.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 font-medium">{c.displayName}</span>
            {giftedIds.has(c.id) && (
              <span className="text-green-600 text-lg">&#10003;</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
