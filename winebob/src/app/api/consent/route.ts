import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteUserData } from "@/lib/consent";

export const dynamic = "force-dynamic";

/**
 * GET /api/consent — returns the current user's consent settings.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.userConsent.findUnique({
      where: { userId: session.user.id },
    });
    const consent = existing ?? await prisma.userConsent.create({
      data: { userId: session.user.id },
    });

    return Response.json({
      analyticsConsent: consent.analyticsConsent,
      enhancedConsent: consent.enhancedConsent,
      researchConsent: consent.researchConsent,
      consentUpdatedAt: consent.consentUpdatedAt.toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Consent GET error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/consent — updates the current user's consent settings.
 * Body: { analyticsConsent?: boolean, enhancedConsent?: boolean, researchConsent?: boolean }
 */
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { analyticsConsent, enhancedConsent, researchConsent } = body as {
      analyticsConsent?: boolean;
      enhancedConsent?: boolean;
      researchConsent?: boolean;
    };

    const existingConsent = await prisma.userConsent.findUnique({
      where: { userId: session.user.id },
    });
    const consent = existingConsent
      ? await prisma.userConsent.update({
          where: { userId: session.user.id },
          data: {
            ...(analyticsConsent !== undefined && { analyticsConsent }),
            ...(enhancedConsent !== undefined && { enhancedConsent }),
            ...(researchConsent !== undefined && { researchConsent }),
            consentUpdatedAt: new Date(),
          },
        })
      : await prisma.userConsent.create({
          data: {
            userId: session.user.id,
            analyticsConsent: analyticsConsent ?? true,
            enhancedConsent: enhancedConsent ?? false,
            researchConsent: researchConsent ?? false,
            consentUpdatedAt: new Date(),
          },
        });

    return Response.json({
      analyticsConsent: consent.analyticsConsent,
      enhancedConsent: consent.enhancedConsent,
      researchConsent: consent.researchConsent,
      consentUpdatedAt: consent.consentUpdatedAt.toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Consent PUT error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/consent — deletes the user's analytics data (GDPR right to erasure).
 */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await deleteUserData();

    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Consent DELETE error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
