import { PoolCreated } from "../generated/Factory/Factory";
import { PoolTemplate } from "../generated/templates";
import { Pool } from "../generated/schema";

export function handlePoolCreated(event: PoolCreated): void {
  // Create and save the Pool entity
  let pool = new Pool(event.params.pool.toHex());
  pool.token0 = event.params.token0;
  pool.token1 = event.params.token1;
  pool.fee = event.params.fee;
  pool.tickSpacing = event.params.tickSpacing;
  pool.poolAddress = event.params.pool;
  pool.createdAtTimestamp = event.block.timestamp;
  pool.save();

  // Dynamically create a new data source for the pool contract
  PoolTemplate.create(event.params.pool.toHex());
}
