import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TopSubmission = {
  id: string;
  title: string;
  link: string;
  description: string;
  geolocation: string;
  currentTips: number;
  tipJarLimit: number;
  createdAt: Date;
  tips: { amount: number; currency: string }[];
  user: { wallet: string } | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const topSubmissions = await prisma.submission.findMany({
      where: {
        status: "APPROVED",
      },
      select: {
        id: true,
        title: true,
        link: true,
        description: true,
        geolocation: true,
        currentTips: true,
        tipJarLimit: true,
        createdAt: true,
        tips: {
          select: {
            amount: true,
            currency: true,
          },
        },
        user: {
          select: {
            wallet: true,
          },
        },
      },
      orderBy: {
        currentTips: "desc",
      },
      take: limit,
    });

    const processedSubmissions = topSubmissions.map(
      (submission: TopSubmission) => {
        let geoObj: { formattedAddress?: string } = {};
        try {
          geoObj =
            typeof submission.geolocation === "string"
              ? JSON.parse(submission.geolocation)
              : submission.geolocation;
        } catch {
          geoObj = { formattedAddress: submission.geolocation };
        }

        let generalLocation = "Unknown";
        if (geoObj && geoObj.formattedAddress) {
          const addressParts = geoObj.formattedAddress
            .split(",")
            .map((part: string) => part.trim());

          if (addressParts.length > 1) {
            generalLocation = addressParts.slice(-2).join(", ");

            if (addressParts.length === 2) {
              generalLocation = addressParts[1];
            }
          } else {
            generalLocation = geoObj.formattedAddress;
          }
        }

        return {
          id: submission.id,
          title: submission.title,
          link: submission.link,
          description: submission.description,
          currentTips: submission.currentTips,
          tipJarLimit: submission.tipJarLimit,
          createdAt: submission.createdAt,
          region: generalLocation,
          userWallet: submission.user?.wallet || "",
          tipCount: submission.tips.length,
        };
      }
    );

    return NextResponse.json({
      leaderboard: processedSubmissions,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
