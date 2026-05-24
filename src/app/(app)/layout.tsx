import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-nc-warm">
      <main className="max-w-2xl mx-auto pb-24 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
