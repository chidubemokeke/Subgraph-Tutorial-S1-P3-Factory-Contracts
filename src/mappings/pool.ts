import {
  Swap as SwapEvent,
  Mint as MintEvent,
  Burn as BurnEvent,
} from "../../generated/schema";

export function handleMint(event: MintEvent): void {
  handleMint(event);
}

export function handleSwap(event: SwapEvent): void {
  handleSwap(event);
}

export function handleBurn(event: BurnEvent): void {
  handleBurn(event);
}
