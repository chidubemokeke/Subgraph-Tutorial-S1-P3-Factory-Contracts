import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Pool } from "../../generated/schema";

export function createPoolEntity(poolId: string): void {
  let pool = new Pool(poolId);
  pool.totalLiquidityIn = BigInt.zero();
  pool.totalLiquidityOut = BigInt.zero();
  pool.averageLiquidityIn = BigInt.zero();
  pool.averageLiquidityOut = BigInt.zero();
  pool.totalLiquidity = BigInt.zero();
  pool.mintCount = 0;
  pool.burnCount = 0;
  pool.blockNumber = BigInt.zero();
  pool.timeStamp = BigInt.zero();
  pool.transactionHash = Bytes.empty();
  pool.save();
}

export function calculateAverageLiquidity(
  totalLiquidity: BigInt,
  count: i32
): BigInt {
  if (count == 0) return BigInt.zero();
  return totalLiquidity.div(BigInt.fromI32(count));
}

export function updatePoolTotalLiquidity(
  poolId: string,
  amount: BigInt,
  isMint: boolean,
  isSwap: boolean = false
): void {
  let pool = Pool.load(poolId);

  if (!pool) {
    createPoolEntity(poolId);
    pool = Pool.load(poolId);
    if (!pool) return;
  }

  if (!pool.totalLiquidityIn) pool.totalLiquidityIn = BigInt.zero();
  if (!pool.totalLiquidityOut) pool.totalLiquidityOut = BigInt.zero();

  if (isSwap) {
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount);
  } else if (isMint) {
    pool.totalLiquidityIn = pool.totalLiquidityIn.plus(amount);
    pool.mintCount += 1;
    pool.averageLiquidityIn = calculateAverageLiquidity(
      pool.totalLiquidityIn,
      pool.mintCount
    );
  } else {
    pool.totalLiquidityOut = pool.totalLiquidityOut.plus(amount);
    pool.burnCount += 1;
    pool.averageLiquidityOut = calculateAverageLiquidity(
      pool.totalLiquidityOut,
      pool.burnCount
    );
  }

  pool.totalLiquidity = pool.totalLiquidityIn.minus(pool.totalLiquidityOut);
  pool.save();
}
