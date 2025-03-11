import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SOLANA_CONNECTION } from "@/utils/solana";
import { getSolPriceInUSD } from "@/utils/solana";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, userWallet, amount, currency, transactionSignature } =
      body;

    if (
      !submissionId ||
      !userWallet ||
      !amount ||
      !currency ||
      !transactionSignature
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transaction = await SOLANA_CONNECTION.getTransaction(
      transactionSignature
    );
    if (!transaction) {
      return NextResponse.json(
        { error: "Invalid transaction" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { wallet: userWallet },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const solPrice = await getSolPriceInUSD();
    const amountUSD = amount * solPrice;

    const newTip = await prisma.tip.create({
      data: {
        submissionId,
        userId: user.id,
        amount: amountUSD,
        currency: "USD",
        transactionSignature,
      },
    });

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        currentTips: {
          increment: amountUSD,
        },
      },
    });

    return NextResponse.json(newTip, { status: 201 });
  } catch (error) {
    console.error("Error creating tip:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("submissionId");

  if (!query)
    return NextResponse.json(
      { Error: "Please provide the query params || Invalid submissionId" },
      { status: 400 }
    );

  try {
    const result = await prisma.submission.findMany({
      where: {
        id: query,
      },
    });
    return NextResponse.json(result[0].tipJarLimit);
  } catch (error) {
    return console.error("Error fetching tip jar limit:", error);
  }
}
