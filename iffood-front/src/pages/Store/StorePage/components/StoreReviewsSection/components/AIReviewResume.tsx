import { Sparkles } from "lucide-react";

interface AIReviewResumeProps {
  reviewResume?: string;
}

export function AIReviewResume({ reviewResume }: AIReviewResumeProps) {
  if (!reviewResume) return null;

  return (
    <div className="mx-4 my-3 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="size-4 text-purple-500" />
        <span className="text-sm font-semibold text-purple-700">
          Resumo por IA
        </span>
      </div>
      <p className="text-sm leading-relaxed text-gray-700">{reviewResume}</p>
    </div>
  );
}
