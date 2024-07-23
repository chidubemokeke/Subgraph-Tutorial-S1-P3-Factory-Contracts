import { BigInt, Bytes } from "@graphprotocol/graph-ts"; // Import BigInt for large integers and Bytes for byte arrays.
import { Pool } from "../../generated/schema"; // Import the Pool entity type from the generated schema.

// Function to create a new Pool entity with initial values
export function createPoolEntity(poolId: string): void {
  // Create a new Pool entity with the provided poolId
  let pool = new Pool(poolId);

  // Initialize pool properties with default values
  pool.totalLiquidityIn = BigInt.zero(); // Total liquidity added to the pool, initially zero
  pool.totalLiquidityOut = BigInt.zero(); // Total liquidity removed from the pool, initially zero
  pool.averageLiquidityIn = BigInt.zero(); // Average liquidity added per mint, initially zero
  pool.averageLiquidityOut = BigInt.zero(); // Average liquidity removed per burn, initially zero
  pool.totalLiquidity = BigInt.zero(); // Net liquidity in the pool, initially zero
  pool.mintCount = 0; // Count of mint operations, initially zero
  pool.burnCount = 0; // Count of burn operations, initially zero
  pool.blockNumber = BigInt.zero(); // Block number of the latest event, initially zero
  pool.timeStamp = BigInt.zero(); // Timestamp of the latest event, initially zero
  pool.transactionHash = Bytes.empty(); // Transaction hash of the latest event, initially empty

  // Save the newly created Pool entity to the store
  pool.save();
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

  // If the Pool entity does not exist, create it
  if (!pool) {
    createPoolEntity(poolId); // Create a new Pool entity
    pool = Pool.load(poolId); // Reload the Pool entity after creation
    if (!pool) return; // If the Pool entity could not be loaded, exit the function
  }

  // Initialize total liquidity values if they are not set
  if (!pool.totalLiquidityIn) pool.totalLiquidityIn = BigInt.zero();
  if (!pool.totalLiquidityOut) pool.totalLiquidityOut = BigInt.zero();

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
