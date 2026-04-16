import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExamPlayer from "@/components/Exam/ExamPlayer";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  return <ExamPlayer examId={id} />;
}
