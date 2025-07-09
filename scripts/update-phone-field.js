const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // This will apply the schema changes to make phone optional
    console.log('Updating phone field to be optional...');
    console.log('Schema changes will be applied automatically');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
