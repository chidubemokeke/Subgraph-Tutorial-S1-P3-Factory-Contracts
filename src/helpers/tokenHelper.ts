import {
  BigInt, // Importing BigInt for handling large integers
  BigDecimal, // Importing BigDecimal for handling decimals
  log, // Importing log for logging messages
  Address as Bytes, // Importing Address and aliasing it as Bytes
  Address, // Importing Address for handling Ethereum addresses
} from "@graphprotocol/graph-ts";
import { Pool, Token } from "../../generated/schema"; // Importing schema entities Pool and Token
import { ERC20 } from "../../generated/templates/UniswapV3Pool/ERC20"; // Importing ERC20 contract template

// Function to initialize a Token if it does not already exist and update its fields with actual data if available
export function initializeToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString()); // Load the Token entity using its address

  if (!token) {
    // Check if the Token entity does not exist
    token = new Token(tokenAddress.toHexString()); // Create a new Token entity
    let tokenContract = ERC20.bind(tokenAddress as Bytes); // Bind the token address to the ERC20 contract

    // Fetching symbol
    let symbolResult = tokenContract.try_symbol(); // Try to fetch the token symbol
    token.symbol = symbolResult.reverted ? "unknown" : symbolResult.value; // Set the symbol or default to "unknown" if fetching fails

    // Fetching name
    let nameResult = tokenContract.try_name(); // Try to fetch the token name
    token.name = nameResult.reverted ? "unknown" : nameResult.value; // Set the name or default to "unknown" if fetching fails

    // Fetching decimals
    let decimalsResult = tokenContract.try_decimals(); // Try to fetch the token decimals
    if (decimalsResult.reverted) {
      // Check if fetching decimals failed
      log.debug("Unable to fetch decimals for token: {}", [
        tokenAddress.toHexString(),
      ]); // Log a debug message
      token.decimals = BigDecimal.fromString("18"); // Default to 18 decimals if fetching fails
    } else {
      token.decimals = decimalsResult.value.toBigDecimal(); // Set the decimals if fetching succeeds
    }

    // Fetching total supply
    let totalSupplyResult = tokenContract.try_totalSupply(); // Try to fetch the token total supply
    token.totalSupply = totalSupplyResult.reverted
      ? BigInt.zero() // Default to zero if fetching fails
      : totalSupplyResult.value; // Set the total supply if fetching succeeds

    // Initializing transfer count
    token.transferCount = BigInt.zero(); // Initialize the transfer count to zero

    // Saving the token entity
    token.save(); // Save the Token entity
  }

  return token; // Return the Token entity
}

// Function to update the transfer count of a token within a pool
export function updatePoolTransferCount(
  poolId: string, // The ID of the pool being updated
  tokenAddress: Address // The address of the token being transferred
): void {
  let pool = Pool.load(poolId); // Load the Pool entity using its ID
  if (pool) {
    // Check if the Pool entity exists
    if (pool.token0 == tokenAddress) {
      // Check if the token is token0 in the pool
      pool.token0TransferCount = pool.token0TransferCount.plus(
        BigInt.fromI32(1)
      ); // Increment the transfer count for token0
    } else if (pool.token1 == tokenAddress) {
      // Check if the token is token1 in the pool
      pool.token1TransferCount = pool.token1TransferCount.plus(
        BigInt.fromI32(1)
      ); // Increment the transfer count for token1
    }
    pool.save(); // Save the updated Pool entity
  }
}
