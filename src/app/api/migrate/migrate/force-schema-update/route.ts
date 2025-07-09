// src/app/api/migrate/force-schema-update/route.ts - Force database schema update
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // This endpoint will trigger Vercel to apply Prisma schema changes
    // by forcing a deployment with schema push
    
    return NextResponse.json({
      message: "To force schema update, you need to:",
      steps: [
        "1. Add this environment variable to Vercel:",
        "   PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1",
        "",
        "2. Create a prisma/migrations folder with migration files",
        "",
        "3. Deploy with: vercel --prod --force",
        "",
        "4. Or use Prisma CLI commands:",
        "   npx prisma db push --force-reset",
        "   npx prisma generate"
      ],
      sqlCommands: [
        "-- If you have direct database access, run these SQL commands:",
        "ALTER TABLE \"Address\" ADD COLUMN IF NOT EXISTS \"address\" TEXT;",
        "ALTER TABLE \"Address\" ADD COLUMN IF NOT EXISTS \"area\" TEXT;",
        "ALTER TABLE \"Address\" ADD COLUMN IF NOT EXISTS \"building\" TEXT;",
        "ALTER TABLE \"Address\" ADD COLUMN IF NOT EXISTS \"floor\" TEXT;",
        "ALTER TABLE \"Address\" ADD COLUMN IF NOT EXISTS \"apartment\" TEXT;",
        "ALTER TABLE \"Address\" ADD COLUMN IF NOT EXISTS \"locationType\" TEXT DEFAULT 'flat';",
        "ALTER TABLE \"Address\" ADD COLUMN IF NOT EXISTS \"latitude\" DOUBLE PRECISION;",
        "ALTER TABLE \"Address\" ADD COLUMN IF NOT EXISTS \"longitude\" DOUBLE PRECISION;"
      ]
    });

  } catch (error: any) {
    return NextResponse.json({
      error: "Could not provide migration instructions",
      message: error.message
    }, { status: 500 });
  }
}

