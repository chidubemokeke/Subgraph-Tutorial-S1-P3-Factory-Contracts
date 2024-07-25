import { Address, BigInt } from "@graphprotocol/graph-ts"; // Import necessary types from the Graph protocol
import { Pool } from "../../generated/schema"; // Import the Pool entity schema
import { PoolCreated as PoolCreatedEvent } from "../../generated/UniswapV3Factory/UniswapV3Factory"; // Import the PoolCreated event schema

// Helper function to initialize a Pool entity with default values
export function initializePool(poolId: string, event: PoolCreatedEvent): Pool {
  let pool = new Pool(poolId); // Create a new Pool entity with the given ID

  // Initialize the Pool entity with details from the PoolCreated event
  pool.token0 = event.params.token0; // Set the first token address
  pool.token1 = event.params.token1; // Set the second token address
  pool.fee = event.params.fee; // Set the fee tier for the pool
  pool.tickSpacing = event.params.tickSpacing; // Set the tick spacing for the pool
  pool.totalLiquidityIn = BigInt.zero(); // Initialize total liquidity added to the pool to zero
  pool.totalLiquidityOut = BigInt.zero(); // Initialize total liquidity removed from the pool to zero
  pool.averageLiquidityIn = BigInt.zero(); // Initialize average liquidity added to the pool to zero
  pool.averageLiquidityOut = BigInt.zero(); // Initialize average liquidity removed from the pool to zero
  pool.totalLiquidity = BigInt.zero(); // Initialize total liquidity in the pool to zero
  pool.mintCount = 0; // Initialize the count of mint events to zero
  pool.burnCount = 0; // Initialize the count of burn events to zero
  pool.blockNumber = event.block.number; // Set the block number when the PoolCreated event occurred
  pool.timeStamp = event.block.timestamp; // Set the timestamp when the PoolCreated event occurred
  pool.transactionHash = event.transaction.hash; // Set the transaction hash for the PoolCreated event

  return pool; // Return the newly initialized Pool entity
}

// Function to calculate average liquidity
export function calculateAverageLiquidity(
  totalLiquidity: BigInt, // Total liquidity accumulated
  count: number // Number of operations (mint or burn)
): BigInt {
  // If count is zero, return zero to avoid division by zero
  if (count == 0) return BigInt.zero();

  // Calculate and return average liquidity by dividing total liquidity by count
  return totalLiquidity.div(BigInt.fromI32(count));
}

// Function to update the total liquidity of a pool
export function updatePoolTotalLiquidity(
  poolId: string, // ID of the pool to update
  amount: BigInt, // Amount of liquidity to add or remove
  isMint: boolean, // Flag to indicate if the operation is a mint
  isSwap: boolean = false // Flag to indicate if the operation is a swap (default is false)
): void {
  // Load the Pool entity using the poolId
  let pool = Pool.load(poolId);
  // If the Pool entity does not exist, create it with default values
  if (!pool) {
    pool = new Pool(poolId);
    // Initialize the Pool entity with details from the PoolCreated event
    pool.token0 = pool.token0; // Set the first token address
    pool.token1 = pool.token1; // Set the second token address
    pool.fee = pool.fee; // Set the fee tier for the pool
    pool.tickSpacing = pool.tickSpacing; // Set the tick spacing for the pool
    pool.totalLiquidityIn = BigInt.zero(); // Initialize total liquidity added to the pool to zero
    pool.totalLiquidityOut = BigInt.zero(); // Initialize total liquidity removed from the pool to zero
    pool.averageLiquidityIn = BigInt.zero(); // Initialize average liquidity added to the pool to zero
    pool.averageLiquidityOut = BigInt.zero(); // Initialize average liquidity removed from the pool to zero
    pool.totalLiquidity = BigInt.zero(); // Initialize total liquidity in the pool to zero
    pool.mintCount = 0; // Initialize the count of mint events to zero
    pool.burnCount = 0; // Initialize the count of burn events to zero
    pool.blockNumber = pool.blockNumber; // Set the block number when the PoolCreated event occurred
    pool.timeStamp = pool.timeStamp; // Set the timestamp when the PoolCreated event occurred
    pool.transactionHash = pool.transactionHash; // Set the transaction hash for the PoolCreated event
  }

  // Initialize total liquidity values if they are null
  if (pool.totalLiquidityIn == null) pool.totalLiquidityIn = BigInt.zero();
  if (pool.totalLiquidityOut == null) pool.totalLiquidityOut = BigInt.zero();

  // Update pool liquidity based on the type of operation
  if (isSwap) {
    // For swap operations, add the amount to both totalLiquidityIn and totalLiquidityOut
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount);
  } else if (isMint) {
    // For mint operations, add the amount to totalLiquidityIn
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.mintCount += 1; // Increment mint count
    // Calculate and update the average liquidity added per mint
    pool.averageLiquidityIn = calculateAverageLiquidity(
      pool.totalLiquidityIn,
      pool.mintCount
    );
  } else {
    // For burn operations, add the amount to totalLiquidityOut
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount);
    pool.burnCount += 1; // Increment burn count
    // Calculate and update the average liquidity removed per burn
    pool.averageLiquidityOut = calculateAverageLiquidity(
      pool.totalLiquidityOut,
      pool.burnCount
    );
  }

  // Update the net liquidity in the pool
  pool.totalLiquidity = pool.totalLiquidityIn.minus(pool.totalLiquidityOut);
  // Save the updated Pool entity to the store
  pool.save();
}
