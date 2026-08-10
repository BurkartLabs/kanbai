import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage — Kanbai',
  robots: { index: false, follow: false, nocache: true },
};

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <div className="manage">{children}</div>;
}
