import readline from "readline";
import { createMachine, createActor, assign } from "xstate";

/*
@create #cat "You say meow after each sentence."
@cat hello.
*/

export const machine = createMachine(
  {
    id: "SystemHandler",
    initial: "Ready",
    states: {
      Ready: {
        on: {
          receiveInputFromUser: [
            {
              target: "Ready",
              guard: "isCreateRequestMessage",
              actions: {
                type: "createActor",
              },
            },
            {
              target: "Ready",
              actions: {
                type: "echoInput",
              },
            },
          ],
        },
      },
    },
    types: { events: {} as { type: "receiveInputFromUser"; contents: string } },
  },
  {
    actions: {
      createActor: ({ context, event }) => {
        const messageContents = event.contents.split(" ");
        const name = messageContents[1];
        const instructions = messageContents.slice(2).join(" ");

        console.log(
          `Created actor with name ${name} and instructions ${instructions}`,
        );
      },
      echoInput: ({ context, event }) => {
        const messageContents = event.contents.split(" ");
        const name = messageContents[0].substring(1); // remove '@'
        const response_message = messageContents.slice(1).join(" ");

        console.log(`${name}: ${response_message} meow!`);
      },
    },
    actors: {},
    guards: {
      isCreateRequestMessage: ({ context, event }, params) => {
        return event.contents.includes("@create");
      },
    },
    delays: {},
  },
);

const inputActor = createActor(machine, {}).start();
// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Prompt user for input
rl.on("line", (input: string) => {
  const msg = { type: "receiveInputFromUser" as const, contents: input };
  inputActor.send(msg);
});
