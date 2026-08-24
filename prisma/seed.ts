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

    // Create default song (idempotent upsert)
    await prisma.song.upsert({
        where: { id: 'seed-default-song' },
        update: {},
        create: {
            id: 'seed-default-song',
            title: 'First Light',
            description: 'The opening chapter of the NG vault — where bars meet beats and the culture speaks first.',
            file_url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
            cover_url: '/images/cover.png',
            is_active: true,
        },
    });
    console.log('✅ Default song seeded');

    // ============================================
    // Best Lyrics Portal Seed Data
    // ============================================
    console.log('\n🏆 Seeding Best Lyrics Portal...');

    // Clean up existing seed data (idempotent)
    console.log('  Cleaning up existing seed data...');
    const allComps = await prisma.lyricCompetition.findMany({ where: { slug: { not: null } } });
    for (const comp of allComps) {
        await prisma.winner.deleteMany({ where: { competitionId: comp.id } });
        await prisma.lyricSubmission.deleteMany({ where: { competitionId: comp.id } });
        await prisma.subscriber.deleteMany({ where: { competitionId: comp.id } });
        await prisma.competitionAnalytics.deleteMany({ where: { competitionId: comp.id } });
        await prisma.competitionPrize.deleteMany({ where: { competitionId: comp.id } });
        await prisma.competitionRule.deleteMany({ where: { competitionId: comp.id } });
        await prisma.competitionParticipant.deleteMany({ where: { competitionId: comp.id } });
        await prisma.emailCampaign.deleteMany({ where: { createdBy: adminEmail } });
        await prisma.lyricCompetition.delete({ where: { id: comp.id } });
    }
    console.log('  Cleanup complete');

    // Competitions (idempotent)
    const competitionSlugs = ['best-lyrics-august-2026', 'best-lyrics-2026', 'best-lyrics-may-2026', 'best-lyrics-june-2026', 'best-lyrics-2025'];
    for (const slug of competitionSlugs) {
        await prisma.lyricCompetition.upsert({
            where: { slug },
            update: {},
            create: {
                title: slug === 'best-lyrics-august-2026' ? 'Monthly Best Lyrics - August 2026' :
                       slug === 'best-lyrics-2026' ? 'Best Lyrics of the Year 2026' :
                       slug === 'best-lyrics-may-2026' ? 'Monthly Best Lyrics - May 2026' :
                       slug === 'best-lyrics-june-2026' ? 'Monthly Best Lyrics - June 2026' :
                       'Best Lyrics of the Year 2025',
                description: 'Drop your hottest bars and compete with the community.',
                type: slug.includes('year') ? 'yearly' : 'monthly',
                status: slug === 'best-lyrics-august-2026' || slug === 'best-lyrics-2026' ? 'published' : 'archived',
                startDate: new Date(slug === 'best-lyrics-august-2026' ? '2026-08-01' : slug === 'best-lyrics-2026' ? '2026-01-01' : slug === 'best-lyrics-may-2026' ? '2026-05-01' : slug === 'best-lyrics-june-2026' ? '2026-06-01' : '2025-01-01'),
                endDate: new Date(slug === 'best-lyrics-august-2026' ? '2026-08-31' : slug === 'best-lyrics-2026' ? '2026-12-31' : slug === 'best-lyrics-may-2026' ? '2026-05-31' : slug === 'best-lyrics-june-2026' ? '2026-06-30' : '2025-12-31'),
                submissionDeadline: new Date(slug === 'best-lyrics-august-2026' ? '2026-08-28' : slug === 'best-lyrics-2026' ? '2026-11-30' : slug === 'best-lyrics-may-2026' ? '2026-05-28' : slug === 'best-lyrics-june-2026' ? '2026-06-28' : '2025-11-30'),
                shortDescription: slug === 'best-lyrics-august-2026' ? 'August monthly competition - drop your hardest bars!' : slug === 'best-lyrics-2026' ? 'Yearly championship - the best of the best.' : 'Completed competition.',
                socialSharingText: `I just entered ${slug.replace(/-/g, ' ')}! Can you beat my bars?`,
                viewCount: slug === 'best-lyrics-august-2026' ? 12482 : slug === 'best-lyrics-2026' ? 45230 : slug === 'best-lyrics-may-2026' ? 8930 : slug === 'best-lyrics-june-2026' ? 10200 : 67800,
                is_active: slug === 'best-lyrics-august-2026' || slug === 'best-lyrics-2026',
            },
        });
    }
    console.log('✅ Competitions seeded');

    // Get seeded competitions
    const allCompetitions = await prisma.lyricCompetition.findMany({
        orderBy: { createdAt: 'asc' },
    });

    const [aug2026, year2026, may2026, june2026, year2025] = allCompetitions;

    // Rules
    const rulesData = [
        { competitionId: aug2026.id, minLength: 16, maxLength: 500, originalityRequired: true, copyrightRequirements: 'All submissions must be original work.', maxSubmissionsPerUser: 2, eligibilityRequirements: 'Open to all ages 13+', moderationRequired: true },
        { competitionId: year2026.id, minLength: 16, maxLength: 500, originalityRequired: true, copyrightRequirements: 'All submissions must be original work.', maxSubmissionsPerUser: 3, eligibilityRequirements: 'Open to all ages 13+', moderationRequired: true },
        { competitionId: may2026.id, minLength: 16, maxLength: 500, originalityRequired: true, copyrightRequirements: 'All submissions must be original work.', maxSubmissionsPerUser: 2, moderationRequired: true },
        { competitionId: june2026.id, minLength: 16, maxLength: 500, originalityRequired: true, copyrightRequirements: 'All submissions must be original work.', maxSubmissionsPerUser: 2, moderationRequired: true },
        { competitionId: year2025.id, minLength: 16, maxLength: 500, originalityRequired: true, copyrightRequirements: 'All submissions must be original work.', maxSubmissionsPerUser: 3, moderationRequired: true },
    ];

    for (const rule of rulesData) {
        await prisma.competitionRule.upsert({
            where: { competitionId: rule.competitionId },
            update: rule,
            create: rule,
        });
    }
    console.log('✅ Competition rules seeded');

    // Prizes
    const prizesData: any[] = [];
    for (const comp of allCompetitions) {
        prizesData.push(
            { competitionId: comp.id, position: 1, name: '1st Place', cashAmount: 500, description: 'Grand prize for the best lyrics' },
            { competitionId: comp.id, position: 2, name: '2nd Place', cashAmount: 250, description: 'Runner-up prize' },
            { competitionId: comp.id, position: 3, name: '3rd Place', cashAmount: 100, description: 'Third place prize' },
        );
    }

    for (const prize of prizesData) {
        await prisma.competitionPrize.create({
            data: prize,
        });
    }
    console.log('✅ Competition prizes seeded');

    // Submissions
    const artistAliases = [
        'LyricalPharaoh', 'BarQueen', 'MicSlinger', 'VerseVandal', 'RhymeRider',
        'FlowState', 'CipherKing', 'WordSmith', 'BeatPoet', 'StreetSage',
        'GrooveMaster', 'RhythmRebel', 'HipHopHeretic', 'VerseViper', 'LyricLynx',
        'RapRenaissance', 'PoeticJustice', 'BarBaron', 'FlowDoctor', 'MicMaestro',
        'WordWizard', 'RhymeRuler', 'VerseVirtuoso', 'LyricLegend', 'BarBoss'
    ];

    const lyricTexts = [
        "I rise from the ashes of the beat, phoenix in the concrete jungle where the weak get defeated",
        "Every bar I spit is a brick in the wall, building my legacy standing tall",
        "They say the game is rigged but I bring my own dice, rolling with the culture whatever the price",
        "From the block to the booth I transform the pain into ink, every verse is a prayer every rhyme is a link",
        "They copy the style but they can't copy the soul, I'm writing my name in the history scroll",
        "Underground king with a crown made of bars, ruling the cipher under neon stars",
        "I don't chase the hype I create the wave, lyrical tsunami that will make you behave",
        "Pen game lethal words like weapons deployed, every syllable hits like a missile with a warhead attached",
        "Born in the struggle raised by the rhythm, bars so cold they could freeze a prism",
        "I paint pictures with syllables and sculpt statues with syllables, art form so vivid it'll make visuals illegal",
        "Versatile visionaries writing the future, every line is a chapter every bar is a structure",
        "I speak for the voiceless the broken the bold, my pen is the sword my voice is the shield",
        "Bars so sharp they cut through the silence, lyrical violence but no physical violence",
        "From the trenches to the top I climbed every rung, every setback just fuel for the lyrical gun",
        "I don't follow trends I set the pace, bars so hot they could melt outer space",
        "Lyrical assassin with a flow so cold, every verse is a story that has already been told",
        "They hear the beat and they freeze in the moment, I drop the truth and I watch it explode",
        "Word architect building bridges with metaphors, every line connects to something more",
        "I mastered the art of making something from nothing, bars so deep they could sink a submarine",
        "Pen to the paper let the ink do the talking, lyrical masterpiece that'll leave you walking"
    ];

    const submissions: any[] = [];
    const statuses = ['pending', 'approved', 'rejected', 'disqualified', 'winner'];
    const modStatuses = ['pending', 'approved', 'rejected', 'changes_requested'];
    const modReasons = ['copyright', 'offensive', 'spam', 'duplicate', 'rules', 'other'];

    let subId = 1;
    for (let i = 0; i < 25; i++) {
        const comp = allCompetitions[i % allCompetitions.length];
        const statusIdx = i < 5 ? 4 : (i < 10 ? 1 : (i < 15 ? 0 : (i < 20 ? 2 : 3)));
        const status = statuses[statusIdx];
        const modStatus = status === 'approved' || status === 'winner' ? 'approved' : (status === 'rejected' ? 'rejected' : modStatuses[i % modStatuses.length]);

        submissions.push({
            id: `seed-sub-${subId++}`,
            competitionId: comp.id,
            artistAlias: artistAliases[i % artistAliases.length],
            userId: i % 3 === 0 ? 'seed-user-1' : (i % 3 === 1 ? 'seed-user-2' : null),
            lyrics: lyricTexts[i % lyricTexts.length],
            songTitle: i % 2 === 0 ? `Track ${i + 1}` : null,
            audioUrl: i % 4 === 0 ? `https://example.com/audio/track-${i + 1}.mp3` : null,
            socialLinks: i % 3 === 0 ? JSON.stringify({ instagram: `@${artistAliases[i % artistAliases.length]}`, spotify: `artist/${artistAliases[i % artistAliases.length]}` }) : null,
            status,
            moderationStatus: modStatus,
            moderationNotes: modStatus === 'rejected' ? 'Content did not meet competition guidelines' : null,
            moderationReason: modStatus === 'rejected' ? modReasons[i % modReasons.length] : null,
            score: status === 'approved' || status === 'winner' ? Math.floor(Math.random() * 40) + 60 : null,
            ipAddress: `192.168.1.${(i % 254) + 1}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            copyrightAccepted: true,
            deletedAt: null,
        });
    }

    for (const sub of submissions) {
        await prisma.lyricSubmission.upsert({
            where: { id: sub.id },
            update: sub,
            create: sub,
        });
    }
    console.log(`✅ ${submissions.length} submissions seeded`);

    // Moderation history for some submissions
    for (const sub of submissions.slice(0, 10)) {
        await prisma.submissionModeration.create({
            data: {
                submissionId: sub.id,
                action: sub.moderationStatus === 'approved' ? 'approve' : (sub.moderationStatus === 'rejected' ? 'reject' : 'request_changes'),
                reason: sub.moderationReason || 'Reviewed by admin',
                notes: sub.moderationNotes || '',
                moderatedBy: adminEmail,
            },
        });
    }
    console.log('✅ Moderation history seeded');

    // Winners
    const winnersData = [
        { competitionId: may2026.id, submissionId: submissions[4].id, position: 1, prizeName: '1st Place', cashAmount: 500, selectedBy: adminEmail },
        { competitionId: may2026.id, submissionId: submissions[5].id, position: 2, prizeName: '2nd Place', cashAmount: 250, selectedBy: adminEmail },
        { competitionId: may2026.id, submissionId: submissions[6].id, position: 3, prizeName: '3rd Place', cashAmount: 100, selectedBy: adminEmail },
        { competitionId: june2026.id, submissionId: submissions[9].id, position: 1, prizeName: '1st Place', cashAmount: 500, selectedBy: adminEmail },
        { competitionId: june2026.id, submissionId: submissions[10].id, position: 2, prizeName: '2nd Place', cashAmount: 250, selectedBy: adminEmail },
        { competitionId: year2025.id, submissionId: submissions[14].id, position: 1, prizeName: '1st Place', cashAmount: 1000, selectedBy: adminEmail },
    ];

    for (const w of winnersData) {
        await prisma.winner.create({
            data: w,
        });
        // Update submission status to winner
        await prisma.lyricSubmission.update({
            where: { id: w.submissionId },
            data: { status: 'winner' },
        });
    }
    console.log(`✅ ${winnersData.length} winners seeded`);

    // Subscribers
    const subscriberEmails = [
        'alice@example.com', 'bob@example.com', 'charlie@example.com', 'diana@example.com', 'eve@example.com',
        'frank@example.com', 'grace@example.com', 'henry@example.com', 'ivy@example.com', 'jack@example.com',
        'kate@example.com', 'liam@example.com', 'mia@example.com', 'noah@example.com', 'olivia@example.com',
        'peter@example.com', 'quinn@example.com', 'rose@example.com', 'sam@example.com', 'tina@example.com',
        'uma@example.com', 'vince@example.com', 'wendy@example.com', 'xavier@example.com', 'yara@example.com',
    ];

    const subscriberNames = [
        'Alice', 'Bob', 'Charlie', 'Diana', 'Eve',
        'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
        'Kate', 'Liam', 'Mia', 'Noah', 'Olivia',
        'Peter', 'Quinn', 'Rose', 'Sam', 'Tina',
        'Uma', 'Vince', 'Wendy', 'Xavier', 'Yara',
    ];

    const sources = [
        'Best Lyrics Portal - August 2026',
        'Best Lyrics Portal - 2026',
        'Best Lyrics Portal - May 2026',
        'Best Lyrics Portal - June 2026',
        'Best Lyrics Portal - 2025',
    ];

    for (let i = 0; i < subscriberEmails.length; i++) {
        const comp = allCompetitions[i % allCompetitions.length];
        const status = i < 20 ? 'active' : 'unsubscribed';
        await prisma.subscriber.create({
            data: {
                email: subscriberEmails[i],
                name: subscriberNames[i],
                competitionId: comp.id,
                source: sources[i % sources.length],
                consentStatus: 'granted',
                consentTimestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                subscriptionStatus: status,
                unsubscribedAt: status === 'unsubscribed' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
                lastEmailSentAt: status === 'active' ? new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) : null,
            },
        });
    }
    console.log(`✅ ${subscriberEmails.length} subscribers seeded`);

    // Analytics
    const analyticsData = [
        { competitionId: aug2026.id, views: 12482, totalSubmissions: 25, uniqueParticipants: 18, approvedSubmissions: 15, rejectedSubmissions: 5, subscribersGenerated: 12, conversionRate: 0.75, winners: 0, prizeValue: 850 },
        { competitionId: year2026.id, views: 45230, totalSubmissions: 45, uniqueParticipants: 32, approvedSubmissions: 30, rejectedSubmissions: 8, subscribersGenerated: 25, conversionRate: 1.2, winners: 0, prizeValue: 1500 },
        { competitionId: may2026.id, views: 8930, totalSubmissions: 20, uniqueParticipants: 15, approvedSubmissions: 12, rejectedSubmissions: 3, subscribersGenerated: 8, conversionRate: 0.65, winners: 3, prizeValue: 850 },
        { competitionId: june2026.id, views: 10200, totalSubmissions: 22, uniqueParticipants: 16, approvedSubmissions: 14, rejectedSubmissions: 4, subscribersGenerated: 10, conversionRate: 0.70, winners: 2, prizeValue: 850 },
        { competitionId: year2025.id, views: 67800, totalSubmissions: 60, uniqueParticipants: 45, approvedSubmissions: 48, rejectedSubmissions: 7, subscribersGenerated: 35, conversionRate: 1.5, winners: 1, prizeValue: 2000 },
    ];

    for (const analytics of analyticsData) {
        await prisma.competitionAnalytics.upsert({
            where: { competitionId: analytics.competitionId },
            update: analytics,
            create: analytics,
        });
    }
    console.log('✅ Competition analytics seeded');

    // Email campaign
    await prisma.emailCampaign.upsert({
        where: { id: 'seed-campaign-1' },
        update: {},
        create: {
            id: 'seed-campaign-1',
            name: 'August 2026 Competition Launch',
            subject: 'The August Best Lyrics Competition is LIVE!',
            body: '<h1>Drop Your Bars!</h1><p>The August 2026 Best Lyrics Competition is now open. Enter now for your chance to win $500.</p><a href="https://ng-hiphop.com/game/best-lyrics">Enter Competition</a><hr><p><a href="https://ng-hiphop.com/unsubscribe">Unsubscribe</a></p>',
            recipientFilter: JSON.stringify({ competitionId: aug2026.id, subscriptionStatus: 'active' }),
            recipientIds: JSON.stringify(subscriberEmails.slice(0, 5)),
            status: 'draft',
            createdBy: adminEmail,
        },
    });
    console.log('✅ Email campaign seeded');

    // Create default song (idempotent upsert)
    await prisma.song.upsert({
        where: { id: 'seed-default-song' },
        update: {},
        create: {
            id: 'seed-default-song',
            title: 'First Light',
            description: 'The opening chapter of the NG vault — where bars meet beats and the culture speaks first.',
            file_url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
            cover_url: '/images/cover.png',
            is_active: true,
        },
    });
    console.log('✅ Default song seeded');

    console.log('\n🎵 Seed complete!');
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
