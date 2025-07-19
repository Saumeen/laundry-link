import { NextResponse } from "next/server";
import { requireAdminRoles, createAdminAuthErrorResponse } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    // Require SUPER_ADMIN role
    await requireAdminRoles(["SUPER_ADMIN"]);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30';

    // For now, return a simple JSON response
    // In a real implementation, you would generate a PDF here using libraries like puppeteer or jsPDF
    const exportData = {
      reportType: 'Analytics Report',
      dateRange: `${range} days`,
      generatedAt: new Date().toISOString(),
      summary: {
        message: 'This is a placeholder for PDF export functionality.',
        note: 'To implement actual PDF generation, you would need to add libraries like puppeteer, jsPDF, or similar.'
      }
    };

    // Return JSON for now - in production you'd return a PDF blob
    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="laundry-reports-${range}days-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error('Error exporting report:', error);
    
    if (error instanceof Error && (error.message === 'Admin authentication required' || error.message.includes('Access denied'))) {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
} 