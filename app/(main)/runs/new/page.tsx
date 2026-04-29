import Link from "next/link";
import { RunForm } from "@/components/RunForm";

export default function NewRunPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/runs"
          className="text-caption font-semibold text-muted hover:text-foreground"
        >
          ← 목록
        </Link>
        <h1 className="text-h1 font-bold text-foreground">새 기록</h1>
      </div>
      <RunForm mode="create" />
    </div>
  );
}
