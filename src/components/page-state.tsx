export function PageState({
  icon,
  title,
  description,
  tone = "blue",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "blue" | "slate";
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div
        className={`text-center ${tone === "blue" ? "text-blue-600" : "text-slate-600"}`}
      >
        {icon}
        <h1 className="mt-4 font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
    </main>
  );
}
