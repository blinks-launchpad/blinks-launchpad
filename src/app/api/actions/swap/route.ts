import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
} from "@solana/actions";
import { actionErrorResponse, actionHeaders } from "../utils";
import axios from "axios";

const RAYDIUM_SWAP_TX_URL = "https://share.raydium.io/dialect/actions/swap/tx";

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

  const payload: ActionGetResponse = {
    icon: "https://img-v1.raydium.io/share/b11dae84-5676-453c-9989-e17d021a1fc2.png",
    title: "Buy RAY with SOL",
    description:
      "Choose a SOL amount from the options below or enter a custom amount.",
    label: "Buy RAY",
    links: {
      actions: [
        {
          label: "0.1 SOL",
          href: `${baseHref}&amount=0.1`,
          type: "post",
        },
        {
          label: "1 SOL",
          href: `${baseHref}&amount=1`,
          type: "post",
        },
        {
          label: "5 SOL",
          href: `${baseHref}&amount=5`,
          type: "post",
        },
        {
          label: "Buy RAY",
          href: `${baseHref}&amount={amount}`,
          parameters: [{ name: "amount", label: "Enter a custom amount" }],
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
  }
};
