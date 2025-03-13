import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_WALLET = "7fDgaeRcsY8jdrECFc5qAJkwpuY8qqGbx2RYiVKomyMh";

async function isAdmin(wallet: string): Promise<boolean> {
  if (wallet !== ADMIN_WALLET) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { wallet },
    select: { isAdmin: true },
  });

  if (!user) {
    await prisma.user.create({
      data: {
        wallet,
        isAdmin: true,
      },
    });
    return true;
  }

  if (!user.isAdmin) {
    await prisma.user.update({
      where: { wallet },
      data: { isAdmin: true },
    });
  }

  return true;
}

const updateSubmissionSchema = z.object({
  wallet: z.string(),
  submissionId: z.string(),
  status: z.enum(["PENDING", "REJECTED", "APPROVED"]),
  rejectionReason: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!(await isAdmin(wallet))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;
    const total = await prisma.submission.count({ where });

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        user: {
          select: {
            wallet: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    return NextResponse.json({
      submissions: submissions.map((sub) => {
        let parsedGeolocation;
        try {
          parsedGeolocation = JSON.parse(sub.geolocation);
        } catch {
          parsedGeolocation = sub.geolocation;
        }

        return {
          ...sub,
          userWallet: sub.user.wallet,
          geolocation: parsedGeolocation,
        };
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error retrieving submissions for admin:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const validationResult = updateSubmissionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { wallet, submissionId, status, rejectionReason } =
      validationResult.data;

    if (!(await isAdmin(wallet))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const existingSubmission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status,
        ...(rejectionReason && { rejectionReason }),
      },
    });

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("Error updating submission status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
