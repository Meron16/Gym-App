import { Injectable } from "@nestjs/common";

export type TrainerSummary = {
  id: string;
  name: string;
  gymId: string;
  expertise: string[];
  tagline: string;
};

@Injectable()
export class TrainersService {
  private readonly trainers: TrainerSummary[] = [
    {
      id: "tr_1",
      name: "Sara Bekele",
      gymId: "iron-sanctuary",
      expertise: ["HIIT", "Strength"],
      tagline: "Explosive power, zero compromise.",
    },
    {
      id: "tr_2",
      name: "Daniel Tesfaye",
      gymId: "pulse-studio",
      expertise: ["Mobility", "Recovery"],
      tagline: "Move well, recover smarter.",
    },
  ];

  list(): TrainerSummary[] {
    return this.trainers;
  }
}
