import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SystemInstruction, SystemProgram, Transaction } from "@solana/web3.js";
import { buildCreateMintTransaction } from "../transactions";
import { actionErrorResponse, actionHeaders, getElizaUrl } from "../utils";

export const GET = async (req: Request) => {
  try {
    const baseHref = "/api/actions/create-meme";
    const payload: ActionGetResponse = {
      title: "Launch your own agent meme coin",
      icon: "https://pbs.twimg.com/profile_images/1864314913881247749/8Hpvmc43.jpg",
      description: "Launch your own agent meme coin",
      label: "Launch",
      links: {
        actions: [
          {
            label: "Create your meme coin", // button text
            href: `${baseHref}?tokenName={tokenName}&agentName={agentName}&solToSpend={solToSpend}&tokenTicker={tokenTicker}&mediaUrl={mediaUrl}&bio={bio}&lore={lore}&style={style}&knowledge={knowledge}&adjectives={adjectives}&twitterUsername={twitterUsername}&twitterEmail={twitterEmail}&twitterPassword={twitterPassword}&telegramToken={telegramToken}`,
            type: "post",
            parameters: [
              {
                name: "tokenName",
                label: "Token name (e.g. 'My Meme Coin')",
                required: true,
              },
              {
                name: "agentName",
                label: "Agent name (e.g. 'My Meme Bot')",
                required: true,
              },
              {
                name: "solToSpend",
                label: "The initial fee sent to the agent",
                required: true,
              },
              {
                name: "tokenTicker",
                label: "Token ticker (e.g. 'MEME')",
                required: true,
              },
              {
                name: "mediaUrl",
                label: "Agent profile picture or video URL",
                required: true,
              },
              {
                name: "bio",
                label: "Write a brief overview of your AI Agent",
                type: "textarea",
                required: true,
              },
              {
                name: "lore",
                label: "Write lore about your agent. Separate by ,'s",
                type: "textarea",
                required: true,
              },
              {
                name: "style",
                label: "Write your agent's response style. Separate by ,'s",
                type: "textarea",
                required: true,
              },
              {
                name: "knowledge",
                label: "Give your agent some knowledge. Separate by ,'s",
                type: "textarea",
                required: true,
              },
              {
                name: "adjectives",
                label: "Give your agent some adjectives. Separate by ,'s",
                type: "textarea",
                required: true,
              },
              {
                name: "twitterUsername",
                label: "Twitter Username (for tweeting the meme)",
                required: true,
              },
              {
                name: "twitterEmail",
                label: "Twitter Email (for tweeting the meme)",
                required: true,
              },
              {
                name: "twitterPassword",
                label: "Twitter Password (for tweeting the meme)",
                required: true,
              },
              {
                name: "telegramToken",
                label: "Telegram Token (for sending the meme)",
              },
            ],
          },
        ],
      },
    };

    return Response.json(payload, {
      headers: actionHeaders,
    });
  } catch (err) {
    console.error(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return actionErrorResponse(message);
  }
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const body: ActionPostRequest = await req.json();

    const requestUrl = new URL(req.url);

    const params = requestUrl.searchParams;
    console.log(params);

    const tokenName = params.get("tokenName");
    const agentName = params.get("agentName");
    const solToSpend = params.get("solToSpend");
    const tokenTicker = params.get("tokenTicker");
    const mediaUrl = params.get("mediaUrl");
    const bio = params.get("bio");
    const lore = params.get("lore");
    const style = params.get("style");
    const knowledge = params.get("knowledge");
    const adjectives = params.get("adjectives");
    const twitterUsername = params.get("twitterUsername");
    const twitterEmail = params.get("twitterEmail");
    const twitterPassword = params.get("twitterPassword");
    const telegramToken = params.get("telegramToken");

    if (
      !tokenName ||
      !agentName ||
      !solToSpend ||
      !tokenTicker ||
      !mediaUrl ||
      !bio ||
      !lore ||
      !style ||
      !knowledge ||
      !adjectives ||
      !twitterUsername ||
      !twitterEmail ||
      !twitterPassword ||
      !telegramToken
    ) {
      return actionErrorResponse("All fields are required");
    }

    const solToSpendNumber = parseFloat(solToSpend);
    if (isNaN(solToSpendNumber)) {
      return actionErrorResponse("Invalid SOL amount provided");
    }

    if (solToSpendNumber <= 0) {
      return actionErrorResponse("SOL amount must be greater than 0");
    }

    // 创建 agent twitter
    const response = await fetch(getElizaUrl("/MemeVerse/form"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        tokenName,
        agentName,
        tokenTicker,
        prompt,
        mediaUrl,
        ...body.data,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to submit config");
    }

    const data = await response.json();

    if (!data.publicKey) {
      throw new Error("Failed to create agent");
    }

    const agentPublicKey = new PublicKey(data.publicKey);

    // validate the client provided input
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return actionErrorResponse("Invalid account provided");
    }

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const transaction = new Transaction();

    // Send some SOL to the agent wallet
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: agentPublicKey,
        lamports: BigInt(solToSpendNumber * LAMPORTS_PER_SOL),
      })
    );

    // set the end user as the fee payer
    transaction.feePayer = account;

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: "Agent launched",
        type: "transaction",
      },
    });

    return Response.json(payload, {
      headers: actionHeaders,
    });
  } catch (err) {
    console.error("ERROR", err);
    let message = "Failed to launch agent";
    if (typeof err == "string") message = err;
    return actionErrorResponse(message);
  }
};
