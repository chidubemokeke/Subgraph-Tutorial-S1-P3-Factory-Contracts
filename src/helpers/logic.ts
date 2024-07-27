import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from "@graphprotocol/graph-ts"; // Import necessary types from the Graph protocol
import { Pool, Token, Factory } from "../../generated/schema"; // Import the Pool entity schema
import { PoolCreated as PoolCreatedEvent } from "../../generated/UniswapV3Factory/UniswapV3Factory"; // Import the PoolCreated event schema
import { ERC20 } from "../../generated/templates/UniswapV3Pool/ERC20";

// Helper function to initialize a PoolCreated entity with default values
export function createPool(event: PoolCreatedEvent): void {
  let factory = Factory.load(event.transaction.hash); // Use the transaction hash or other unique identifier

  if (!factory) {
    factory = new Factory(event.transaction.hash);
    factory.token0 = event.params.token0;
    factory.token1 = event.params.token1;
    factory.fee = BigInt.fromI32(event.params.fee);
    factory.tickSpacing = BigInt.fromI32(event.params.tickSpacing);
    factory.pool = event.params.pool; // Address of the newly created pool contract
    factory.poolCount = BigInt.fromI32(1); // Initialize poolCount, modify as needed for total count
    factory.blockNumber = event.block.number;
    factory.blockTimestamp = event.block.timestamp;
    factory.transactionHash = event.transaction.hash;

    // Save the Factory entity
    factory.save();
  } else {
    factory.poolCount = factory.poolCount.plus(BigInt.fromI32(1));
    factory.save();
  }

  // Handle the Pool entity creation/update
  const pool = initializePool(event.params.pool.toHexString(), event);
  pool.save();
}

// Helper function to initialize a Pool entity with default values

export function initializePool(poolId: string, event: PoolCreatedEvent): Pool {
  const pool = new Pool(poolId);

  pool.token0 = event.params.token0;
  pool.token1 = event.params.token1;
  pool.fee = BigInt.fromI32(event.params.fee);
  pool.tickSpacing = BigInt.fromI32(event.params.tickSpacing);
  pool.totalLiquidityIn = BigInt.zero();
  pool.totalLiquidityOut = BigInt.zero();
  pool.averageLiquidityIn = BigDecimal.zero();
  pool.averageLiquidityOut = BigDecimal.zero();
  pool.totalLiquidity = BigInt.zero();
  pool.mintCount = BigInt.zero();
  pool.burnCount = BigInt.zero();
  pool.swapCount = BigInt.zero();
  pool.token0MintCount = BigInt.zero();
  pool.token0BurnCount = BigInt.zero();
  pool.token0SwapCount = BigInt.zero();
  pool.token1MintCount = BigInt.zero();
  pool.token1BurnCount = BigInt.zero();
  pool.token1SwapCount = BigInt.zero();
  pool.token0TransferCount = BigInt.zero();
  pool.token1TransferCount = BigInt.zero();
  pool.activityCount = BigInt.zero(); // Initialize activityCount
  pool.blockNumber = event.block.number;
  pool.timeStamp = event.block.timestamp;
  pool.transactionHash = event.transaction.hash;

  // Initialize tokens if they don't exist
  initializeToken(event.params.token0);
  initializeToken(event.params.token1);

  return pool;
}

// Function to initialize a Token if it does not already exist and update its fields with actual data if available
export function initializeToken(tokenAddress: Bytes): void {
  let token = Token.load(tokenAddress.toHexString());
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    let tokenContract = ERC20.bind(tokenAddress as Address);

    // Attempt to get token details from the contract
    let symbolResult = tokenContract.try_symbol();
    let nameResult = tokenContract.try_name();
    let decimalsResult = tokenContract.try_decimals();
    let totalSupplyResult = tokenContract.try_totalSupply();

    token.symbol = symbolResult.reverted ? "" : symbolResult.value;
    token.name = nameResult.reverted ? "" : nameResult.value;

    if (decimalsResult.reverted) {
      log.debug("Unable to fetch decimals for token: {}", [
        tokenAddress.toHexString(),
      ]);
      return;
    }

    token.decimals = decimalsResult.value.toBigDecimal(); // Convert BigInt to BigDecimal
    token.totalSupply = totalSupplyResult.reverted
      ? BigInt.zero()
      : totalSupplyResult.value;
    token.transferCount = BigInt.zero(); // Initialize
    token.save();
  }
}

// Function to calculate average liquidity
export function calculateAverageLiquidity(
  totalLiquidity: BigInt,
  count: BigInt
): BigDecimal {
  if (count.equals(BigInt.fromI32(0))) {
    return BigDecimal.zero();
  }
  return totalLiquidity.toBigDecimal().div(count.toBigDecimal());
}

// Function to update the total liquidity of a pool
export function updatePoolTotalLiquidity(
  poolId: string,
  amount: BigInt,
  tokenAddress: Bytes,
  isMint: boolean = false,
  isBurn: boolean = false,
  isSwap: boolean = false
): void {
  let pool = Pool.load(poolId);
  if (!pool) {
    return;
  }

  // Handle swap operation
  if (isSwap) {
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount);
    pool.swapCount = pool.swapCount.plus(BigInt.fromI32(1));

    // Update swap count for token0 or token1
    if (tokenAddress.equals(pool.token0)) {
      pool.token0SwapCount = pool.token0SwapCount.plus(BigInt.fromI32(1));
    } else if (tokenAddress.equals(pool.token1)) {
      pool.token1SwapCount = pool.token1SwapCount.plus(BigInt.fromI32(1));
    }

    // Handle mint operation
  } else if (isMint) {
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.mintCount = pool.mintCount.plus(BigInt.fromI32(1));
    pool.averageLiquidityIn = calculateAverageLiquidity(
      pool.totalLiquidityIn,
      pool.mintCount
    );

    // Update mint count for token0 or token1
    if (tokenAddress.equals(pool.token0)) {
      pool.token0MintCount = pool.token0MintCount.plus(BigInt.fromI32(1));
    } else if (tokenAddress.equals(pool.token1)) {
      pool.token1MintCount = pool.token1MintCount.plus(BigInt.fromI32(1));
    }

    // Handle burn operation
  } else if (isBurn) {
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount);
    pool.burnCount = pool.burnCount.plus(BigInt.fromI32(1));
    pool.averageLiquidityOut = calculateAverageLiquidity(
      pool.totalLiquidityOut,
      pool.burnCount
    );

    // Update burn count for token0 or token1
    if (tokenAddress.equals(pool.token0)) {
      pool.token0BurnCount = pool.token0BurnCount.plus(BigInt.fromI32(1));
    } else if (tokenAddress.equals(pool.token1)) {
      pool.token1BurnCount = pool.token1BurnCount.plus(BigInt.fromI32(1));
    }
  }

  // Update general pool activity
  pool.activityCount = pool.activityCount.plus(BigInt.fromI32(1));

  // Recalculate total liquidity
  pool.totalLiquidity = pool.totalLiquidityIn.minus(pool.totalLiquidityOut);

  // Save the updated pool entity
  pool.save();
}

export function updatePoolTransferCount(
  poolId: string,
  tokenAddress: Bytes
): void {
  let pool = Pool.load(poolId);
  if (!pool) {
    return;
  }

  if (tokenAddress.equals(pool.token0)) {
    pool.token0TransferCount = pool.token0TransferCount.plus(BigInt.fromI32(1));
  } else if (tokenAddress.equals(pool.token1)) {
    pool.token1TransferCount = pool.token1TransferCount.plus(BigInt.fromI32(1));
  }

  pool.activityCount = pool.activityCount.plus(BigInt.fromI32(1));
  pool.save();
}

// Function to update the total transfers of a token
export function updateTokenTransferCount(tokenAddress: Bytes): void {
  let token = Token.load(tokenAddress.toHexString());
  if (token == null) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = ""; // Default value
    token.name = ""; // Default value
    token.decimals = BigDecimal.zero(); // Default value
    token.totalSupply = BigInt.zero(); // Default value
    token.transferCount = BigInt.fromI32(1); // Initialize transferCount
    token.save();
  } else {
    token.transferCount = token.transferCount.plus(BigInt.fromI32(1)); // Increment transferCount
    token.save();
  }
}
