import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SOLANA_CONNECTION } from "@/utils/solana";
import { getSolPriceInUSD } from "@/utils/solana";
import { createTipSchema, tipQuerySchema } from "@/schemas/tip";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  MessageCompiledInstruction,
} from "@solana/web3.js";

// Define a tolerance for SOL amount comparison (e.g., 0.001 SOL)
const SOL_AMOUNT_TOLERANCE = 0.001 * LAMPORTS_PER_SOL;

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

    const { submissionId, userWallet, amount, currency, transactionSignature } =
      validationResult.data;

    if (currency !== "USD") {
      return NextResponse.json(
        {
          error:
            "Only USD currency tips are currently supported via this endpoint.",
        },
        { status: 400 }
      );
    }

    const existingTip = await prisma.tip.findFirst({
      where: { transactionSignature },
    });
    if (existingTip) {
      return NextResponse.json(
        { error: "Transaction signature already used for a tip." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { wallet: userWallet },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Tipper user not found" },
        { status: 404 }
      );
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: { wallet: true },
        },
      },
    });
    if (!submission || !submission.user) {
      return NextResponse.json(
        { error: "Submission or submission owner not found" },
        { status: 404 }
      );
    }
    const recipientWallet = submission.user.wallet;

    if (userWallet === recipientWallet) {
      return NextResponse.json(
        { error: "Cannot tip your own submission." },
        { status: 400 }
      );
    }

    if (submission.currentTips + amount > submission.tipJarLimit) {
      return NextResponse.json(
        {
          error: `Tip amount ($${amount}) exceeds the remaining limit for this submission ($${(
            submission.tipJarLimit - submission.currentTips
          ).toFixed(2)}).`,
        },
        { status: 400 }
      );
    }

    const transaction = await SOLANA_CONNECTION.getTransaction(
      transactionSignature,
      { maxSupportedTransactionVersion: 0 }
    );

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found on-chain." },
        { status: 400 }
      );
    }

    if (transaction.meta?.err) {
      return NextResponse.json(
        {
          error: `On-chain transaction failed: ${JSON.stringify(
            transaction.meta.err
          )}`,
        },
        { status: 400 }
      );
    }

    const message = transaction.transaction.message;
    const instructions = message.compiledInstructions;
    const accountKeys = message.getAccountKeys().staticAccountKeys;

    const transferInstruction = instructions.find(
      (ix: MessageCompiledInstruction) => {
        const programId = accountKeys[ix.programIdIndex];
        return (
          programId.equals(SystemProgram.programId) &&
          ix.accountKeyIndexes.length === 2
        );
      }
    );

    if (!transferInstruction) {
      return NextResponse.json(
        {
          error:
            "Could not find valid SOL transfer instruction in transaction.",
        },
        { status: 400 }
      );
    }

    const senderAccountIndex = transferInstruction.accountKeyIndexes[0];
    const recipientAccountIndex = transferInstruction.accountKeyIndexes[1];
    const txSender = accountKeys[senderAccountIndex].toBase58();
    const txRecipient = accountKeys[recipientAccountIndex].toBase58();

    if (txSender !== userWallet) {
      return NextResponse.json(
        {
          error: `Transaction sender (${txSender}) does not match user wallet (${userWallet}).`,
        },
        { status: 400 }
      );
    }

    if (txRecipient !== recipientWallet) {
      return NextResponse.json(
        {
          error: `Transaction recipient (${txRecipient}) does not match submission owner wallet (${recipientWallet}).`,
        },
        { status: 400 }
      );
    }

    if (
      !transaction.meta?.preBalances ||
      !transaction.meta.postBalances ||
      transaction.meta.preBalances.length <= recipientAccountIndex ||
      transaction.meta.postBalances.length <= recipientAccountIndex
    ) {
      return NextResponse.json(
        {
          error:
            "Could not determine transaction amount due to missing balance info.",
        },
        { status: 400 }
      );
    }

    const lamportsTransferred =
      transaction.meta.postBalances[recipientAccountIndex] -
      transaction.meta.preBalances[recipientAccountIndex];

    if (lamportsTransferred <= 0) {
      return NextResponse.json(
        {
          error:
            "Transaction validation failed: Invalid transfer amount detected.",
        },
        { status: 400 }
      );
    }

    const solTransferred = lamportsTransferred / LAMPORTS_PER_SOL;

    const solPrice = await getSolPriceInUSD();
    const expectedSolAmount = amount / solPrice;

    const relativeDifference =
      Math.abs(solTransferred - expectedSolAmount) / expectedSolAmount;
    const RELATIVE_TOLERANCE = 0.05;

    if (relativeDifference > RELATIVE_TOLERANCE) {
      return NextResponse.json(
        {
          error: `Transaction SOL amount (${solTransferred.toFixed(
            6
          )}) differs too much (>${(RELATIVE_TOLERANCE * 100).toFixed(
            0
          )}%) from expected SOL amount (~${expectedSolAmount.toFixed(
            6
          )}) for $${amount}. Significant price change or invalid amount?`,
        },
        { status: 400 }
      );
    }

    const newTip = await prisma.tip.create({
      data: {
        submissionId,
        userId: user.id,
        amount: amount,
        currency: "USD",
        transactionSignature,
      },
    });

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        currentTips: {
          increment: amount,
        },
      },
    });

    return NextResponse.json(newTip, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Internal Server Error: ${error.message}` },
        { status: 500 }
      );
    }
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
    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      select: { tipJarLimit: true },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(submission.tipJarLimit);
  } catch (error) {
    console.error("Error retrieving tip jar limit:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
