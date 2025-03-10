import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, title, link, geolocation, description } = body;

    if (!wallet || !title || !link || !geolocation || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { wallet },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { wallet },
      });
    }

    const newSubmission = await prisma.submission.create({
      data: {
        userId: user.id,
        title,
        link,
        geolocation,
        description,
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

export async function GET() {
  try {
    const submissions = await prisma.submission.findMany({
      select: {
        id: true,
        userId: true,
        title: true,
        link: true,
        currentTips: true,
        tipJarLimit: true,
        user: {
          select: {
            wallet: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      submissions.map((sub) => ({
        ...sub,
        userWallet: sub.user.wallet,
      }))
    );
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
