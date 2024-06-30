import { Swap, Mint, Burn } from "../generated/schema";
import {
  Swap as SwapEvent,
  Mint as MintEvent,
  Burn as BurnEvent,
} from "../generated/templates/PoolTemplate/Pool";

export function handleSwap(event: SwapEvent): void {
  let swap = new Swap(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  swap.pair = event.address;
  swap.sender = event.params.sender;
  swap.amount0In = event.params.amount0In;
  swap.amount1In = event.params.amount1In;
  swap.amount0Out = event.params.amount0Out;
  swap.amount1Out = event.params.amount1Out;
  swap.to = event.params.to;
  swap.timestamp = event.block.timestamp;
  swap.save();
}

export function handleMint(event: MintEvent): void {
  let mint = new Mint(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  mint.pair = event.address;
  mint.sender = event.params.sender;
  mint.amount0 = event.params.amount0;
  mint.amount1 = event.params.amount1;
  mint.timestamp = event.block.timestamp;
  mint.save();
}

export function handleBurn(event: BurnEvent): void {
  let burn = new Burn(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  burn.pair = event.address;
  burn.sender = event.params.sender;
  burn.amount0 = event.params.amount0;
  burn.amount1 = event.params.amount1;
  burn.to = event.params.to;
  burn.timestamp = event.block.timestamp;
  burn.save();
}
