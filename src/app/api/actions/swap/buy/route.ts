import { ActionGetResponse, ActionPostRequest } from "@solana/actions";
import { actionErrorResponse, actionHeaders, iconUrl } from "../../utils";
import { PublicKey } from "@solana/web3.js";

export const GET = async (
  req: Request
) => {
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
      "Buy Meme coin with SOL. Choose from the options below, or enter a custom amount.\n",
    links: {
      actions: [
        {
          type: "post",
          label: "0.01 SOL",
          href: `${baseHref}/0.01`,
        },
        {
          type: "post",
          label: "0.1 SOL",
          href: `${baseHref}/0.1`,
        },
        {
          type: "post",
          label: "1 SOL",
          href: `${baseHref}/1`,
        },
        {
          type: "post",
          href: `${baseHref}/{amount}`,
          label: "Buy Meme coin",
          parameters: [
            {
              type: "number",
              min: 0.01,
              required: true,
              name: "amount",
              label: "Enter a custom SOL amount",
            },
          ],
        },
      ],
    },
  };

  return Response.json(payload, actionHeaders);
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

  if (amountNumber <= 0.01) {
    return actionErrorResponse("Amount must be greater than 0.01");
  }

  let account: PublicKey;
  try {
    account = new PublicKey(body.account);
  } catch (e) {
    console.error(e);
    return actionErrorResponse("Invalid account provided");
  }

  // TODO: send SOL to the agent wallet
};
