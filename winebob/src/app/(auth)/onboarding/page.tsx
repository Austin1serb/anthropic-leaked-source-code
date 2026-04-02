"use client";

import { useState, useTransition } from "react";
import { ChevronRight, ChevronLeft, Wine, Loader2 } from "lucide-react";
import { saveTasteProfile } from "@/lib/actions";

type Question = {
  id: string;
  title: string;
  subtitle: string;
  type: "slider" | "grid" | "map";
  sliderLabels?: [string, string];
  options?: { label: string; emoji: string }[];
};

const questions: Question[] = [
  {
    id: "body",
    title: "How do you like your wine?",
    subtitle: "Light and delicate, or rich and full?",
    type: "slider",
    sliderLabels: ["Light & Crisp", "Rich & Bold"],
  },
  {
    id: "sweetness",
    title: "Sweet or dry?",
    subtitle: "Where do you fall on the sweetness scale?",
    type: "slider",
    sliderLabels: ["Bone Dry", "Sweet & Luscious"],
  },
  {
    id: "grape",
    title: "Pick your favorites",
    subtitle: "Select the grapes that speak to you",
    type: "grid",
    options: [
      { label: "Cabernet Sauvignon", emoji: "🍇" },
      { label: "Pinot Noir", emoji: "🌹" },
      { label: "Merlot", emoji: "🫐" },
      { label: "Syrah/Shiraz", emoji: "🌶️" },
      { label: "Chardonnay", emoji: "🍋" },
      { label: "Sauvignon Blanc", emoji: "🌿" },
      { label: "Riesling", emoji: "🍯" },
      { label: "Nebbiolo", emoji: "🏔️" },
      { label: "Tempranillo", emoji: "🌞" },
      { label: "Gamay", emoji: "🍒" },
      { label: "Grenache", emoji: "🫒" },
      { label: "Sangiovese", emoji: "🍅" },
    ],
  },
  {
    id: "region",
    title: "Favorite wine regions?",
    subtitle: "Where in the world do your taste buds travel?",
    type: "grid",
    options: [
      { label: "Bordeaux", emoji: "🇫🇷" },
      { label: "Burgundy", emoji: "🏰" },
      { label: "Tuscany", emoji: "🇮🇹" },
      { label: "Rioja", emoji: "🇪🇸" },
      { label: "Napa Valley", emoji: "🇺🇸" },
      { label: "Barossa Valley", emoji: "🇦🇺" },
      { label: "Mosel", emoji: "🇩🇪" },
      { label: "Piedmont", emoji: "🏔️" },
      { label: "Champagne", emoji: "🥂" },
      { label: "Douro", emoji: "🇵🇹" },
      { label: "Marlborough", emoji: "🇳🇿" },
      { label: "South Africa", emoji: "🇿🇦" },
    ],
  },
  {
    id: "adventure",
    title: "How adventurous are you?",
    subtitle: "Stick to favorites or always exploring?",
    type: "slider",
    sliderLabels: ["Comfort Zone", "Wild Explorer"],
  },
];

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string[]>>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(50);

  const question = questions[step];
  const isLast = step === questions.length - 1;
  const progress = ((step + 1) / questions.length) * 100;

  function handleNext() {
    // Save current answer
    if (question.type === "slider") {
      setAnswers((prev) => ({ ...prev, [question.id]: sliderValue }));
    } else if (question.type === "grid") {
      setAnswers((prev) => ({ ...prev, [question.id]: selectedItems }));
    }

    if (isLast) {
      const finalAnswers = { ...answers };
      if (question.type === "slider") {
        finalAnswers[question.id] = sliderValue;
      } else if (question.type === "grid") {
        finalAnswers[question.id] = selectedItems;
      }
      startTransition(async () => {
        await saveTasteProfile({
          body: (finalAnswers.body as number) ?? 50,
          sweetness: (finalAnswers.sweetness as number) ?? 50,
          grape: (finalAnswers.grape as string[]) ?? [],
          region: (finalAnswers.region as string[]) ?? [],
          adventure: (finalAnswers.adventure as number) ?? 50,
        });
      });
    } else {
      setStep((s) => s + 1);
      setSliderValue(50);
      setSelectedItems([]);
    }
  }

  function toggleGridItem(label: string) {
    setSelectedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top">
      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="touch-target flex items-center justify-center"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="flex-1 h-1.5 bg-card-border rounded-full overflow-hidden">
            <div
              className="h-full bg-wine-burgundy rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted">
            {step + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 flex flex-col px-6 pt-8">
        <div className="mb-2">
          <Wine size={32} className="text-wine-burgundy mb-4" />
        </div>
        <h2 className="text-2xl font-bold font-serif mb-2">
          {question.title}
        </h2>
        <p className="text-sm text-muted mb-8">{question.subtitle}</p>

        {/* Slider input */}
        {question.type === "slider" && question.sliderLabels && (
          <div className="flex flex-col gap-4">
            <input
              type="range"
              min={0}
              max={100}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-wine-cream-dark accent-wine-burgundy"
            />
            <div className="flex justify-between">
              <span className="text-xs text-muted">
                {question.sliderLabels[0]}
              </span>
              <span className="text-xs text-muted">
                {question.sliderLabels[1]}
              </span>
            </div>
          </div>
        )}

        {/* Grid input */}
        {question.type === "grid" && question.options && (
          <div className="grid grid-cols-3 gap-2.5">
            {question.options.map((option) => {
              const isSelected = selectedItems.includes(option.label);
              return (
                <button
                  key={option.label}
                  onClick={() => toggleGridItem(option.label)}
                  className={`p-3 rounded-xl text-center transition-all active:scale-95 ${
                    isSelected
                      ? "bg-wine-burgundy text-white ring-2 ring-wine-burgundy"
                      : "wine-card"
                  }`}
                >
                  <span className="text-lg block mb-1">{option.emoji}</span>
                  <span className="text-[11px] font-medium leading-tight block">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Next button */}
      <div className="px-6 pb-8 safe-bottom">
        <button
          onClick={handleNext}
          disabled={isPending}
          className="w-full py-4 bg-wine-burgundy text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:bg-wine-burgundy-dark transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving your profile...
            </>
          ) : isLast ? (
            <>
              See My Taste Profile
              <ChevronRight size={20} />
            </>
          ) : (
            <>
              Next
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
