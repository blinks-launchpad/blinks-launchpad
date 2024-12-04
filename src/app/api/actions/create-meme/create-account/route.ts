import { ActionGetResponse } from "@solana/actions";
import { actionHeaders } from "../../utils";

export const GET = async (req: Request) => {
  try {
    const baseHref = "/api/actions/create-meme/create-account";
    const payload: ActionGetResponse = {
      title: "Launch your own agent meme coin",
      icon: "https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/",
      description: "Launch your own agent meme coin",
      label: "Launch",
      links: {
        actions: [
          {
            label: "Create token account for your meme coin", // button text
            href: `${baseHref}`,
            type: "post",
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
