import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SOLANA_CONNECTION } from "@/utils/solana";
import { getSolPriceInUSD } from "@/utils/solana";
import { createTipSchema, tipQuerySchema } from "@/schemas/tip";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = createTipSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { submissionId, userWallet, amount, transactionSignature } =
      validationResult.data;

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

  const validationResult = tipQuerySchema.safeParse({ submissionId: query });

  if (!validationResult.success) {
    return NextResponse.json(
      { error: validationResult.error.format() },
      { status: 400 }
    );
  }

  const { submissionId } = validationResult.data;

  try {
    const result = await prisma.submission.findMany({
      where: {
        id: submissionId,
      },
    });

    if (!result.length) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0].tipJarLimit);
  } catch (error) {
    console.error("Error retrieving tip jar limit:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
