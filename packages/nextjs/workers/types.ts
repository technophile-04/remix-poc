import { type SolcOutput } from "@tevm/solc";

export type MessageResult = {
  success: boolean;
  result: {
    data?: SolcOutput;
    id: string;
  };
  error?: string;
};
