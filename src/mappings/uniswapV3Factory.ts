import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts";
import { Pool } from "../../generated/schema";
import { PoolCreated as PoolCreatedEvent } from "../../generated/schema";
import { UniswapV3Pool } from "../../generated/templates";
import { createPoolEntity } from "../helpers/logic";

// Event handler function for PoolCreated event
export function handlePoolCreated(event: PoolCreatedEvent): void {
  let poolId = event.pool.toHexString(); // Convert Address to hex string

  // Create a new Pool entity if it does not exist
  let pool = Pool.load(poolId);
  if (!pool) {
    createPoolEntity(poolId); // Initialize the Pool entity

    // Create a new instance of the pool template
    UniswapV3Pool.create(Address.fromBytes(event.pool)); // This line creates a new instance for tracking

    // Reload the pool entity after creation
    pool = Pool.load(poolId);
    if (!pool) {
      return;
    }

    // Update Pool entity with details from the PoolCreated event
    pool.token0 = event.token0;
    pool.token1 = event.token1;
    pool.fee = event.fee;
    pool.tickSpacing = event.tickSpacing;
    pool.totalLiquidityIn = BigInt.zero();
    pool.totalLiquidityOut = BigInt.zero();
    pool.averageLiquidityIn = BigInt.zero();
    pool.averageLiquidityOut = BigInt.zero();
    pool.totalLiquidity = BigInt.zero();
    pool.mintCount = 0;
    pool.burnCount = 0;
    pool.blockNumber = event.blockNumber;
    pool.timeStamp = event.blockTimestamp;
    pool.transactionHash = event.transactionHash;

    pool.save();
  }
}
