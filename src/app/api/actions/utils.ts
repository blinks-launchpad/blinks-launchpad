import { createActionHeaders } from "@solana/actions";

export const actionHeaders = createActionHeaders({
  chainId: "devnet", // or chainId: "devnet"
  actionVersion: "2.2.1", // the desired spec version
});

export const actionErrorResponse = (message: string) => {
  return Response.json(
    {
      message,
    },
    {
      status: 400,
      headers: actionHeaders,
    }
  );
};

export const getElizaUrl = (path: string) => {
  if (!path.startsWith("/")) path = `/${path}`;
  return `http://localhost:3000${path}`;
};
