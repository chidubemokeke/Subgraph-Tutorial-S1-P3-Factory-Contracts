import { PoolCreated as PoolCreatedEvent } from "../../generated/UniswapV3Factory/UniswapV3Factory"; // Import the PoolCreated event schema
import { UniswapV3Pool } from "../../generated/templates"; // Import the UniswapV3Pool template
import { CreatePool, handleFactory } from "../helpers/factoryHelper";
import { initializeToken } from "../helpers/tokenHelper";

// Main function to handle the PoolCreated event
export function handlePoolCreated(event: PoolCreatedEvent): void {
  // Handle the Factory entity updates
  handleFactory(event);

  // Initialize the Pool entity and set up related data
  CreatePool(event);

  // Initialize tokens to ensure they are correctly represented
  initializeToken(event.params.token0);
  initializeToken(event.params.token1);

  // Create a new instance of the UniswapV3Pool template for tracking the new pool
  UniswapV3Pool.create(event.params.pool); // Start tracking the new pool
}
