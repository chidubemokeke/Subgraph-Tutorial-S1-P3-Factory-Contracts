import { BigInt, Bytes, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Pool, Factory } from "../../generated/schema";
import { PoolCreated as PoolCreatedEvent } from "../../generated/UniswapV3Factory/UniswapV3Factory";
import { initializeToken } from "../helpers/tokenHelper";

// Helper function to handle the Factory entity creation or update
export function handleFactory(event: PoolCreatedEvent): void {
  let factoryId = event.transaction.hash; // Unique ID for the Factory entity based on the transaction hash
  let factory = Factory.load(factoryId); // Load the existing Factory entity if it exists

  if (!factory) {
    // If the Factory entity does not exist, create a new one
    factory = new Factory(factoryId);
    factory.token0 = event.params.token0; // Set the first token address
    factory.token1 = event.params.token1; // Set the second token address
    factory.fee = event.params.fee; // Set the fee tier for the pool
    factory.tickSpacing = event.params.tickSpacing; // Set the tick spacing for the pool
    factory.pool = event.params.pool; // Set the pool address
    factory.poolCount = BigInt.fromI32(1); // Initialize the pool count with one
    factory.blockNumber = event.block.number; // Set the block number of the event
    factory.blockTimestamp = event.block.timestamp; // Set the block timestamp of the event
    factory.transactionHash = event.transaction.hash; // Set the transaction hash

    factory.save(); // Save the new Factory entity
  } else {
    // If the Factory entity exists, update the pool count
    factory.poolCount = factory.poolCount.plus(BigInt.fromI32(1));
    factory.save(); // Save the updated Factory entity
  }

  // Initialize the tokens involved in the pool creation
  initializeToken(event.params.token0);
  initializeToken(event.params.token1);
}

// Helper function to create or update a Pool entity
export function CreatePool(event: PoolCreatedEvent): void {
  let poolId = event.params.pool.toHex(); // Convert the pool address to a string for the ID
  let pool = Pool.load(poolId); // Load the existing Pool entity if it exists

  if (!pool) {
    // If the Pool entity does not exist, create a new one
    pool = new Pool(poolId);
    pool.token0 = event.params.token0; // Set the first token address
    pool.token1 = event.params.token1; // Set the second token address
    pool.fee = event.params.fee; // Set the fee tier for the pool
    pool.tickSpacing = event.params.tickSpacing; // Set the tick spacing for the pool
    pool.totalLiquidityIn = BigInt.zero(); // Initialize total liquidity added to zero
    pool.totalLiquidityOut = BigInt.zero(); // Initialize total liquidity removed to zero
    pool.averageLiquidityIn = BigInt.zero().toBigDecimal(); // Initialize average liquidity added to zero
    pool.averageLiquidityOut = BigInt.zero().toBigDecimal(); // Initialize average liquidity removed to zero
    pool.totalLiquidity = BigInt.zero(); // Initialize total liquidity to zero
    pool.mintCount = BigInt.zero(); // Initialize mint count to zero
    pool.burnCount = BigInt.zero(); // Initialize burn count to zero
    pool.swapCount = BigInt.zero(); // Initialize swap count to zero
    pool.token0MintCount = BigInt.zero(); // Initialize token0 mint count to zero
    pool.token0BurnCount = BigInt.zero(); // Initialize token0 burn count to zero
    pool.token0SwapCount = BigInt.zero(); // Initialize token0 swap count to zero
    pool.token1MintCount = BigInt.zero(); // Initialize token1 mint count to zero
    pool.token1BurnCount = BigInt.zero(); // Initialize token1 burn count to zero
    pool.token1SwapCount = BigInt.zero(); // Initialize token1 swap count to zero
    pool.token0TransferCount = BigInt.zero(); // Initialize token0 transfer count to zero
    pool.token1TransferCount = BigInt.zero(); // Initialize token1 transfer count to zero
    pool.activityCount = BigInt.zero(); // Initialize activity count to zero
    pool.blockNumber = event.block.number; // Set the block number of the event
    pool.timeStamp = event.block.timestamp; // Set the block timestamp of the event
    pool.transactionHash = event.transaction.hash; // Set the transaction hash

    pool.save(); // Save the new Pool entity
  }

  // Initialize the tokens involved in the pool creation
  initializeToken(event.params.token0);
  initializeToken(event.params.token1);
}

// Function to update the total liquidity of a pool based on the event type
export function updatePoolTotalLiquidity(
  poolId: string, // The ID of the pool being updated
  amount: BigInt, // The amount of liquidity being added or removed
  isMint: Bytes = Bytes.empty(), // Default to empty Bytes if not used; indicates a mint event
  isBurn: Bytes = Bytes.empty(), // Default to empty Bytes if not used; indicates a burn event
  isSwap: Bytes = Bytes.empty() // Default to empty Bytes if not used; indicates a swap event
): void {
  let pool = Pool.load(poolId); // Load the Pool entity with the given ID

  if (!pool) {
    // Check if the Pool entity exists
    log.warning("Pool entity not found for ID: {}", [poolId]); // Log a warning if the pool is not found
    return; // Exit the function if the pool is not found
  }

  log.info("Updating pool total liquidity for pool: {}", [poolId]); // Log an info message for updating liquidity

  if (!isSwap.equals(Bytes.empty())) {
    // Check if the event is a swap event
    // Update liquidity for a swap event
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount); // Increase total liquidity added
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount); // Increase total liquidity removed
    pool.swapCount = pool.swapCount.plus(BigInt.fromI32(1)); // Increment the swap count
    log.info("Processed swap event for pool: {}", [poolId]); // Log an info message for processing swap event
  } else if (!isMint.equals(Bytes.empty())) {
    // Check if the event is a mint event
    // Update liquidity for a mint event
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount); // Increase total liquidity added
    pool.mintCount = pool.mintCount.plus(BigInt.fromI32(1)); // Increment the mint count
    pool.averageLiquidityIn = calculateAverageLiquidity(
      pool.totalLiquidityIn, // Calculate average liquidity added
      pool.mintCount
    );
    log.info("Processed mint event for pool: {}", [poolId]); // Log an info message for processing mint event
  } else if (!isBurn.equals(Bytes.empty())) {
    // Check if the event is a burn event
    // Update liquidity for a burn event
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount); // Increase total liquidity removed
    pool.burnCount = pool.burnCount.plus(BigInt.fromI32(1)); // Increment the burn count
    pool.averageLiquidityOut = calculateAverageLiquidity(
      pool.totalLiquidityOut, // Calculate average liquidity removed
      pool.burnCount
    );
    log.info("Processed burn event for pool: {}", [poolId]); // Log an info message for processing burn event
  }

  pool.activityCount = pool.activityCount.plus(BigInt.fromI32(1)); // Increment the total activity count
  pool.totalLiquidity = pool.totalLiquidityIn.minus(pool.totalLiquidityOut); // Calculate the total liquidity

  pool.save(); // Save the updated Pool entity
}

// Function to calculate the average liquidity
export function calculateAverageLiquidity(
  totalLiquidity: BigInt, // The total liquidity added or removed
  count: BigInt // The count of events (mint or burn)
): BigDecimal {
  if (count.equals(BigInt.fromI32(0))) {
    // Check if the count is zero to avoid division by zero
    return BigDecimal.zero(); // Return zero if the count is zero
  }
  return totalLiquidity.toBigDecimal().div(count.toBigDecimal()); // Calculate the average liquidity
}
