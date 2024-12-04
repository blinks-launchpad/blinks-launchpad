import { createActionHeaders } from "@solana/actions";

export const actionHeaders = createActionHeaders({
  chainId: "devnet", // or chainId: "devnet"
  actionVersion: "2.2.1", // the desired spec version
});
