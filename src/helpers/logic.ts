import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"; // Import necessary types from the Graph protocol
import { Pool, Token, PoolCreated } from "../../generated/schema"; // Import the Pool entity schema
import { PoolCreated as PoolCreatedEvent } from "../../generated/UniswapV3Factory/UniswapV3Factory"; // Import the PoolCreated event schema

// Helper function to initialize a PoolCreated entity with default values
export function handlePoolCreated(event: PoolCreatedEvent): void {
  let poolCreated = new PoolCreated(event.transaction.hash); // Use the transaction hash or other unique identifier

  poolCreated.token0 = event.params.token0;
  poolCreated.token1 = event.params.token1;
  poolCreated.fee = BigInt.fromI32(event.params.fee);
  poolCreated.tickSpacing = BigInt.fromI32(event.params.tickSpacing);
  poolCreated.pool = event.params.pool; // Address of the newly created pool contract
  poolCreated.poolCount = BigInt.fromI32(1); // Initialize poolCount, modify as needed for total count
  poolCreated.blockNumber = event.block.number;
  poolCreated.blockTimestamp = event.block.timestamp;
  poolCreated.transactionHash = event.transaction.hash;

  // Save the PoolCreated entity
  poolCreated.save();

  // Also handle the Pool entity creation/update
  let pool = initializePool(event.params.pool.toHexString(), event);
  pool.save();
}

// Helper function to initialize a Pool entity with default values
export function initializePool(poolId: string, event: PoolCreatedEvent): Pool {
  let pool = new Pool(poolId);

  pool.token0 = event.params.token0;
  pool.token1 = event.params.token1;
  pool.fee = BigInt.fromI32(event.params.fee);
  pool.tickSpacing = BigInt.fromI32(event.params.tickSpacing);
  pool.totalLiquidityIn = BigInt.zero();
  pool.totalLiquidityOut = BigInt.zero();
  pool.averageLiquidityIn = BigInt.zero();
  pool.averageLiquidityOut = BigInt.zero();
  pool.totalLiquidity = BigInt.zero();
  pool.mintCount = BigInt.zero();
  pool.burnCount = BigInt.zero();
  pool.activityCount = BigInt.zero(); // Initialize activityCount
  pool.blockNumber = event.block.number;
  pool.timeStamp = event.block.timestamp;
  pool.transactionHash = event.transaction.hash;

  // Initialize tokens if they don't exist
  initializeToken(event.params.token0);
  initializeToken(event.params.token1);

  return pool;
}

// Initialize a Token if it does not already exist
function initializeToken(tokenAddress: Bytes): void {
  let token = Token.load(tokenAddress.toHexString());
  if (token == null) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = ""; // Default value
    token.name = ""; // Default value
    token.decimals = BigInt.zero(); // Default value
    token.totalSupply = BigInt.zero(); // Default value
    token.transferCount = BigInt.zero(); // Initialize
    token.save();
  }
}

// Function to calculate average liquidity
export function calculateAverageLiquidity(
  totalLiquidity: BigInt,
  count: BigInt
): BigInt {
  if (count.isZero()) return BigInt.zero();
  return totalLiquidity.div(count);
}

// Function to update the total liquidity of a pool
export function updatePoolTotalLiquidity(
  poolId: string,
  amount: BigInt,
  isMint: boolean,
  isSwap: boolean = false
): void {
  let pool = Pool.load(poolId);
  if (!pool) {
    // Default values for initialization in case of missing Pool entity
    pool = new Pool(poolId);
    pool.token0 = Bytes.empty();
    pool.token1 = Bytes.empty();
    pool.fee = pool.fee;
    pool.tickSpacing = pool.tickSpacing;
    pool.totalLiquidityIn = BigInt.zero();
    pool.totalLiquidityOut = BigInt.zero();
    pool.averageLiquidityIn = BigInt.zero();
    pool.averageLiquidityOut = BigInt.zero();
    pool.totalLiquidity = BigInt.zero();
    pool.mintCount = BigInt.zero();
    pool.burnCount = BigInt.zero();
    pool.activityCount = BigInt.zero();
    pool.blockNumber = BigInt.zero(); // Default value
    pool.timeStamp = BigInt.zero(); // Default value
    pool.transactionHash = Bytes.empty(); // Default value
  }

  // Initialize total liquidity values if they are null
  if (pool.totalLiquidityIn == null) pool.totalLiquidityIn = BigInt.zero();
  if (pool.totalLiquidityOut == null) pool.totalLiquidityOut = BigInt.zero();
  if (pool.mintCount == null) pool.mintCount = BigInt.zero();
  if (pool.burnCount == null) pool.burnCount = BigInt.zero();
  if (pool.activityCount == null) pool.activityCount = BigInt.zero();

  if (isSwap) {
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount);
  } else if (isMint) {
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.mintCount = pool.mintCount.plus(BigInt.fromI32(1));
    pool.averageLiquidityIn = calculateAverageLiquidity(
      pool.totalLiquidityIn,
      pool.mintCount
    );
  } else {
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount);
    pool.burnCount = pool.burnCount.plus(BigInt.fromI32(1));
    pool.averageLiquidityOut = calculateAverageLiquidity(
      pool.totalLiquidityOut,
      pool.burnCount
    );
  }

  pool.activityCount = pool.activityCount.plus(BigInt.fromI32(1));
  pool.totalLiquidity = pool.totalLiquidityIn.minus(pool.totalLiquidityOut);
  pool.save();
}

// Function to update the total transfers of a token
export function updateTokenTransferCount(tokenAddress: Bytes): void {
  let token = Token.load(tokenAddress.toHexString());
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = ""; // Default value
    token.name = ""; // Default value
    token.decimals = BigInt.zero(); // Default value
    token.totalSupply = BigInt.zero(); // Default value
    token.transferCount = BigInt.fromI32(1); // Initialize transferCount
    token.save();
  } else {
    token.transferCount = token.transferCount.plus(BigInt.fromI32(1)); // Increment transferCount
    token.save();
  }
}
