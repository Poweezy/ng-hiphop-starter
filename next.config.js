/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
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
            // S3 / object storage hosts. Add your CDN/bucket host here too.
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
    async headers() {
        const isProd = process.env.NODE_ENV === 'production';
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    ...(isProd ? [
                        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    ] : []),
                    {
                        key: 'Content-Security-Policy',
                        // NOTE: 'unsafe-inline' is required for Next.js + styled-jsx.
                        // 'unsafe-eval' has been removed. For admin routes consider a
                        // nonce-based CSP to further reduce XSS blast radius.
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; upgrade-insecure-requests;",
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
