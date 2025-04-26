import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

export const SOLANA_CONNECTION = new Connection(SOLANA_RPC_URL, "confirmed");

export async function sendSolTip(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amount: number,
  signTransaction: (transaction: Transaction) => Promise<Transaction>
) {
  const lamports = Math.round(amount * LAMPORTS_PER_SOL);
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    })
  );

  const { blockhash } = await SOLANA_CONNECTION.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  const signedTransaction = await signTransaction(transaction);
  const signature = await SOLANA_CONNECTION.sendRawTransaction(
    signedTransaction.serialize()
  );
  await SOLANA_CONNECTION.confirmTransaction(signature);

  return signature;
}

export async function getWalletBalance(publicKey: PublicKey): Promise<number> {
  const balance = await SOLANA_CONNECTION.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

export async function getSolPriceInUSD(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112"
    );
    const data = await response.json();
    return data.data.So11111111111111111111111111111111111111112.price;
  } catch (error) {
    console.error("Error fetching SOL price:", error);
    return 0;
  }
}
