import Link from "next/link";
import { PlusCircle, PenSquare, Map, Globe } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-fade-up">
      <header>
        <h1 className="text-3xl text-ink font-display">Dashboard</h1>
        <p className="text-dust mt-2">Welcome to your private travel diary management.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          title="New Post"
          description="Write about a new day on the road."
          href="/admin/posts/new"
          icon={<PlusCircle className="text-amber mb-3" size={32} />}
        />
        <QuickActionCard
          title="Manage Posts"
          description="Edit, reorder, or update past entries."
          href="/admin/posts"
          icon={<PenSquare className="text-dust mb-3" size={32} />}
        />
        <QuickActionCard
          title="Manage Trips"
          description="Organize your journey timelines."
          href="/admin/trips"
          icon={<Map className="text-dust mb-3" size={32} />}
        />
        <QuickActionCard
          title="Manage Countries"
          description="Add new destinations to the map."
          href="/admin/countries"
          icon={<Globe className="text-dust mb-3" size={32} />}
        />
      </section>

      {/* TODO: Add recent drafts or stats here later */}
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="card p-6 flex flex-col items-start group">
      {icon}
      <h3 className="font-bold text-ink group-hover:text-amber transition-colors">{title}</h3>
      <p className="text-sm text-dust mt-1 leading-relaxed">{description}</p>
    </Link>
  );
}
