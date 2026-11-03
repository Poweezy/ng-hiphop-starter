import { describe, expect, it } from 'vitest';
import {
    assertDemoSeedAllowed,
    DEMO_COMPETITION_SLUGS,
    getDemoCompetitionWhere,
} from './demo-seed-scope';

describe('demo seed safety', () => {
    it('limits competition cleanup and fixture selection to the demo slugs', () => {
        expect(getDemoCompetitionWhere()).toEqual({
            slug: { in: DEMO_COMPETITION_SLUGS },
        });
    });

    it('rejects demo fixture seeding in production', () => {
        expect(() =>
            assertDemoSeedAllowed({
                NODE_ENV: 'production',
                SEED_DEMO_DATA: 'true',
            }),
        ).toThrow('Demo fixtures cannot be seeded in production');
    });

    it('allows the production seed path when demo fixtures are disabled', () => {
        expect(() =>
            assertDemoSeedAllowed({
                NODE_ENV: 'production',
                SEED_DEMO_DATA: 'false',
            }),
        ).not.toThrow();
    });
});
