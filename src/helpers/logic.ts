import { BigInt } from "@graphprotocol/graph-ts";
import { Pool, Swap } from "../../generated/schema";

// Function to initialize a new Pool entity
export function createPoolEntity(poolId: string): void {
  let pool = new Pool(poolId);

  // Initialize fields to avoid null issues
  pool.totalLiquidityIn = BigInt.zero();
  pool.totalLiquidityOut = BigInt.zero();
  pool.mintCount = 0;
  pool.burnCount = 0;
  pool.averageLiquidityIn = BigInt.zero();
  pool.averageLiquidityOut = BigInt.zero();
  pool.totalLiquidity = BigInt.zero();

  pool.save();
}

// Function to calculate average liquidity based on total amount and count
export function calculateAverageLiquidity(
  totalLiquidity: BigInt, // Total liquidity added or removed
  count: i32 // Number of operations (mints or burns)
): BigInt {
  // Prevent division by zero
  if (count == 0) {
    return BigInt.fromI32(0); // Return 0 if the count is zero
  }
  // Calculate and return the average liquidity
  return totalLiquidity.div(BigInt.fromI32(count));
}

export function updatePoolTotalLiquidity(
  poolId: string, // Unique identifier for the pool
  amount: BigInt, // Amount of liquidity to add or subtract
  isMint: boolean, // Flag to determine if the event is a mint
  isSwap: boolean = false // Optional flag to determine if the event is a swap (default is false)
): void {
  let pool = Pool.load(poolId);

  // If the pool entity does not exist, create a new one
  if (pool == null) {
    createPoolEntity(poolId);
    pool = Pool.load(poolId); // Reload the pool entity after creation

    // If pool is still null after creation, exit the function
    if (pool == null) {
      return;
    }
  }

  // Initialize fields if they are null
  if (pool.totalLiquidityIn == null) {
    pool.totalLiquidityIn = BigInt.zero();
  }
  if (pool.totalLiquidityOut == null) {
    pool.totalLiquidityOut = BigInt.zero();
  }

  // Update total liquidity based on the event type
  if (isSwap) {
    // For swaps, track both inflow and outflow
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount); // Adjust based on swap direction
  } else if (isMint) {
    // For mints, update the total liquidity added
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.mintCount = pool.mintCount + 1;

    // Calculate the average liquidity added
    pool.averageLiquidityIn = calculateAverageLiquidity(
      pool.totalLiquidityIn,
      pool.mintCount
    );
  } else {
    // For burns, update the total liquidity removed
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount);
    pool.burnCount = pool.burnCount + 1;

    // Calculate the average liquidity removed
    pool.averageLiquidityOut = calculateAverageLiquidity(
      pool.totalLiquidityOut,
      pool.burnCount
    );
  }

  // Update the total liquidity in the pool
  pool.totalLiquidity = pool.totalLiquidityIn.minus(pool.totalLiquidityOut);

  // Save the updated pool entity
  pool.save();
}
