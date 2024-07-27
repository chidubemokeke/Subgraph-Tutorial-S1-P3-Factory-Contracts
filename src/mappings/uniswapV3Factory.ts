import { Address } from "@graphprotocol/graph-ts"; // Import necessary types from the Graph protocol
import { PoolCreated as PoolCreatedEvent } from "../../generated/UniswapV3Factory/UniswapV3Factory"; // Import the PoolCreated event schema
import { UniswapV3Pool } from "../../generated/templates"; // Import the UniswapV3Pool template
import { createPool } from "../helpers/factoryHelper";

// Mapping function to handle the PoolCreated event
export function handlePoolCreated(event: PoolCreatedEvent): void {
  // Create a new instance of the UniswapV3Pool template for tracking the new pool
  UniswapV3Pool.create(Address.fromBytes(event.params.pool)); // Start tracking the new pool

  // Call the helper function to handle the PoolCreated event and initialize the entities
  createPool(event);
}
