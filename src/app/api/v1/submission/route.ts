import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSubmissionSchema } from "@/schemas/submission";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validationResult = createSubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { wallet, title, link, geolocation, description, tipJarLimit } =
      validationResult.data;

    let user = await prisma.user.findUnique({
      where: { wallet },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { wallet },
      });
    }

    let geoString;
    if (typeof geolocation === "string") {
      try {
        const parsed = JSON.parse(geolocation);
        geoString = JSON.stringify(parsed);
      } catch {
        geoString = geolocation;
      }
    } else {
      geoString = JSON.stringify(geolocation);
    }

    const newSubmission = await prisma.submission.create({
      data: {
        userId: user.id,
        title,
        link,
        geolocation: geoString,
        description,
        ...(tipJarLimit && { tipJarLimit: parseFloat(String(tipJarLimit)) }),
      },
    });

    return NextResponse.json(newSubmission, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "9");
    const offset = (page - 1) * limit;
    const showAll = searchParams.get("showAll") === "true";
    const status = searchParams.get("status");
    const wallet = searchParams.get("wallet");

    const where: Prisma.SubmissionWhereInput = {};

    if (!showAll && !status && !wallet) {
      where.status = "APPROVED" as Prisma.EnumSubmissionStatusFilter;
    } else if (status) {
      where.status = status as Prisma.EnumSubmissionStatusFilter;
    }

    if (wallet) {
      const user = await prisma.user.findUnique({
        where: { wallet },
        select: { id: true },
      });

      if (user) {
        where.userId = user.id;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.submission.count({ where });

    const submissions = await prisma.submission.findMany({
      where,
      select: {
        id: true,
        userId: true,
        title: true,
        link: true,
        description: true,
        geolocation: true,
        currentTips: true,
        tipJarLimit: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
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
        let parsedGeolocation = sub.geolocation;
        if (typeof sub.geolocation === "string") {
          try {
            parsedGeolocation = JSON.parse(sub.geolocation);
          } catch {
            parsedGeolocation = sub.geolocation;
          }
        }

        return {
          ...sub,
          userWallet: sub.user?.wallet || "",
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
    console.error("Error retrieving submissions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
