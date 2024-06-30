import { newMockEvent } from "matchstick-as"
import { ethereum, Address } from "@graphprotocol/graph-ts"
import { NewExchange } from "../generated/UniswapFactory/UniswapFactory"

export function createNewExchangeEvent(
  token: Address,
  exchange: Address
): NewExchange {
  let newExchangeEvent = changetype<NewExchange>(newMockEvent())

  newExchangeEvent.parameters = new Array()

  newExchangeEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  newExchangeEvent.parameters.push(
    new ethereum.EventParam("exchange", ethereum.Value.fromAddress(exchange))
  )

  return newExchangeEvent
}
