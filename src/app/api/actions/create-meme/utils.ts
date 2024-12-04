import {
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createFreezeAccountInstruction,
} from '@solana/spl-token';
import {
  PublicKey,
  SystemProgram,
  Transaction,
  Keypair,
  Connection,
} from '@solana/web3.js';

interface TokenMetadata {
  name: string;
  symbol: string;
  totalSupply: number;
  decimals: number;
  uri?: string;
}

export async function buildTokenCreationTransaction(
  creatorPublicKey: PublicKey,
  metadata: TokenMetadata,
  connection: Connection,
): Promise<Transaction> {
  // Generate a new mint keypair
  const mintKeypair = Keypair.generate();
  const transaction = new Transaction();

  // Get the minimum lamports required for rent exemption
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  // Create mint account
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: creatorPublicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  // Initialize mint
  transaction.add(
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      metadata.decimals,
      creatorPublicKey, // mint authority
      creatorPublicKey, // freeze authority
      TOKEN_PROGRAM_ID
    )
  );

  // Get the associated token account address for the creator
  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    creatorPublicKey
  );

  // Create associated token account for creator
  transaction.add(
    createAssociatedTokenAccountInstruction(
      creatorPublicKey,
      associatedTokenAccount,
      creatorPublicKey,
      mintKeypair.publicKey
    )
  );

  // Mint tokens to creator's account
  transaction.add(
    createMintToInstruction(
      mintKeypair.publicKey,
      associatedTokenAccount,
      creatorPublicKey,
      metadata.totalSupply * (10 ** metadata.decimals)
    )
  );

  // Freeze mint to prevent further minting
  transaction.add(
    createFreezeAccountInstruction(
      mintKeypair.publicKey,
      mintKeypair.publicKey,
      creatorPublicKey,
    )
  );

  return transaction;
}
