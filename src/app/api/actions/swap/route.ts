import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
} from "@solana/actions";
import { actionErrorResponse, actionHeaders, iconUrl } from "../utils";
import axios from "axios";
import { initSdk } from "@/lib/raydium/config";
import { PublicKey } from "@solana/web3.js";
import { ApiV3Token } from "@raydium-io/raydium-sdk-v2";

const RAYDIUM_SWAP_TX_URL = "https://share.raydium.io/dialect/actions/swap/tx";

function getTokenMint(mint: string): PublicKey {
  if (mint.toLowerCase() === "sol") {
    return new PublicKey("So11111111111111111111111111111111111111112");
  } else {
    return new PublicKey(mint);
  }
}

function getDisplaySymbol(tokenData: ApiV3Token) {
  if (tokenData.symbol === "WSOL") {
    return "SOL"
  }

  return tokenData.symbol;
}

export const GET = async (req: Request) => {
  // Get query param from request url: inputMint, outputMint
  const params = new URL(req.url).searchParams;
  const inputMint = params.get("inputMint");
  const outputMint = params.get("outputMint");

  // If inputMint or outputMint is not provided, return error
  if (!inputMint || !outputMint) {
    return actionErrorResponse("inputMint and outputMint are required");
  }

  const baseHref = `/api/actions/swap?inputMint=${inputMint}&outputMint=${outputMint}`;

  // init raydium sdk
  const raydium = await initSdk();
  const [inputToken, outputToken] = await raydium.api.getTokenInfo([
    getTokenMint(inputMint),
    getTokenMint(outputMint),
  ]);

  console.log(inputToken, outputToken);

  if (!inputToken || !outputToken) {
    const missingMint = inputToken ? outputMint : inputMint;
    const payload: ActionGetResponse = {
      icon: iconUrl,
      title: `Token not found in Raydium`,
      description: `Token with mint ${missingMint} not found in Raydium. Please create a pool for your token first.`,
      label: `OK`,
    };
    return new Response(JSON.stringify(payload), {
      headers: actionHeaders,
    });
  }

  const [inputSymbol, outputSymbol] = [
    getDisplaySymbol(inputToken),
    getDisplaySymbol(outputToken),
  ];

  console.log(`swapping ${inputSymbol} for ${outputSymbol}`);

  const payload: ActionGetResponse = {
    icon: iconUrl,
    title: `Buy ${outputSymbol} with ${inputSymbol}`,
    description:
      `Choose a ${inputSymbol} amount from the options below or enter a custom amount.`,
    label: `Buy ${outputSymbol}`,
    links: {
      actions: [
        {
          label: `0.1 ${inputSymbol}`,
          href: `${baseHref}&amount=0.1`,
          type: "post",
        },
        {
          label: `1 ${inputSymbol}`,
          href: `${baseHref}&amount=1`,
          type: "post",
        },
        {
          label: `5 ${inputSymbol}`,
          href: `${baseHref}&amount=5`,
          type: "post",
        },
        {
          label: `Buy ${outputSymbol}`,
          href: `${baseHref}&amount={amount}`,
          parameters: [{ name: "amount", label: `Enter a custom amount` }],
          type: "post",
        },
      ],
    },
  };
  return Response.json(payload, { headers: actionHeaders });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  // Get query param from request url: inputMint, outputMint, amount
  const params = new URL(req.url).searchParams;
  const inputMint = params.get("inputMint");
  const outputMint = params.get("outputMint");
  const amount = params.get("amount");

  // If inputMint or outputMint is not provided, return error
  if (!inputMint || !outputMint) {
    return actionErrorResponse("inputMint and outputMint are required");
  }

  // If amount is not provided, return error
  if (!amount) {
    return actionErrorResponse("amount is required");
  }

  // get account public key from body
  const body: ActionPostRequest = await req.json();
  const account = body.account;

  // Construct the URL with inputMint, outputMint, and amount
  const raydiumSwapTxUrl = `${RAYDIUM_SWAP_TX_URL}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`;

  try {
    const raydiumPayload: ActionPostRequest = {
      account,
      type: "post",
    };
    const res = await axios.post(
      raydiumSwapTxUrl,
      raydiumPayload,
      actionHeaders
    );
    const txData = res.data;

    // console.log("txData", txData);

    if (!txData.transaction) {
      throw new Error("No transaction data found");
    }

    const payload: ActionPostResponse = {
      transaction: txData.transaction,
      type: "transaction",
    };

    return Response.json(payload, { headers: actionHeaders });
  } catch (error) {
    console.error(error);
    return actionErrorResponse("Failed to swap tokens");
  }
};
