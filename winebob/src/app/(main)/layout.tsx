import { BottomTabBar } from "@/components/shared/BottomTabBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content area with bottom padding for tab bar */}
      <main className="flex-1 pb-20">{children}</main>
      <BottomTabBar />
    </div>
  );
}
