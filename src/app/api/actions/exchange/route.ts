import {
  createActionHeaders,
  ActionGetResponse,
  ActionPostResponse,
  createPostResponse,
  ActionPostRequest,
} from "@solana/actions";
import { PublicKey, Transaction } from "@solana/web3.js";

const headers = createActionHeaders({
  chainId: "devnet", // or chainId: "devnet"
  actionVersion: "2.2.1", // the desired spec version
});

export const GET = async (req: Request) => {
  try {
    const baseHref = "/api/actions/exchange";
    const payload: ActionGetResponse = {
      title: "Exchange meme coin",
      icon: "https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/",
      description: "Exchange your meme coin",
      label: "Exchange",
      links: {
        actions: [
          {
            label: "0.01 SOL", // button text
            href: `${baseHref}?amount=10`,
            type: "post",
            // no `parameters` therefore not a text input field
          },
          {
            label: "0.1 SOL", // button text
            href: `${baseHref}?amount=100`,
            type: "post",
            // no `parameters` therefore not a text input field
          },
          {
            label: "1 SOL", // button text
            href: `${baseHref}?amount=1000`,
            type: "post",
            // no `parameters` therefore not a text input field
          },
          {
            label: "Buy", // button text
            href: `${baseHref}?amount={amount}`,
            parameters: [
              {
                name: "amount", // field name
                label: "Enter a custom amount", // text input placeholder
              },
            ],
            type: "post",
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
