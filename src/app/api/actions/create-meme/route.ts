import {
  ActionPostResponse,
  createActionHeaders,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";

import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
} from "@solana/web3.js";

import {
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { buildTokenCreationTransaction } from "./utils";

const headers = createActionHeaders({
  chainId: "devnet", // or chainId: "devnet"
  actionVersion: "2.2.1", // the desired spec version
});

const INITIAL_MINT_AMOUNT = 1000000; // 1 million

export const GET = async (req: Request) => {
  try {
    const baseHref = "/api/actions/create-meme";
    const payload: ActionGetResponse = {
      title: "Launch your own agent meme coin",
      icon: "https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/",
      description: "Launch your own agent meme coin",
      label: "Launch",
      links: {
        actions: [
          {
            label: "Launch your meme coin", // button text
            href: `${baseHref}?tokenName={tokenName}&agentName={agentName}&tokenTicker={tokenTicker}&prompt={prompt}&mediaUrl={mediaUrl}`,
            type: "post",
            parameters: [
              {
                name: "tokenName",
                label: "Token name",
              },
              {
                name: "agentName",
                label: "Agent name",
              },
              {
                name: "tokenTicker",
                label: "Token ticker",
              },
              {
                name: "mediaUrl",
                label: "Picture or video URL",
              },
              {
                name: "prompt",
                label: "Prompt the agent to help you create a meme",
                type: "textarea",
              },
            ],
          },
        ],
      },
    };

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.error(err);

    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers,
    });
  }
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);

    const params = requestUrl.searchParams;
    console.log(params);

    const tokenName = params.get("tokenName");
    const agentName = params.get("agentName");
    const tokenTicker = params.get("tokenTicker");
    const prompt = params.get("prompt");
    const mediaUrl = params.get("mediaUrl");

    if (!tokenName || !agentName || !tokenTicker || !prompt || !mediaUrl) {
      return Response.json(
        {
          message: "All fields are required",
        },
        {
          status: 400,
          headers,
        }
      );
    }

    const body: ActionPostRequest = await req.json();

    // validate the client provided input
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return Response.json(
        {
          message: "Invalid account provided",
        },
        {
          status: 400,
          headers,
        }
      );
    }

    const connection = new Connection("http://localhost:8899", "confirmed");
    const transaction = await buildTokenCreationTransaction(
      account,
      {
        name: tokenName,
        symbol: tokenTicker,
        totalSupply: INITIAL_MINT_AMOUNT,
        decimals: 9,
      },
      connection
    );

    // set the end user as the fee payer
    transaction.feePayer = account;

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: "Meme created",
        type: "transaction",
      },
    });

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.error("ERROR", err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return Response.json(
      {
        message,
      },
      {
        status: 400,
        headers,
      }
    );
  }
};

async function buildCreateMintTransaction(
  connection: Connection,
  payer: PublicKey,
  decimals: number
): Promise<Transaction> {
  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  const accountKeypair = Keypair.generate();
  const programId = TOKEN_2022_PROGRAM_ID;

  const associatedTokenAddress = await getAssociatedTokenAddress(
    accountKeypair.publicKey,
    payer,
    false
  );

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: accountKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId,
    }),
    createInitializeMintInstruction(
      accountKeypair.publicKey,
      decimals,
      payer,
      payer,
      programId
    ),
    createAssociatedTokenAccountInstruction(
      payer,
      associatedTokenAddress,
      payer,
      accountKeypair.publicKey,
      programId
    )
  );

  return transaction;
}
