import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Define the type to match the structure returned by Prisma query
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

    // Fetch the top tipped submissions
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

    // Process the submissions to transform the geolocation to a less precise format
    const processedSubmissions = topSubmissions.map(
      (submission: TopSubmission) => {
        // Parse geolocation from string to object
        let geoObj: { formattedAddress?: string } = {};
        try {
          geoObj =
            typeof submission.geolocation === "string"
              ? JSON.parse(submission.geolocation)
              : submission.geolocation;
        } catch {
          geoObj = { formattedAddress: submission.geolocation };
        }

        // Extract region or country from the address (less precise)
        let generalLocation = "Unknown";
        if (geoObj && geoObj.formattedAddress) {
          const addressParts = geoObj.formattedAddress
            .split(",")
            .map((part: string) => part.trim());

          // If we have enough parts, take the state/province and country
          if (addressParts.length > 1) {
            // Try to extract state or country (usually last 1-2 parts of the address)
            // Prefer the second last part (usually state/province) if available
            generalLocation = addressParts.slice(-2).join(", ");

            // If the address only has city and country, just use the country
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
  } catch (error) {
    console.error("Error retrieving leaderboard data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
