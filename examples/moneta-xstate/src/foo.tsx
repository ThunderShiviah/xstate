import readline from "readline";
import { createMachine, createActor, assign, sendTo } from "xstate";

/*
@cat hello.
system: there is no actor named 'cat'.
@create #cat "You say meow after each sentence."
system: created actor with name 'cat' and instructions '"You say meow after each sentence."'
@cat hello.
cat: hello meow!
*/
const factory = createMachine({
  initial: "Ready",
  states: {
    Ready: {
      on: {
        echoMessage: {
          actions: [
            ({ context, event }) => {
              console.log("I am a cat.Message received!");
              console.log("event", event);
            },
          ],
        },
      },
    },
  },
});
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
              actions: assign({
                todos: ({ context, spawn }) => {
                  const newTodo = spawn(factory, {
                    systemId: `cat`,
                  });
                  console.log("Created cat.");
                  console.log("system_id", newTodo._systemId);

                  return newTodo;
                },
              }),
            },
            {
              target: "Ready",
              actions: "handleSendMessage",
              // actions: sendTo(
              //   ({ system }) => {
              //     const cat = system.get("cat");
              //     console.log("cat", cat);
              //     return cat;
              //   },
              //   {
              //     type: "echoMessage" as const,
              //     contents: `hi hi`,
              //   },
              // ),
            },
          ],
          echoMessage: {
            actions: {
              type: "echoInput",
            },
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "echoMessage"; contents: string }
        | { type: "receiveInputFromUser"; contents: string }
        | {
            type: "Message";
            from_uri: string;
            to_uri: string;
            contents: string;
          },
    },
  },
  {
    actions: {
      handleSendMessage: ({ system, event }) => {
        const messageParts = event.contents.split(" ");
        let ref;
        if (messageParts[0].startsWith("@")) {
          ref = messageParts[0].substring(1);
        }
        const actor = ref ? system.get(ref) : undefined;
        console.log(
          "system",
          actor?._systemId ||
            (ref
              ? "no actor named " + ref + "\n using system ref"
              : "no actor referenced \n using system ref "),
          "",
        );
        console.log(`Sending message ${event.contents}`);
      },
      createActor: ({ context, event }) => {
        const messageContents = event.contents.split(" ");
        const name = messageContents[1];
        const instructions = messageContents.slice(2).join(" ");

        console.log(
          `Created actor with name ${name} and instructions ${instructions}`,
        );
      },
      echoInput: ({ context, event }) => {
        console.log(`echoInput works! ${event.contents}`);
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

const inputActor = createActor(machine, {
  systemId: "root-id",
}).start();

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
