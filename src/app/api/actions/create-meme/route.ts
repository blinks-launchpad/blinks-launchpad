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
} from "@solana/web3.js";
import { 
  createMint,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID 
} from "@solana/spl-token";

const headers = createActionHeaders({
  chainId: "devnet", // or chainId: "devnet"
  actionVersion: "2.2.1", // the desired spec version
});

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
            href: `${baseHref}?tokenName={tokenName}&agentName={agentName}&prompt={prompt}&mediaUrl={mediaUrl}`,
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
    const prompt = params.get("prompt");
    const mediaUrl = params.get("mediaUrl");

    // mock the other data required for meme creation
    const tokenTicker = "MEME";

    const body: ActionPostRequest = await req.json();

    // validate the client provided input
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers,
      });
    }

    // Create a connection to the Solana devnet
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Generate a new keypair for the token's mint authority
    const mintAuthority = Keypair.generate();

    // Create a new token mint
    const mint = await createMint(
      connection,
      mintAuthority, // payer
      mintAuthority.publicKey, // mint authority
      null, // freeze authority (none)
      9 // decimals
    );

    // Log the new token's mint address
    console.log("Token Mint Address:", mint.toBase58());

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction: new Transaction(),
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
    return new Response(message, {
      status: 400,
      headers,
    });
  }
};
