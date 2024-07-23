import { BigInt, Address } from "@graphprotocol/graph-ts"; // Import necessary types from the Graph protocol
import { Pool } from "../../generated/schema"; // Import the Pool entity schema
import { PoolCreated as PoolCreatedEvent } from "../../generated/schema"; // Import the PoolCreated event schema
import { UniswapV3Pool } from "../../generated/templates"; // Import the UniswapV3Pool template
import { createPoolEntity } from "../helpers/logic"; // Import the createPoolEntity helper function

// Event handler function for PoolCreated event
export function handlePoolCreated(event: PoolCreatedEvent): void {
  // Convert the pool address to a hex string to use as a unique identifier (ID)
  let poolId = event.pool.toHexString(); // Convert Address to hex string

  // Try to load the Pool entity from the store using the pool ID
  let pool = Pool.load(poolId);
  // If the Pool entity does not exist, create a new one
  if (!pool) {
    // Call the helper function to initialize the Pool entity with default values
    createPoolEntity(poolId); // Initialize the Pool entity

    // Create a new instance of the UniswapV3Pool template for tracking
    UniswapV3Pool.create(Address.fromBytes(event.pool)); // This line creates a new instance for tracking

    // Reload the Pool entity from the store after creation
    pool = Pool.load(poolId);
    // If the Pool entity still does not exist, exit the function
    if (!pool) {
      return;
    }

    // Update the Pool entity with details from the PoolCreated event
    pool.token0 = event.token0; // Set the first token address
    pool.token1 = event.token1; // Set the second token address
    pool.fee = event.fee; // Set the fee tier
    pool.tickSpacing = event.tickSpacing; // Set the tick spacing
    pool.totalLiquidityIn = BigInt.zero(); // Initialize total liquidity added to the pool
    pool.totalLiquidityOut = BigInt.zero(); // Initialize total liquidity removed from the pool
    pool.averageLiquidityIn = BigInt.zero(); // Initialize average liquidity added to the pool
    pool.averageLiquidityOut = BigInt.zero(); // Initialize average liquidity removed from the pool
    pool.totalLiquidity = BigInt.zero(); // Initialize total liquidity in the pool
    pool.mintCount = 0; // Initialize the count of mint events
    pool.burnCount = 0; // Initialize the count of burn events
    pool.blockNumber = event.blockNumber; // Set the block number when the event occurred
    pool.timeStamp = event.blockTimestamp; // Set the timestamp when the event occurred
    pool.transactionHash = event.transactionHash; // Set the transaction hash for the event

    // Save the updated Pool entity back to the store
    pool.save();
  }
}
