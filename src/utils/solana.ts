import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export const SOLANA_CONNECTION = new Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

export async function sendSolTip(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amount: number,
  signTransaction: (transaction: Transaction) => Promise<Transaction>
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: amount * LAMPORTS_PER_SOL,
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
