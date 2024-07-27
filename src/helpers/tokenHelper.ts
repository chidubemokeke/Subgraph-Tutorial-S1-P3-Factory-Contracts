import { BigInt, Bytes, Address, log } from "@graphprotocol/graph-ts";
import { Pool, Token } from "../../generated/schema";
import { ERC20 } from "../../generated/templates/UniswapV3Pool/ERC20";

// Function to initialize a Token if it does not already exist and update its fields with actual data if available
export function initializeToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    let tokenContract = ERC20.bind(tokenAddress); // Check this cast

    // Fetching symbol
    let symbolResult = tokenContract.try_symbol();
    token.symbol = symbolResult.reverted ? "unknown" : symbolResult.value;

    // Fetching name
    let nameResult = tokenContract.try_name();
    token.name = nameResult.reverted ? "unknown" : nameResult.value;

    // Fetching decimals
    let decimalsResult = tokenContract.try_decimals();
    if (decimalsResult.reverted) {
      log.debug("Unable to fetch decimals for token: {}", [
        tokenAddress.toHexString(),
      ]);
      return token;
    }
    token.decimals = decimalsResult.value.toBigDecimal();

    // Fetching total supply
    let totalSupplyResult = tokenContract.try_totalSupply();
    token.totalSupply = totalSupplyResult.reverted
      ? BigInt.zero()
      : totalSupplyResult.value;

    // Initializing transfer count
    token.transferCount = BigInt.zero();

    // Saving the token entity
    token.save();
  }
  return token;
}
export function updatePoolTransferCount(
  poolId: string,
  tokenAddress: Address
): void {
  let pool = Pool.load(poolId);
  if (pool) {
    if (pool.token0 == tokenAddress) {
      pool.token0TransferCount = pool.token0TransferCount.plus(
        BigInt.fromI32(1)
      );
    } else if (pool.token1 == tokenAddress) {
      pool.token1TransferCount = pool.token1TransferCount.plus(
        BigInt.fromI32(1)
      );
    }
    pool.save();
  }
}
