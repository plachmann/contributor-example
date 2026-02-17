import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      displayName: "Admin User",
      isAdmin: true,
    },
  });

  // Create regular users
  const users = await Promise.all(
    [
      { email: "alice@example.com", displayName: "Alice Johnson" },
      { email: "bob@example.com", displayName: "Bob Smith" },
      { email: "carol@example.com", displayName: "Carol Williams" },
      { email: "dave@example.com", displayName: "Dave Brown" },
      { email: "eve@example.com", displayName: "Eve Davis" },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: u,
      })
    )
  );

  // Create a sample campaign
  const campaign = await prisma.campaign.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Q1 2026 Appreciation",
      description: "Show your coworkers some love!",
      budgetPerUser: 50000, // $500.00
      openDate: new Date("2026-01-01T00:00:00Z"),
      closeDate: new Date("2026-03-31T23:59:59Z"),
      createdBy: admin.id,
    },
  });

  // Add all users as participants
  const allUsers = [admin, ...users];
  for (const user of allUsers) {
    await prisma.campaignParticipant.upsert({
      where: {
        campaignId_userId: {
          campaignId: campaign.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        campaignId: campaign.id,
        userId: user.id,
      },
    });
  }

  // Create sample gifts
  const giftData = [
    { giverId: users[0].id, recipientId: users[1].id, amount: 2500, comment: "Great teamwork on the Q1 project!" },
    { giverId: users[0].id, recipientId: users[2].id, amount: 1500, comment: "Thanks for helping with code reviews" },
    { giverId: users[1].id, recipientId: users[0].id, amount: 3000, comment: "Amazing presentation last week!" },
    { giverId: users[2].id, recipientId: users[3].id, amount: 2000, comment: "Thanks for mentoring me" },
    { giverId: users[3].id, recipientId: users[4].id, amount: 1000, comment: "Great debugging help!" },
    { giverId: users[4].id, recipientId: admin.id, amount: 5000, comment: "Outstanding leadership this quarter" },
  ];

  for (const gift of giftData) {
    await prisma.gift.upsert({
      where: {
        campaignId_giverId_recipientId: {
          campaignId: campaign.id,
          giverId: gift.giverId,
          recipientId: gift.recipientId,
        },
      },
      update: {},
      create: {
        campaignId: campaign.id,
        ...gift,
      },
    });
  }

  console.log(`Seeded: ${allUsers.length} users, 1 campaign, ${giftData.length} gifts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
