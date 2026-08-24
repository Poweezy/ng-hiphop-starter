/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
    images: {
        qualities: [75, 85],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'open.spotify.com',
            },
            {
                protocol: 'https',
                hostname: 'music.apple.com',
            },
            {
                protocol: 'https',
                hostname: 'actions.google.com',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            {
                protocol: 'https',
                hostname: 's3.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: '*.s3.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: '*.s3.*.amazonaws.com',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
    },
    async headers() {
        const isProd = process.env.NODE_ENV === 'production';
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    ...(isProd ? [
                        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    ] : []),
                    // NOTE: Content-Security-Policy is intentionally NOT set here.
                    // It is generated per-request in middleware.ts: /admin routes get
                    // a strict nonce-based policy; everything else gets the tightened
                    // static policy. Keeping it in one place avoids duplicate headers
                    // (browsers intersect multiple CSPs, which breaks pages).
                ],
            },
        ];
    },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
