import { Wallet } from "@coral-xyz/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import { createActionHeaders } from "@solana/actions";
import { clusterApiUrl } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

export const iconUrl =
  "https://pbs.twimg.com/profile_images/1864314913881247749/8Hpvmc43.jpg";

export const actionHeaders = createActionHeaders({
  chainId: "devnet", // or chainId: "devnet"
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
  return `http://localhost:3000${path}`;
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
