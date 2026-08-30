import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Submission Status',
    description: 'Check the review status of your Best Lyrics competition submission by submission ID or artist alias.',
    alternates: {
        canonical: '/submissions/status',
    },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
    return children;
}
