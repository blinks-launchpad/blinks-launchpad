import { ActionGetResponse, ActionPostRequest, ActionPostResponse, createPostResponse } from "@solana/actions";
import { actionErrorResponse, actionHeaders, iconUrl } from "../../utils";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

export const GET = async (req: Request) => {
  const params = new URL(req.url).searchParams;
  const token = params.get("token");
  if (!token) {
    return actionErrorResponse("Token is required");
  }

  console.log({ token });

  const baseHref = `/api/actions/swap/buy?token=${token}`;
  const payload: ActionGetResponse = {
    icon: iconUrl,
    label: "Buy Meme coin from me",
    title: "Buy Meme coin from the agent",
    description:
      "Buy Meme coin with SOL. Choose from the options below, or enter a custom amount.",
    links: {
      actions: [
        {
          type: "post",
          label: "0.01 SOL",
          href: `${baseHref}&amount=0.01`,
        },
        {
          type: "post",
          label: "0.1 SOL",
          href: `${baseHref}&amount=0.1`,
        },
        {
          type: "post",
          label: "1 SOL",
          href: `${baseHref}&amount=1`,
        },
        {
          type: "post",
          href: `${baseHref}&amount={amount}`,
          label: "Buy Meme coin",
          parameters: [
            {
              type: "number",
              name: "amount",
              label: "Enter a custom SOL amount",
            },
          ],
        },
      ],
    },
  };

  return Response.json(payload, {
    headers: actionHeaders,
  });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  const body: ActionPostRequest = await req.json();
  const requestUrl = new URL(req.url);
  const params = requestUrl.searchParams;

  const token = params.get("token");
  const amount = params.get("amount");

  console.log({ token, amount });

  if (!token || !amount) {
    return actionErrorResponse("Token and amount are required");
  }

  const amountNumber = parseFloat(amount);
  if (isNaN(amountNumber)) {
    return actionErrorResponse("Invalid amount provided");
  }

  if (amountNumber <= 0.0005) {
    return actionErrorResponse("Amount must be greater than 0.0005");
  }

  let account: PublicKey;
  try {
    account = new PublicKey(body.account);
  } catch (e) {
    console.error(e);
    return actionErrorResponse("Invalid account provided");
  }

  // TODO: send SOL to the "agent" wallet
  try {
    const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY!;
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    const connection = new Connection(
      clusterApiUrl("mainnet-beta"),
      "confirmed"
    );

    try {
      const res = await fetch("https://rpc.api-pump.fun/trade", {
        method: "POST",
        body: JSON.stringify({
          mode: "buy",
          token,
          amount: amountNumber * 0.95 * LAMPORTS_PER_SOL,
          amountInSol: true,
          slippage: 0.05,
          priorityFee: 100000,
          private: privateKey,
        }),
      });

      if (res.status !== 200) {
        console.error(res);
        throw new Error("Trade request failed");
      }

      const data = await res.json();
      console.log({ data });
    } catch (e) {
      console.error(e);
      return actionErrorResponse("Failed to buy Meme coin");
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: keypair.publicKey,
        lamports: BigInt(amountNumber * LAMPORTS_PER_SOL),
      })
    );

    transaction.feePayer = account;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: "Meme coin bought",
        type: "transaction",
      },
    });

    return Response.json(payload, {
      headers: actionHeaders,
    });
  } catch (e) {
    console.error(e);
    return actionErrorResponse("Failed to buy Meme coin");
  }
};
