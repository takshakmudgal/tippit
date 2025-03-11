import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, title, link, geolocation, description, tipJarLimit } = body;

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
  } catch {
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
        description: true,
        geolocation: true,
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
      submissions.map((sub) => {
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
          userWallet: sub.user.wallet,
          geolocation: parsedGeolocation,
        };
      })
    );
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
