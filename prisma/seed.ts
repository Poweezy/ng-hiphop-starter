import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding NG Hip Hop Platform...');

    // Create default slogan
    await prisma.slogan.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            text: 'Built From Bars. Raised By Beats.',
        },
    });
    console.log('✅ Slogan seeded');

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail) {
        throw new Error('ADMIN_EMAIL environment variable is required');
    }
    if (!adminPassword) {
        throw new Error('ADMIN_PASSWORD environment variable is required');
    }

    const password_hash = await bcrypt.hash(adminPassword, 12);

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password_hash,
            role: 'ADMIN',
        },
    });
    console.log(`✅ Admin user seeded: ${adminEmail}`);

    // Seed sample lyric game entries
    await prisma.lyricGame.createMany({
        data: [
            {
                lyric_text: "Started from the bottom, now we're here",
                correct_artist: 'Drake',
                is_active: true,
            },
            {
                lyric_text: "I got 99 problems but a pitch ain't one",
                correct_artist: 'Jay-Z',
                is_active: true,
            },
            {
                lyric_text: "Sit down, be humble",
                correct_artist: 'Kendrick Lamar',
                is_active: true,
            },
            {
                lyric_text: "Real Gs move in silence like lasagna",
                correct_artist: 'Lil Wayne',
                is_active: true,
            },
        ],
    });
    console.log('✅ Lyric game entries seeded');

    // Create default song
    await prisma.song.create({
        data: {
            title: 'Ascension (Placeholder track)',
            description: 'This is a sample track injected during initialization. Upload your own tracks from the Admin portal.',
            file_url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
            cover_url: '/images/cover.png',
            is_active: true,
        }
    });
    console.log('✅ Default song seeded');

    console.log('🎵 Seed complete!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
