import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";
import { Connection, PublicKey } from "@solana/web3.js";
import { buildCreateMintTransaction } from "../transactions";
import { actionHeaders } from "../utils";

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
            href: `${baseHref}?tokenName={tokenName}&agentName={agentName}&tokenTicker={tokenTicker}&prompt={prompt}&mediaUrl={mediaUrl}`,
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
                label: "SOL to spend on creating meme (1, 0.1, 0.01)",
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
                name: "prompt",
                label: "Prompt the agent to help you create a meme",
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
    return new Response(message, {
      status: 400,
      headers: actionHeaders,
    });
  }
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const body: ActionPostRequest = await req.json();

    const requestUrl = new URL(req.url);

    const params = requestUrl.searchParams;

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
          headers: actionHeaders,
        }
      );
    }

    // 创建 agent twitter
    const response = await fetch("http://localhost:3000/MemeVerse/form", {
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
          headers: actionHeaders,
        }
      );
    }

    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    const transaction = await buildCreateMintTransaction(
      connection,
      account,
      9
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
        links: {
          next: {
            type: "inline",
            action: {
              icon: "https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/",
              label: "Create",
              title: "Create token account",
              type: "action",
              description: "Create an account for the token",
            },
          },
        },
      },
    });

    return Response.json(payload, {
      headers: actionHeaders,
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
        headers: actionHeaders,
      }
    );
  }
};
