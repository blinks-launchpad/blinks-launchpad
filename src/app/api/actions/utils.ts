import { AnchorProvider } from "@coral-xyz/anchor";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { createActionHeaders } from "@solana/actions";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { createTransferInstruction, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { DEFAULT_DECIMALS } from "pumpdotfun-sdk";

export const iconUrl =
  "https://pbs.twimg.com/profile_images/1864314913881247749/8Hpvmc43.jpg";

export const actionHeaders = createActionHeaders({
  chainId: "mainnet-beta", // or chainId: "devnet"
  actionVersion: "2.2.1", // the desired spec version
});

export const actionErrorResponse = (message: string) => {
  return Response.json(
    {
      message,
    },
    {
      status: 400,
      headers: actionHeaders,
    }
  );
};

export const getElizaUrl = (path: string) => {
  if (!path.startsWith("/")) path = `/${path}`;
  const baseUrl = process.env.NEXT_PUBLIC_ELIZA_BASE_URL;
  return `${baseUrl}${path}`;
};

export const getProvider = () => {
  const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY!;
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC_URL!);
  const provider = new AnchorProvider(connection, new NodeWallet(keypair), {
    commitment: "finalized",
  });
  return provider;
};

export async function transferSplTokens(
  connection: Connection,
  payer: Keypair,
  fromWallet: Keypair,
  toAddress: PublicKey,
  tokenMint: PublicKey,
  amount: number
) {
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenMint,
    fromWallet.publicKey
  );

  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenMint,
    toAddress
  );

  const transaction = new Transaction().add(
    createTransferInstruction(
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet.publicKey,
      amount * (10 ** DEFAULT_DECIMALS),
      []
    )
  );

  await sendAndConfirmTransaction(connection, transaction, [fromWallet]);
}

export async function getSplTokenBalance(
  connection: Connection,
  payer: Keypair,
  tokenMint: PublicKey,
  userAccount: PublicKey
) {
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenMint,
    userAccount
  );

  const balance = await connection.getTokenAccountBalance(tokenAccount.address);
  if (!balance.value.uiAmount) {
    return 0;
  }
  return balance.value.uiAmount;
}
