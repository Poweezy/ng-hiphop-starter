export const DEMO_COMPETITION_SLUGS = [
    'best-lyrics-august-2026',
    'best-lyrics-2026',
    'best-lyrics-may-2026',
    'best-lyrics-june-2026',
    'best-lyrics-2025',
];

export function getDemoCompetitionWhere() {
    return { slug: { in: [...DEMO_COMPETITION_SLUGS] } };
}

export function assertDemoSeedAllowed(
    environment: { NODE_ENV?: string; SEED_DEMO_DATA?: string },
) {
    if (environment.NODE_ENV === 'production' && environment.SEED_DEMO_DATA === 'true') {
        throw new Error('Demo fixtures cannot be seeded in production');
    }
}
