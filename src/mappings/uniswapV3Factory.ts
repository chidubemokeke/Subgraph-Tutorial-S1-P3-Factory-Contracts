import { PoolCreated as PoolCreatedEvent } from "../../generated/UniswapV3Factory/UniswapV3Factory"; // Import the PoolCreated event schema
import { UniswapV3Pool } from "../../generated/templates"; // Import the UniswapV3Pool template
import { CreatePool, handleFactory } from "../helpers/factoryHelper";
import { updatePoolTransferCount } from "../helpers/tokenHelper";

// Main function to handle the PoolCreated event
export function handlePoolCreated(event: PoolCreatedEvent): void {
  // First, handle the Factory entity
  handleFactory(event);

  // Then handle the Pool entity and related updates
  CreatePool(event);

  // Update the transfer count for the tokens associated with the pool
  let poolId = event.params.pool.toHex();
  updatePoolTransferCount(poolId, event.params.token0);
  updatePoolTransferCount(poolId, event.params.token1);

  // Create a new instance of the UniswapV3Pool template for tracking the new pool
  UniswapV3Pool.create(event.params.pool); // Start tracking the new pool
}
