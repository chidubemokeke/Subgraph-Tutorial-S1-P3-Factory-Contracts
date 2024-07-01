import { PoolCreated as PoolCreatedEvent } from "../../generated/UniswapFactory/UniswapFactory";
import { PoolCreated } from "../../generated/schema";

export function handlePoolCreated(event: PoolCreatedEvent): void {
  let entity = new PoolCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.token0 = event.params.token0;
  entity.token1 = event.params.token1;
  entity.fee = event.params.fee;
  entity.tickSpacing = event.params.tickSpacing;
  entity.pool = event.params.pool;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
