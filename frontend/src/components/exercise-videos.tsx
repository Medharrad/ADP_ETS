"use client";

// =============================================================================
// ExerciseList — liste d'exercices avec, devant chaque nom, un lien « ▶ vidéo ».
// Au clic, la vidéo YouTube se lit dans une modale intégrée à l'app (expérience
// propre, sans quitter la page). Utilisé sur la planification et la page cycle.
// =============================================================================

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

import { videoForExercise } from "@/lib/videos";

export function ExerciseList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: string;
  items: string[];
}) {
  const [active, setActive] = useState<{ id: string; title: string } | null>(null);
  return (
    <>
      <h4>
        {icon} {title}
      </h4>
      <ul>
        {items.map((ex, i) => {
          const id = videoForExercise(ex);
          return (
            <li key={i}>
              {id && (
                <button
                  type="button"
                  onClick={() => setActive({ id, title: ex })}
                  className="mr-1.5 inline-flex items-center gap-1 rounded-md bg-[#0D2B5E] px-1.5 py-0.5 align-middle text-[0.62rem] font-bold text-white transition hover:brightness-125 print:hidden"
                  title={`Voir la vidéo : ${ex}`}
                >
                  <Play className="h-2.5 w-2.5 fill-white" /> vidéo
                </button>
              )}
              {ex}
            </li>
          );
        })}
      </ul>
      {active && (
        <VideoModal id={active.id} title={active.title} onClose={() => setActive(null)} />
      )}
    </>
  );
}

function VideoModal({ id, title, onClose }: { id: string; title: string; onClose: () => void }) {
  // Fermeture à la touche Échap + verrouillage du scroll de fond.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 print:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-2.5">
          <h3 className="truncate text-sm font-bold text-[#0C1E3C]">🎬 {title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0C1E3C]"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
